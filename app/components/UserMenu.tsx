'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import Link from 'next/link'

export function UserMenu() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()

  if (!isSignedIn) {
    return (
      <div className="flex gap-3 items-center">
        <Link href="/sign-in" className="text-sm hover:text-gray-300">
          Sign In
        </Link>
        <Link href="/sign-up" className="text-sm bg-blue-600 px-3 py-1 rounded hover:bg-blue-700">
          Sign Up
        </Link>
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-center">
      <span className="text-sm text-gray-300">
        {user?.primaryEmailAddress?.emailAddress || user?.firstName || 'User'}
      </span>
      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
        {user?.firstName?.charAt(0).toUpperCase()}
      </div>
    </div>
  )
}

