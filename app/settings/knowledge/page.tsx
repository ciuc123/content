"use client"

import React, { useEffect, useState } from 'react'

export default function KnowledgePage() {
  const [cv, setCv] = useState('')
  const [exp, setExp] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/knowledge')
      .then((r) => r.json())
      .then((d) => {
        setCv(d.data.cv || '')
        setExp(d.data.experience || '')
      })
      .catch(() => {})
  }, [])

  async function save(key: 'cv' | 'experience') {
    setLoading(true)
    setMessage(null)
    try {
      const content = key === 'cv' ? cv : exp
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, content })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed')
      setMessage('Saved')
    } catch (err: any) {
      setMessage(String(err))
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Knowledge Base</h1>

      <div className="mt-4">
        <h2 className="font-medium">CV (cv.md)</h2>
        <textarea value={cv} onChange={(e) => setCv(e.target.value)} rows={10} className="w-full border p-2 rounded" />
        <div className="mt-2">
          <button onClick={() => save('cv')} className="px-3 py-1 bg-blue-600 text-white rounded">Save CV</button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-medium">Experience (experience.md)</h2>
        <textarea value={exp} onChange={(e) => setExp(e.target.value)} rows={10} className="w-full border p-2 rounded" />
        <div className="mt-2">
          <button onClick={() => save('experience')} className="px-3 py-1 bg-blue-600 text-white rounded">Save Experience</button>
        </div>
      </div>

      {message && <div className="mt-4 text-sm text-green-700">{message}</div>}
    </div>
  )
}

