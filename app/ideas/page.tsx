"use client"

import React, { useEffect, useState } from 'react'

type Idea = {
  title?: string
  why_it_matters?: string
  virality_score?: number
  business_score?: number
  [key: string]: any
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ideas')
      .then((r) => r.json())
      .then((d) => setIdeas(d.ideas || []))
      .catch(() => setIdeas([]))
  }, [])

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: text })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed')
      const list = await fetch('/api/ideas').then((r) => r.json())
      setIdeas(list.ideas || [])
      setMessage(`Saved ${json.count} ideas`)
    } catch (err: any) {
      setMessage(String(err))
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Ideas</h1>
      <p className="mt-2 text-sm text-gray-600">Paste Copilot output (JSON array) to import generated ideas quickly.</p>

      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder='Paste JSON array here: [{ "title": "...", "why_it_matters": "...", "virality_score": 5, "business_score": 7 }, ...]'
          className="w-full border p-2 rounded"
        />
        <div className="mt-2 flex gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'Saving...' : 'Import Ideas'}
          </button>
          <button type="button" onClick={async () => { setText(''); setMessage(null); }} className="px-4 py-2 border rounded">Clear</button>
        </div>
      </form>

      {message && <div className="mt-4 text-sm text-green-700">{message}</div>}

      <div className="mt-6">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="text-left">
              <th className="border-b p-2">Title</th>
              <th className="border-b p-2">Why it matters</th>
              <th className="border-b p-2">Virality</th>
              <th className="border-b p-2">Business</th>
            </tr>
          </thead>
          <tbody>
            {ideas.map((idea, idx) => (
              <tr key={idx} className="align-top">
                <td className="p-2 border-b">{idea.title || JSON.stringify(idea).slice(0, 80)}</td>
                <td className="p-2 border-b">{idea.why_it_matters || '-'}</td>
                <td className="p-2 border-b">{idea.virality_score ?? '-'}</td>
                <td className="p-2 border-b">{idea.business_score ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

