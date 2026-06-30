import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

/**
 * Hook to save and restore redirect URLs for post-login navigation
 * Usage: Call this hook in your layout or root component
 */
export function useRedirectAfterAuth() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // After sign-in, redirect to the saved URL
  useEffect(() => {
    if (!isLoaded) return

    // If user just signed in and has a redirect URL, use it
    if (isSignedIn && pathname === '/sign-in') {
      const redirectUrl = searchParams.get('redirect_url')
      if (redirectUrl) {
        // Clear the redirect URL and go to the page
        router.replace(redirectUrl)
      }
    }
  }, [isSignedIn, isLoaded, pathname, searchParams, router])
}

/**
 * Save current path to localStorage before redirecting to sign-in
 */
export function saveRedirectPath(currentPath: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_redirect_path', currentPath)
  }
}

/**
 * Get and clear the saved redirect path
 */
export function getAndClearRedirectPath(): string | null {
  if (typeof window === 'undefined') return null
  const path = localStorage.getItem('auth_redirect_path')
  if (path) {
    localStorage.removeItem('auth_redirect_path')
  }
  return path || null
}
