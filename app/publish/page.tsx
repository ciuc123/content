"use client"

import React, { useEffect, useState } from 'react'

export default function PublishPage() {
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null)
  const [research, setResearch] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState<any | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // Load selected idea from sessionStorage
    const stored = sessionStorage.getItem('selected_idea')
    if (stored) {
      try {
        const idea = JSON.parse(stored)
        setSelectedIdea(idea)
        setTitle(idea.title || '')
        setSlug(idea.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '')
      } catch (e) {
        console.error('Failed to parse stored idea:', e)
      }
    }
  }, [])

  useEffect(() => {
    // Load research and generated content if we have an idea
    if (selectedIdea?.id) {
      fetch('/api/research')
        .then((r) => r.json())
        .then((d) => {
          const entry = (d.research || []).find((r: any) => r.idea_id === selectedIdea.id)
          if (entry) setResearch(entry.content || '')
        })
        .catch(() => {})

      fetch('/api/generated')
        .then((r) => r.json())
        .then((d) => {
          const entry = (d.generated || []).find((g: any) => g.idea_id === selectedIdea.id)
          if (entry) setGeneratedContent(entry)
        })
        .catch(() => {})
    }
  }, [selectedIdea?.id])

  async function handlePublish(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, body, description: '' })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Publish failed')
      setMessage('✓ Publish request sent. ' + JSON.stringify(json.result || json))
    } catch (err: any) {
      setMessage(String(err))
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Publish</h1>
      <p className="mt-2 text-sm text-gray-600">Create a PR on the target blog repository. In dev the publish action is mocked by default and writes to <code>content/posts/</code>.</p>

      {selectedIdea && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h2 className="font-bold">📋 Idea Summary</h2>
          <p className="mt-2 text-sm"><strong>Title:</strong> {selectedIdea.title}</p>
          <p className="mt-1 text-sm"><strong>Why it matters:</strong> {selectedIdea.why_it_matters}</p>

          {research && (
            <>
              <p className="mt-3 text-sm font-medium">📚 Research Preview:</p>
              <div className="mt-1 p-2 bg-white border rounded text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                {research.slice(0, 300)}...
              </div>
            </>
          )}

          {generatedContent && (
            <>
              <p className="mt-3 text-sm font-medium">✨ Generated Content Available:</p>
              <ul className="mt-1 text-xs space-y-1">
                {generatedContent.linkedin_post && <li>✅ LinkedIn Post</li>}
                {generatedContent.blog_post && <li>✅ Blog Post</li>}
                {generatedContent.newsletter_post && <li>✅ Newsletter</li>}
              </ul>
            </>
          )}
        </div>
      )}

      <form onSubmit={handlePublish} className="mt-6 space-y-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Slug (kebab-case)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium">Body (Markdown)</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} className="w-full border p-2 rounded" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{loading ? 'Publishing...' : 'Publish'}</button>
          <a href="/ideas/generate" className="px-4 py-2 border rounded hover:bg-gray-50">Back to Generate</a>
          <a href="/ideas" className="px-4 py-2 border rounded hover:bg-gray-50">Back to Ideas</a>
        </div>
      </form>

      {message && <div className="mt-4 whitespace-pre-wrap text-sm">{message}</div>}
    </div>
  )
}
