"use client"

import React, { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function ApiKeyPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showKey, setShowKey] = useState(false)

  if (!isSignedIn) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">API Key Settings</h1>
        <p className="mt-2 text-gray-600">Please sign in to manage your API key.</p>
      </div>
    )
  }

  async function handleSaveApiKey(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey.trim()) {
      setMessage('Please enter an API key')
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/settings/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save API key')
      setMessage('✓ API key saved securely')
      setApiKey('')
    } catch (err: any) {
      setMessage('Error: ' + String(err))
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold">API Key Settings</h1>
      <p className="mt-2 text-sm text-gray-600">
        Add your API key to use AI-powered content generation. Your key is encrypted and stored securely.
      </p>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-medium text-sm mb-2">📝 How to get an API key:</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• For OpenAI: Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com/api-keys</a></li>
          <li>• For other providers: Check your provider's documentation</li>
        </ul>
      </div>

      <form onSubmit={handleSaveApiKey} className="mt-6">
        <label className="block text-sm font-medium mb-2">API Key</label>
        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="flex-1 border p-2 rounded"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 border rounded hover:bg-gray-50"
          >
            {showKey ? '🙈' : '👁️'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Your key is encrypted before being stored.</p>
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save API Key'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`mt-4 p-3 text-sm rounded ${
          message.startsWith('✓') 
            ? 'bg-green-50 border border-green-200 text-green-900'
            : 'bg-red-50 border border-red-200 text-red-900'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}

