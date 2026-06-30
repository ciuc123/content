'use client'

import { useAuth, useUser, SignOutButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function UserMenu() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close menu on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSignInClick = () => {
    // Save current path to localStorage before redirecting to sign-in
    if (pathname && pathname !== '/sign-in' && pathname !== '/sign-up') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_redirect_path', pathname)
      }
    }
  }

  if (!isSignedIn) {
    return (
      <div className="flex gap-3 items-center">
        <Link
          href="/sign-in"
          className="text-sm hover:text-gray-300 transition"
          onClick={handleSignInClick}
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="text-sm bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 transition"
        >
          Sign Up
        </Link>
      </div>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex gap-2 items-center hover:opacity-80 transition duration-200"
        title={user?.primaryEmailAddress?.emailAddress}
      >
        <span className="text-sm text-gray-300">
          {user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User'}
        </span>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:ring-2 hover:ring-blue-300 transition">
          {user?.firstName?.charAt(0).toUpperCase() || user?.primaryEmailAddress?.emailAddress?.charAt(0).toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <>
          {/* Dropdown Menu - Animated */}
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header with gradient */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <p className="font-semibold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/settings/knowledge"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="mr-2">⚙️</span>
                <span className="font-medium">Settings</span>
              </Link>

              <a
                href="https://dashboard.clerk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                <span className="mr-2">👤</span>
                <span className="font-medium">Account Settings</span>
              </a>

              <div className="border-t border-gray-200">
                <SignOutButton redirectUrl="/">
                  <button className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition font-medium">
                    <span className="mr-2">🚪</span>
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Ideas Engine
            </div>
          </div>
        </>
      )}
    </div>
  )
}
