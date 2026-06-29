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
      setMessage('✓ Research saved. Ready to generate content!')
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
      <h1 className="text-2xl font-bold">Research: {selected.title}</h1>
      <p className="mt-2 text-sm text-gray-600">
        💡 <strong>How to use:</strong><br/>
        1. Ask GitHub Copilot: "Research this topic: {selected.title}. Why it matters: {selected.why_it_matters}"<br/>
        2. Paste the research output below<br/>
        3. Click "Save Research" to continue to content generation
      </p>

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
    </div>
  )
}
