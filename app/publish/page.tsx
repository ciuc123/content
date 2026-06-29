"use client"

import React, { useState } from 'react'

export default function PublishPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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
      setMessage('Publish request sent. ' + JSON.stringify(json.result || json))
    } catch (err: any) {
      setMessage(String(err))
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Publish</h1>
      <p className="mt-2 text-sm text-gray-600">Create a PR on the target blog repository. In dev the publish action is mocked by default and writes to <code>content/posts/</code>.</p>

      <form onSubmit={handlePublish} className="mt-4 space-y-3">
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
          <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">{loading ? 'Publishing...' : 'Publish'}</button>
        </div>
      </form>

      {message && <div className="mt-4 whitespace-pre-wrap text-sm">{message}</div>}
    </div>
  )
}

