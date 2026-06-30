"use client"

import React, { useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { encryptApiKeyForTransit } from '@/lib/client-encryption'

export default function AccountSettingsPage() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showKey, setShowKey] = useState(false)

  if (!isSignedIn) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="mt-2 text-gray-600">Please sign in to manage your account.</p>
        </div>
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
      // Encrypt the API key on the client side before sending
      if (!user?.id) {
        throw new Error('User ID not available')
      }

      const encryptedApiKey = await encryptApiKeyForTransit(apiKey.trim(), user.id)

      const res = await fetch('/api/settings/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: encryptedApiKey,
          encrypted: true
        })
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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-1 text-gray-600">Manage your account and AI settings</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            <p className="text-sm text-gray-600 mt-1">Your account details</p>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {/* Avatar and Name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  {user?.firstName?.charAt(0).toUpperCase() || user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>

              {/* Profile Links */}
              <div className="pt-4 border-t border-gray-200">
                <a
                  href="https://dashboard.clerk.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                >
                  Edit profile on Clerk Dashboard →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">🔑 API Key for AI Features</h2>
            <p className="text-sm text-gray-600 mt-1">Add your API key to use AI-powered content generation</p>
          </div>

          <div className="p-6">
            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <h3 className="font-semibold text-sm text-blue-900 mb-3">📝 How to get an API key:</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    For <strong>OpenAI</strong>: Visit{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      platform.openai.com/api-keys
                    </a>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Get a free OpenAI API key, then fund your account ($5+ balance)</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>🔐 Your key is encrypted before sending (in transit) and before storage</span>
                </li>
              </ul>
            </div>

            {/* API Key Form */}
            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    title={showKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showKey ? '🙈 Hide' : '👁️ Show'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  🔒 Encrypted in your browser before sending • Re-encrypted before storage
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  {loading ? '💾 Saving...' : '💾 Save API Key'}
                </button>
                <Link
                  href="/settings/knowledge"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Knowledge Settings
                </Link>
              </div>
            </form>

            {/* Status Message */}
            {message && (
              <div
                className={`mt-4 p-4 rounded-lg text-sm font-medium transition-all ${
                  message.startsWith('✓')
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {message.startsWith('✓') ? '✅' : '❌'} {message}
              </div>
            )}
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 text-xs text-gray-700">
          <p className="font-semibold text-green-900 mb-3">🔐 Security - Multi-Layer Encryption</p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="text-green-600">✓</span>
              <span><strong>In Transit:</strong> Your API key is encrypted with AES-256-GCM in your browser before being sent to our servers</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-600">✓</span>
              <span><strong>At Rest:</strong> Upon arrival, it's decrypted and re-encrypted with AES-256-CBC server-side encryption before storage</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-600">✓</span>
              <span><strong>Access Control:</strong> Only decrypted in memory when needed to use AI features, never stored unencrypted</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-600">✓</span>
              <span><strong>Isolation:</strong> Each user's API key is unique and inaccessible to other users</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

