'use client'

import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export function AuthBanner() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) return null

  return (
    <div className="bg-blue-50 border-b border-blue-200 p-3 text-center">
      <p className="text-sm text-blue-900">
        💾 Your data is saved in your browser (not synced).
        <Link href="/sign-in" className="font-semibold text-blue-700 hover:text-blue-900 ml-1">
          Sign in
        </Link>
        {' '}to sync across devices.
      </p>
    </div>
  )
}

