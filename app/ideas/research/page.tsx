"use client"

import React, { useEffect, useState } from 'react'

export default function IdeaResearchPage() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [content, setContent] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ideas')
      .then((r) => r.json())
      .then((d) => setIdeas(d.ideas || []))
      .catch(() => setIdeas([]))
  }, [])

  useEffect(() => {
    const sel = ideas.find((i) => i.status === 'selected')
    if (sel) setSelected(sel)
  }, [ideas])

  async function saveResearch(e?: React.FormEvent) {
    e?.preventDefault()
    setMessage(null)
    try {
      const idx = ideas.findIndex((i) => i === selected)
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: idx, idea: selected, content })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed')
      setMessage('Research saved')
    } catch (err: any) {
      setMessage(String(err))
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
      <h1 className="text-2xl font-bold">Research for: {selected.title}</h1>
      <p className="mt-2 text-sm text-gray-600">Paste Copilot research output here (markdown suggested).</p>

      <form onSubmit={saveResearch} className="mt-4">
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="w-full border p-2 rounded" />
        <div className="mt-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save Research</button>
        </div>
      </form>

      {message && <div className="mt-4 text-sm text-green-700">{message}</div>}
    </div>
  )
}

