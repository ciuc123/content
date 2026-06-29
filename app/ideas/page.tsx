"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Idea = {
  title?: string
  why_it_matters?: string
  virality_score?: number
  business_score?: number
  [key: string]: any
}

export default function IdeasPage() {
  const router = useRouter()
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
      setText('')
      setMessage(`✓ Saved ${json.count} ideas`)
    } catch (err: any) {
      setMessage(String(err))
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Ideas</h1>
      <p className="mt-2 text-sm text-gray-600">Generate and manage content ideas.</p>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm font-medium mb-2">💡 Quick Start:</p>
        <p className="text-sm mb-2">Ask GitHub Copilot to generate 10 content ideas:</p>
        <code className="text-xs bg-white p-2 rounded block mb-2">
          Generate 10 unique content ideas for a software engineer's blog. For each idea, provide: title, why_it_matters, virality_score (1-10), business_score (1-10). Output as JSON array.
        </code>
        <p className="text-sm">Then copy the JSON output and paste it below.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <label className="block text-sm font-medium mb-2">Paste JSON Array of Ideas</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder='[{ "title": "...", "why_it_matters": "...", "virality_score": 5, "business_score": 7 }, ...]'
          className="w-full border p-2 rounded font-mono text-sm"
        />
        <div className="mt-2 flex gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
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
                <tr key={idx} className="align-top hover:bg-gray-50">
                  <td className="p-2 border-b font-medium">{idea.title || JSON.stringify(idea).slice(0, 80)}</td>
                  <td className="p-2 border-b text-sm">{idea.why_it_matters || '-'}</td>
                  <td className="p-2 border-b text-center">{idea.virality_score ?? '-'}</td>
                  <td className="p-2 border-b text-center">{idea.business_score ?? '-'}</td>
                  <td className="p-2 border-b">
                    <button
                      onClick={async () => {
                        try {
                          const r = await fetch('/api/ideas/select', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ index: idx })
                          })
                          const j = await r.json()
                          if (!r.ok) throw new Error(j?.error || 'Failed')
                          setMessage('✓ Idea selected')
                          // navigate to research page using Next router
                          setTimeout(() => router.push('/ideas/research'), 300)
                        } catch (err: any) {
                          setMessage(String(err))
                        }
                      }}
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
