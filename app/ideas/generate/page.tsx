"use client"

import React, { useEffect, useState } from 'react'

export default function IdeaGeneratePage() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null)
  const [research, setResearch] = useState<string>('')
  const [linkedin, setLinkedin] = useState('')
  const [blog, setBlog] = useState('')
  const [newsletter, setNewsletter] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/ideas')
      .then((r) => r.json())
      .then((d) => setIdeas(d.ideas || []))
      .catch(() => setIdeas([]))
  }, [])

  useEffect(() => {
    const idx = ideas.findIndex((i) => i.status === 'selected')
    if (idx >= 0) {
      setSelectedIdx(idx)
      setSelectedIdea(ideas[idx])
      // load research
      fetch('/api/research')
        .then((r) => r.json())
        .then((d) => {
          const entry = (d.research || []).find((r: any) => r.index === idx)
          if (entry) setResearch(entry.content || '')
        })
      // load generated
      fetch('/api/generated')
        .then((r) => r.json())
        .then((d) => {
          const entry = (d.generated || []).find((g: any) => g.index === idx)
          if (entry) {
            setLinkedin(entry.linkedin_post || '')
            setBlog(entry.blog_post || '')
            setNewsletter(entry.newsletter_post || '')
          }
        })
    }
  }, [ideas])

  async function saveGenerated(e?: React.FormEvent) {
    e?.preventDefault()
    if (selectedIdx === null) return setMessage('No selected idea')
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/generated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: selectedIdx, idea: selectedIdea, linkedin_post: linkedin, blog_post: blog, newsletter_post: newsletter })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed')
      setMessage('Generated content saved')
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
        ? `Write a 150-300 word LinkedIn post about this idea:\nTitle: ${selectedIdea.title}\nWhy: ${selectedIdea.why_it_matters}\nResearch: ${research}`
        : kind === 'blog'
        ? `Write a long-form blog article (1200-2000 words) about this idea:\nTitle: ${selectedIdea.title}\nWhy: ${selectedIdea.why_it_matters}\nResearch: ${research}`
        : `Write a short (300-500 word) newsletter piece about this idea:\nTitle: ${selectedIdea.title}\nWhy: ${selectedIdea.why_it_matters}\nResearch: ${research}`

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'AI generate failed')
      const text = json.text || ''
      if (kind === 'linkedin') setLinkedin(text)
      else if (kind === 'blog') setBlog(text)
      else setNewsletter(text)
      setMessage('✓ Content generated (paste from Copilot or use AI button)')
    } catch (err: any) {
      setMessage(`To generate content: 1) Copy the prompt below 2) Paste into GitHub Copilot 3) Paste result back here. Error was: ${String(err)}`)
    }
    setLoading(false)
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
      <p className="mt-2 text-sm text-gray-600">💡 <strong>Workflow:</strong> Click "Generate via AI" button → copy the prompt → paste into GitHub Copilot → paste the result back here</p>
      <p className="mt-2 text-sm text-gray-600">📄 <strong>Research:</strong></p>
      <div className="p-2 border rounded bg-gray-50 mt-2 whitespace-pre-wrap text-sm">{research || 'No research yet'}</div>

      <form onSubmit={saveGenerated} className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">LinkedIn Post (150-300 words)</label>
          <textarea value={linkedin} onChange={(e) => setLinkedin(e.target.value)} rows={6} className="w-full border p-2 rounded" placeholder="Paste LinkedIn post here..." />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => generateViaAI('linkedin')} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Copy Prompt</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Blog Post (1200-2000 words markdown)</label>
          <textarea value={blog} onChange={(e) => setBlog(e.target.value)} rows={16} className="w-full border p-2 rounded font-mono text-sm" placeholder="Paste blog post here..." />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => generateViaAI('blog')} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Copy Prompt</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Newsletter (300-500 words)</label>
          <textarea value={newsletter} onChange={(e) => setNewsletter(e.target.value)} rows={8} className="w-full border p-2 rounded" placeholder="Paste newsletter content here..." />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => generateViaAI('newsletter')} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Copy Prompt</button>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{loading ? 'Saving...' : 'Save Generated'}</button>
          <a href="/publish" className="px-4 py-2 border rounded hover:bg-gray-50">Next: Publish</a>
        </div>
      </form>

      {message && <div className="mt-4 p-3 text-sm bg-blue-50 border border-blue-200 rounded whitespace-pre-wrap">{message}</div>}
    </div>
  )
}
