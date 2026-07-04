"use client"

import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function IdeaGeneratePage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null)
  const [research, setResearch] = useState<string>('')
  const [linkedin, setLinkedin] = useState('')
  const [blog, setBlog] = useState('')
  const [newsletter, setNewsletter] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check sessionStorage first for immediate display
    const stored = sessionStorage.getItem('selected_idea')
    if (stored) {
      try {
        const idea = JSON.parse(stored)
        setSelectedIdea(idea)

        // Load research for this idea
        if (isSignedIn && idea?.id) {
          fetch('/api/research')
            .then((r) => r.json())
            .then((d) => {
              const entry = (d.research || []).find((r: any) => r.idea_id === idea.id)
              if (entry) setResearch(entry.content || '')
            })
            .catch(() => {})

          // Load generated content for this idea
          fetch('/api/generated')
            .then((r) => r.json())
            .then((d) => {
              const entry = (d.generated || []).find((g: any) => g.idea_id === idea.id)
              if (entry) {
                setLinkedin(entry.linkedin_post || '')
                setBlog(entry.blog_post || '')
                setNewsletter(entry.newsletter_post || '')
              }
            })
            .catch(() => {})
        }
      } catch (e) {
        console.error('Failed to parse stored idea:', e)
      }
    }
  }, [isSignedIn])

  async function saveGenerated(e?: React.FormEvent) {
    e?.preventDefault()
    if (!selectedIdea) return setMessage('No selected idea')
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/generated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: selectedIdea, linkedin_post: linkedin, blog_post: blog, newsletter_post: newsletter })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed')

      // Update session storage with idea and persist to next page
      sessionStorage.setItem('selected_idea', JSON.stringify(selectedIdea))

      setMessage('✓ Generated content saved. Ready to publish!')
    } catch (err: any) {
      setMessage(String(err))
    }
    setLoading(false)
  }

  async function generateViaAI(kind: 'linkedin' | 'blog' | 'newsletter') {
    if (!selectedIdea) return setMessage('No selected idea')
    setLoading(true)
    setMessage(null)
    try {
      const prompt = kind === 'linkedin'
        ? `You are a professional content writer. Write ONLY a LinkedIn post. No explanations, no metadata, no introduction text. Just the post content.

Title: ${selectedIdea.title}
Why it matters: ${selectedIdea.why_it_matters}
Research: ${research}

Requirements: 150-300 words, professional tone, engaging, call-to-action included.

Start writing the LinkedIn post now:`
        : kind === 'blog'
        ? `You are a professional content writer. Write ONLY a blog article in markdown. No explanations, no metadata, no introduction text. Just the article content.

Title: ${selectedIdea.title}
Why it matters: ${selectedIdea.why_it_matters}
Research: ${research}

Requirements: 1200-2000 words, markdown formatted with headers, professional tone, multiple sections, conclusion included.

Start writing the blog article now:`
        : `You are a professional content writer. Write ONLY a newsletter piece. No explanations, no metadata, no introduction text. Just the newsletter content.

Title: ${selectedIdea.title}
Why it matters: ${selectedIdea.why_it_matters}
Research: ${research}

Requirements: 300-500 words, engaging tone, conversational, actionable insights.

Start writing the newsletter piece now:`

      // Use content-type-specific token limits
      const maxTokens = kind === 'blog' ? 4000 : kind === 'newsletter' ? 2000 : 1500

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, options: { maxTokens } })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'AI generate failed')

      // Extract just the content (remove any metadata/instructions the AI might have added)
      let text = json.text || ''

      // Remove common AI response patterns at the beginning
      text = text
        .replace(/^[\s\S]*?(?:Done!|Complete!|Created!|Here's|I've|I\s+(?:created|written|generated))[\s\S]*?(?:\n\n|──|—)/i, '')
        .replace(/^[\s\S]*?(?=^[A-Z][a-z]+ [A-Z]|^#{1,6}\s|^```|^\d+\.|^●|^•|^-\s)/m, '')
        .replace(/^[^]*?(?:\n\+\s+|Created|Written|Here's).*(?:\n\n|$)/i, '')
        .trim()

      if (kind === 'linkedin') setLinkedin(text)
      else if (kind === 'blog') setBlog(text)
      else setNewsletter(text)
      setMessage('✓ Content generated by AI')
    } catch (err: any) {
      setMessage(`Error generating content: ${String(err)}`)
    }
    setLoading(false)
  }

  async function handleTakeFurther() {
    try {
      sessionStorage.setItem('selected_idea', JSON.stringify(selectedIdea))
      router.push('/publish')
    } catch (err: any) {
      setMessage('Error: ' + String(err))
    }
  }

  if (!selectedIdea) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Generate Content</h1>
        <p className="mt-2">No selected idea. Select one from the Ideas page first.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Generate Content for: {selectedIdea.title}</h1>
      <p className="mt-2 text-sm text-gray-600">💡 <strong>Workflow:</strong> Click "Generate via AI" to automatically generate content using GitHub Copilot</p>
      <p className="mt-2 text-sm text-gray-600">📄 <strong>Research:</strong></p>
      <div className="p-2 border rounded bg-gray-50 mt-2 whitespace-pre-wrap text-sm">{research || 'No research yet'}</div>

      <form onSubmit={saveGenerated} className="mt-6 space-y-6">
         <div>
           <label className="block text-sm font-medium mb-2">LinkedIn Post (150-300 words)</label>
           <textarea value={linkedin} onChange={(e) => setLinkedin(e.target.value)} rows={6} className="w-full border p-2 rounded" placeholder="AI-generated LinkedIn post will appear here..." />
           <div className="mt-2 flex gap-2">
             <button type="button" onClick={() => generateViaAI('linkedin')} disabled={!isSignedIn} title={!isSignedIn ? 'Sign in required to use AI features' : ''} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{!isSignedIn ? '🔒 Sign in' : 'Generate via AI'}</button>
           </div>
         </div>

         <div>
           <label className="block text-sm font-medium mb-2">Blog Post (1200-2000 words markdown)</label>
           <textarea value={blog} onChange={(e) => setBlog(e.target.value)} rows={16} className="w-full border p-2 rounded font-mono text-sm" placeholder="AI-generated blog post will appear here..." />
           <div className="mt-2 flex gap-2">
             <button type="button" onClick={() => generateViaAI('blog')} disabled={!isSignedIn} title={!isSignedIn ? 'Sign in required to use AI features' : ''} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{!isSignedIn ? '🔒 Sign in' : 'Generate via AI'}</button>
           </div>
         </div>

         <div>
           <label className="block text-sm font-medium mb-2">Newsletter (300-500 words)</label>
           <textarea value={newsletter} onChange={(e) => setNewsletter(e.target.value)} rows={8} className="w-full border p-2 rounded" placeholder="AI-generated newsletter content will appear here..." />
           <div className="mt-2 flex gap-2">
             <button type="button" onClick={() => generateViaAI('newsletter')} disabled={!isSignedIn} title={!isSignedIn ? 'Sign in required to use AI features' : ''} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{!isSignedIn ? '🔒 Sign in' : 'Generate via AI'}</button>
           </div>
         </div>

        <div className="flex gap-2 pt-4 border-t">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{loading ? 'Saving...' : 'Save Generated'}</button>
          <button 
            type="button"
            onClick={handleTakeFurther}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Take Further
          </button>
          <a href="/ideas" className="px-4 py-2 border rounded hover:bg-gray-50">Back to Ideas</a>
        </div>
      </form>

      {message && <div className="mt-4 p-3 text-sm bg-blue-50 border border-blue-200 rounded whitespace-pre-wrap">{message}</div>}
    </div>
  )
}
