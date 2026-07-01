"use client"

import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

export default function IdeaResearchPage() {
  const { isSignedIn } = useAuth()
  const [ideas, setIdeas] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [content, setContent] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')

  useEffect(() => {
    // Check sessionStorage first for immediate display (non-blocking)
    const stored = sessionStorage.getItem('selected_idea')
    if (stored) {
      try {
        const idea = JSON.parse(stored)
        setSelected(idea)
      } catch (e) {
        console.error('Failed to parse stored idea:', e)
      }
    }

    // Load all ideas from API (for signed-in users)
    if (isSignedIn) {
      fetch('/api/ideas')
        .then((r) => r.json())
        .then((d) => setIdeas(d.ideas || []))
        .catch(() => setIdeas([]))
    }
  }, [isSignedIn])

  useEffect(() => {
    // If we loaded ideas from API and have one with 'researched' status, sync it
    if (ideas.length > 0 && !selected?.id) {
      const researched = ideas.find((i) => i.status === 'researched')
      if (researched) setSelected(researched)
    }
  }, [ideas, selected?.id])

   async function saveResearch(e?: React.FormEvent) {
     e?.preventDefault()
     setMessage(null)
     try {
       if (!content.trim()) {
         setMessage('Please enter research content')
         return
       }

       const idx = ideas.findIndex((i) => i === selected)
       const res = await fetch('/api/research', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ index: idx, idea: selected, content })
       })
       const json = await res.json()
       if (!res.ok) throw new Error(json?.error || 'Failed')

       // Update status in background (fire-and-forget for authenticated users)
       if (isSignedIn && selected?.id) {
         fetch('/api/ideas', {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ idea_id: selected.id, status: 'generated' })
         }).catch(() => {})
       }

       setMessage('✓ Research saved. Ready to generate content!')
       setContent('')

       // Reload ideas to reflect updated status
       if (isSignedIn) {
         setTimeout(() => {
           fetch('/api/ideas')
             .then((r) => r.json())
             .then((d) => setIdeas(d.ideas || []))
             .catch(() => {})
         }, 500) // Wait 500ms for database to update
       }
     } catch (err: any) {
       setMessage(String(err))
     }
   }

  async function generateResearchViaAI() {
    if (!selected?.title) {
      setMessage('No idea selected')
      return
    }

    setAiLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateResearch',
          idea: selected
        })
      })
      const json = await res.json()
      if (!res.ok) {
        // Check if it's an API key configuration issue
        if (res.status === 401 && json?.error?.includes('API key')) {
          setMessage(`⚠️ API key not configured. Please go to Settings → API Key and add your GitHub Copilot API key, then try again.`)
        } else {
          setMessage('Error generating research: ' + String(json?.error || 'Failed to generate') + '. You can try the manual method below.')
        }
        return
      }

      if (json.success && json.data) {
        // Extract research from nested data structure
        const researchContent = json.data.research || json.data
        setContent(typeof researchContent === 'string' ? researchContent : JSON.stringify(researchContent))
        setMessage('✓ Research generated! Review and click "Save Research" to continue.')
      } else {
        throw new Error('Invalid response format from AI')
      }
    } catch (err: any) {
      setMessage('Error generating research: ' + String(err) + '. You can try the manual method below.')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleImportResearch(e?: React.FormEvent) {
    e?.preventDefault()
    setImporting(true)
    setMessage(null)
    try {
      if (!importText.trim()) {
        setMessage('Please paste research content')
        setImporting(false)
        return
      }

      // Try to parse as JSON first (for structured research)
      let researchContent = ''
      try {
        const parsed = JSON.parse(importText)
        researchContent = parsed.content || JSON.stringify(parsed, null, 2)
      } catch {
        // Not JSON, treat as plain text
        researchContent = importText.trim()
      }

      setContent(researchContent)
      setImportText('')
      setMessage('✓ Research imported! Review and click "Save Research" to continue.')
    } catch (err: any) {
      setMessage('Error importing research: ' + String(err))
    } finally {
      setImporting(false)
    }
  }

  if (!selected) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Research</h1>
        <p className="mt-2">No selected idea yet. Use the Ideas page and click "Take Further" on an idea.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Research: {selected.title}</h1>
      <p className="mt-2 text-sm text-gray-600">
        💡 <strong>How to use:</strong><br/>
        1. {isSignedIn ? 'Click "Generate via AI" below or ' : ''}Ask GitHub Copilot: "Research this topic: {selected.title}. Why it matters: {selected.why_it_matters}"<br/>
        2. Paste the research output below<br/>
        3. Click "Save Research" to continue to content generation
      </p>

      {isSignedIn && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
          <button
            onClick={generateResearchViaAI}
            disabled={aiLoading}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {aiLoading ? '⏳ Generating research...' : '✨ Generate Research via AI'}
          </button>
        </div>
      )}

      {!isSignedIn && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm font-medium mb-2">📋 Import Pre-Made Research:</p>
          <form onSubmit={handleImportResearch} className="space-y-2">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              placeholder="Paste research content (plain text or JSON) from GitHub Copilot here..."
              className="w-full border p-2 rounded font-mono text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={importing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Import Research'}
              </button>
              <button
                type="button"
                onClick={() => { setImportText(''); setMessage(null); }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

       <form onSubmit={saveResearch} className="mt-4">
         <label className="block text-sm font-medium mb-2">Research Content (Markdown)</label>
         <textarea
           value={content}
           onChange={(e) => setContent(e.target.value)}
           rows={12}
           className="w-full border p-2 rounded"
           placeholder="Paste research output from GitHub Copilot here..."
         />
         <div className="mt-2 flex gap-2">
           <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Research</button>
         </div>
       </form>

       {message && <div className="mt-4 p-3 text-sm bg-green-50 border border-green-200 rounded">{message}</div>}

       {/* Ideas & Research Status Table */}
       {isSignedIn && ideas.length > 0 && (
         <div className="mt-8">
           <h2 className="text-xl font-bold mb-4">Ideas & Research Status</h2>
           <div className="overflow-x-auto border rounded">
             <table className="w-full text-sm">
               <thead className="bg-gray-100 border-b">
                 <tr>
                   <th className="px-4 py-2 text-left">Title</th>
                   <th className="px-4 py-2 text-left">Status</th>
                   <th className="px-4 py-2 text-left">Why It Matters</th>
                 </tr>
               </thead>
               <tbody>
                 {ideas.map((idea) => (
                   <tr key={idea.id} className={`border-b ${idea === selected ? 'bg-blue-50' : ''}`}>
                     <td className="px-4 py-2 font-medium">{idea.title}</td>
                     <td className="px-4 py-2">
                       <span className={`px-2 py-1 rounded text-xs font-semibold ${
                         idea.status === 'generated' ? 'bg-green-100 text-green-800' :
                         idea.status === 'researched' ? 'bg-blue-100 text-blue-800' :
                         idea.status === 'new' ? 'bg-gray-100 text-gray-800' :
                         'bg-yellow-100 text-yellow-800'
                       }`}>
                         {idea.status || 'new'}
                       </span>
                     </td>
                     <td className="px-4 py-2 text-gray-600">{idea.why_it_matters}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       )}
    </div>
  )
}
