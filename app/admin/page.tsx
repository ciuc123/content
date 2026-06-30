"use client"

import { useAuth, useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AdminStats {
  totalUsers: number
  admins: number
  activeApiKeys: number
}

export default function AdminPage() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/admin/check', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (res.status === 403) {
          setIsAdmin(false)
          setError('You do not have admin privileges')
          setLoading(false)
          return
        }

        if (res.status === 401) {
          setIsAdmin(false)
          setError('Please sign in to access the admin panel')
          setLoading(false)
          return
        }

        if (res.ok) {
          const data = await res.json()
          setIsAdmin(true)
          setStats(data.stats)
          setError(null)
        } else {
          const data = await res.json()
          setError(data.error || 'Failed to load admin panel')
        }
      } catch (err) {
        console.error('Failed to check admin status:', err)
        setError('Failed to load admin panel')
      }
      setLoading(false)
    }

    if (isSignedIn) {
      checkAdmin()
    } else {
      setLoading(false)
    }
  }, [isSignedIn])

  if (!isSignedIn) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="mt-2 text-gray-600">Please sign in to access the admin panel.</p>
          <Link href="/sign-in" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin || error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-gray-600">{error || "You don't have admin privileges."}</p>
          <Link href="/ideas" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Back to App
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.firstName || 'Admin'}</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Users Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold mt-2 text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="text-4xl opacity-20">👥</div>
              </div>
            </div>

            {/* Admins Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Admins</p>
                  <p className="text-3xl font-bold mt-2 text-gray-900">{stats.admins}</p>
                </div>
                <div className="text-4xl opacity-20">👑</div>
              </div>
            </div>

            {/* API Keys Configured Card */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">API Keys Set</p>
                  <p className="text-3xl font-bold mt-2 text-gray-900">{stats.activeApiKeys}</p>
                </div>
                <div className="text-4xl opacity-20">🔑</div>
              </div>
            </div>
          </div>
        )}

        {/* Info Sections */}
        <div className="space-y-6">
          {/* Setup Instructions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🚀 Setup Instructions</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p className="font-medium mb-1">1. Make Users Admin</p>
                <p className="text-gray-600">To give someone admin access, run this SQL in Supabase:</p>
                <code className="block bg-gray-100 p-3 mt-2 rounded text-xs overflow-x-auto">
                  UPDATE users SET is_admin = true WHERE clerk_id = &apos;user_ID_HERE&apos;;
                </code>
              </div>

              <div>
                <p className="font-medium mb-1">2. Find Your Clerk User ID</p>
                <p className="text-gray-600">Run this query in Supabase to find your ID:</p>
                <code className="block bg-gray-100 p-3 mt-2 rounded text-xs overflow-x-auto">
                  SELECT clerk_id, is_admin FROM users ORDER BY created_at DESC LIMIT 1;
                </code>
              </div>

              <div>
                <p className="font-medium mb-1">3. Apply Database Migration</p>
                <p className="text-gray-600">Copy this SQL and run in Supabase SQL Editor:</p>
                <code className="block bg-gray-100 p-3 mt-2 rounded text-xs overflow-x-auto">
                  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
                  <br />
                  CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
                </code>
              </div>
            </div>
          </div>

          {/* Admin Features */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">✨ Admin Features</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>View system statistics and user counts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Monitor API key adoption across users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Manage admin privileges for other users</span>
              </li>
            </ul>
          </div>

          {/* Documentation */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">📚 Documentation</h2>
            <p className="text-sm text-blue-800 mb-4">
              For more information about the admin system and migrations, see:
            </p>
            <div className="space-y-2">
              <a href="/docs/auth/README.md" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <span>→</span> Authentication Documentation
              </a>
              <a href="#" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <span>→</span> MIGRATIONS.md (Create this file for reference)
              </a>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 flex gap-4">
          <Link href="/ideas" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
            Back to App
          </Link>
          <Link href="/settings/account" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Account Settings
          </Link>
        </div>
      </div>
    </div>
  )
}

