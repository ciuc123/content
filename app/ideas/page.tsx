"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

type Idea = {
  title?: string
  why_it_matters?: string
  virality_score?: number
  business_score?: number
  [key: string]: any
}

const STORAGE_KEY = 'ideas_temp'

export default function IdeasPage() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [ideas, setIdeas] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [hasLoadedAuth, setHasLoadedAuth] = useState(false)
  const [topic, setTopic] = useState('')
  const [generateLoading, setGenerateLoading] = useState(false)
  const [ideaCount, setIdeaCount] = useState(10)

   useEffect(() => {
     // Load ideas from API (if signed in) or localStorage (if not)
     if (isSignedIn !== null) {
       setHasLoadedAuth(true)

       if (isSignedIn) {
         // User is authenticated - load from API (Supabase)
         fetch('/api/ideas')
           .then((r) => {
             if (!r.ok) throw new Error(`Failed to load ideas: ${r.statusText}`)
             return r.json()
           })
           .then((d) => {
             setIdeas(d.ideas || [])

             // After loading from server, check if there's local data to migrate
             const localIdeas = localStorage.getItem(STORAGE_KEY)
             if (localIdeas) {
               try {
                 const parsed = JSON.parse(localIdeas)
                 if (Array.isArray(parsed) && parsed.length > 0) {
                   setMessage(`💾 Found ${parsed.length} local ideas. Migrating to cloud...`)

                   // Migrate local ideas to Supabase
                   fetch('/api/ideas', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ payload: parsed })
                   })
                     .then((r) => {
                       if (!r.ok) throw new Error('Failed to migrate')
                       return r.json()
                     })
                     .then((res) => {
                       if (res.ok) {
                         // Clear local storage after successful migration
                         localStorage.removeItem(STORAGE_KEY)
                         setMessage(`✓ Migrated ${res.count} ideas to cloud`)

                         // Reload ideas to show migrated ones
                         fetch('/api/ideas')
                           .then((r) => {
                             if (r.ok) return r.json()
                             throw new Error('Failed to reload')
                           })
                           .then((d) => setIdeas(d.ideas || []))
                           .catch(() => {})
                       }
                     })
                     .catch((err) => {
                       setMessage('Could not migrate ideas to cloud. They are still saved locally.')
                     })
                 }
               } catch (e) {
                 console.error('Error parsing local ideas:', e)
               }
             }
           })
           .catch((err) => {
             console.error('Failed to load ideas:', err)
             setIdeas([])
           })
       } else {
         // User is not authenticated - load from localStorage
         const stored = localStorage.getItem(STORAGE_KEY)
         setIdeas(stored ? JSON.parse(stored) : [])
       }
     }
   }, [isSignedIn])

   async function handleSubmit(e?: React.FormEvent) {
     e?.preventDefault()
     setLoading(true)
     setMessage(null)
     try {
       let newIdeas: any[] = []

       // Parse input
       if (typeof text === 'string') {
         newIdeas = JSON.parse(text)
       } else {
         newIdeas = Array.isArray(text) ? text : [text]
       }

       if (!Array.isArray(newIdeas)) {
         throw new Error('Input must be a JSON array')
       }

        if (isSignedIn) {
          // Save to API (Supabase)
          const res = await fetch('/api/ideas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload: newIdeas })
          })

         // Parse response safely
         let json: any = {}
         try {
           json = await res.json()
         } catch (parseErr) {
           throw new Error(`Invalid response from server: ${res.statusText}`)
         }

         if (!res.ok) throw new Error(json?.error || `Failed: ${res.statusText}`)

         // Refresh from server
         const listRes = await fetch('/api/ideas')
         if (!listRes.ok) throw new Error('Failed to refresh ideas')
         const list = await listRes.json()
         setIdeas(list.ideas || [])
         setMessage(`✓ Synced ${json.count} ideas to cloud`)
       } else {
         // Save to localStorage
         const stored = localStorage.getItem(STORAGE_KEY)
         const existing = stored ? JSON.parse(stored) : []
         const updated = [
           ...existing,
           ...newIdeas.map((idea: any) => ({
             id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
             ...idea,
             created_at: new Date().toISOString(),
           }))
         ]
         localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
         setIdeas(updated)
         setMessage(`✓ Saved ${newIdeas.length} ideas locally`)
       }

       setText('')
     } catch (err: any) {
       setMessage('Error: ' + String(err))
     }
     setLoading(false)
   }

   async function handleSelect(idea: any) {
     try {
       // Store selected idea in sessionStorage immediately (non-blocking)
       sessionStorage.setItem('selected_idea', JSON.stringify(idea))

       // If user is signed in, ensure the idea is persisted to the server before navigating
       if (isSignedIn) {
         const idStr = idea?.id ? String(idea.id) : ''
         const isLocal = !idea?.id || idStr.startsWith('local_') || idStr.startsWith('idea_')
         let serverIdea = idea

         if (isLocal) {
           // Create the idea on the server so it has a proper DB id
           const res = await fetch('/api/ideas', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ payload: [{
               title: idea.title,
               why_it_matters: idea.why_it_matters,
               virality_score: idea.virality_score,
               business_score: idea.business_score,
             }] })
           })

           const json = await res.json().catch(() => ({}))

           if (!res.ok) {
             // Show error and do not navigate to research (must be synced first)
             setMessage(json?.error || 'Could not sync idea to cloud. Please try again.')
             return
           }

           // Prefer explicit `inserted` return from API
           if (json?.inserted && Array.isArray(json.inserted) && json.inserted.length > 0) {
             serverIdea = json.inserted[0]
           } else if (json?.count && json.count > 0) {
             // Fallback: try to refresh list and find the created idea by title
             try {
               const listRes = await fetch('/api/ideas')
               if (listRes.ok) {
                 const listJson = await listRes.json()
                 const found = (listJson.ideas || []).find((i: any) => i.title === idea.title && i.why_it_matters === idea.why_it_matters)
                 if (found) serverIdea = found
               }
             } catch (e) {
               // ignore
             }
           }

           // Update session storage with the server-backed idea
           sessionStorage.setItem('selected_idea', JSON.stringify(serverIdea))
         }

         // Mark the idea as selected on the server (use status 'selected')
         if (serverIdea?.id) {
           fetch('/api/ideas', {
             method: 'PATCH',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ idea_id: serverIdea.id, status: 'selected' })
           }).catch(() => {})
         }
       }

       setMessage('✓ Idea selected')
       router.push('/ideas/research')
     } catch (err: any) {
       setMessage(String(err))
     }
   }

   async function handleGenerateIdeas(e?: React.FormEvent) {
     e?.preventDefault()
     if (!topic.trim()) {
       setMessage('Please enter a topic')
       return
     }

     setGenerateLoading(true)
     setMessage(null)
     try {
       const res = await fetch('/api/ai/agent', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           action: 'generateIdeas',
           topic: topic.trim(),
           count: ideaCount
         })
       })
       const json = await res.json()
       if (!res.ok) {
         // Check if it's an API key configuration issue
         if (res.status === 401 && json?.error?.includes('API key')) {
           setMessage(`⚠️ API key not configured. Please go to Settings → API Key and add your GitHub Copilot API key, then try again.`)
         } else {
           throw new Error(json?.error || 'Failed to generate ideas')
         }
         return
       }

       if (json.success && json.data && Array.isArray(json.data)) {
         // Populate the text field with the generated ideas as JSON
         setText(JSON.stringify(json.data, null, 2))
         setMessage(`✓ Generated ${json.data.length} ideas! Review and click "Import Ideas" to save them.`)
       } else {
         throw new Error('Invalid response format from AI')
       }
     } catch (err: any) {
       setMessage('Error generating ideas: ' + String(err) + '. You can try the manual method below.')
     }
     setGenerateLoading(false)
   }

  if (!hasLoadedAuth) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Ideas</h1>
      <p className="mt-2 text-sm text-gray-600">Generate and manage content ideas.</p>

      {!isSignedIn && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900">
          💡 Using browser storage (local). Sign in to sync across devices.
        </div>
      )}

      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded">
        <h2 className="text-sm font-bold mb-3">🤖 Generate Ideas with AI</h2>
        <form onSubmit={handleGenerateIdeas} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Topic or Subject</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., DevOps best practices, AI in content creation, remote work trends..."
              className="w-full border p-2 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of Ideas</label>
            <input
              type="number"
              value={ideaCount}
              onChange={(e) => setIdeaCount(Math.max(1, parseInt(e.target.value) || 10))}
              min="1"
              max="50"
              className="w-full border p-2 rounded text-sm"
            />
          </div>
           <button
             type="submit"
             disabled={generateLoading || !isSignedIn}
             title={!isSignedIn ? 'Sign in required to use AI features' : ''}
             className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
           >
             {!isSignedIn ? '🔒 Sign in to generate' : (generateLoading ? '⏳ Generating...' : '✨ Generate Ideas')}
           </button>
        </form>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm font-medium mb-2">📋 Or Import Pre-Made Ideas:</p>
        <p className="text-sm mb-2">If you have ideas in JSON format from another source, paste them below:</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <label className="block text-sm font-medium mb-2">Import JSON Array of Ideas</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder='[{ "title": "...", "why_it_matters": "...", "virality_score": 5, "business_score": 7 }, ...]'
          className="w-full border p-2 rounded font-mono text-sm"
        />
        <div className="mt-2 flex gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Import Ideas'}
          </button>
          <button type="button" onClick={() => { setText(''); setMessage(null); }} className="px-4 py-2 border rounded hover:bg-gray-50">Clear</button>
        </div>
      </form>

      {message && <div className="mt-4 p-3 text-sm bg-green-50 border border-green-200 rounded">{message}</div>}

      <div className="mt-6">
        <h2 className="text-lg font-medium mb-4">Ideas ({ideas.length})</h2>
        {ideas.length === 0 ? (
          <p className="text-gray-500">No ideas yet. Generate some with Copilot and import them above.</p>
        ) : (
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="text-left bg-gray-50">
                <th className="border-b p-2">Title</th>
                <th className="border-b p-2">Why it matters</th>
                <th className="border-b p-2">Virality</th>
                <th className="border-b p-2">Business</th>
                <th className="border-b p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ideas.map((idea, idx) => (
                <tr key={idea.id || idx} className="align-top hover:bg-gray-50">
                  <td className="p-2 border-b font-medium">{idea.title || JSON.stringify(idea).slice(0, 80)}</td>
                  <td className="p-2 border-b text-sm">{idea.why_it_matters || '-'}</td>
                  <td className="p-2 border-b text-center">{idea.virality_score ?? '-'}</td>
                  <td className="p-2 border-b text-center">{idea.business_score ?? '-'}</td>
                  <td className="p-2 border-b">
                    <button
                      onClick={() => handleSelect(idea)}
                      className="px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                    >
                      Take Further
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
