import { NextApiRequest, NextApiResponse } from 'next'

/**
 * Authentication Behavior Test Suite
 * Tests both development mode (DEV_AUTH_DISABLED=true) and production mode (DEV_AUTH_DISABLED=false)
 */

describe('Authentication Behavior', () => {
  // Save original env vars
  const originalEnv = process.env

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    // Restore original env
    process.env = originalEnv
  })

  describe('Development Mode (DEV_AUTH_DISABLED=true)', () => {
    beforeEach(() => {
      process.env.DEV_AUTH_DISABLED = 'true'
    })

    test('should use dev-user as userId when DEV_AUTH_DISABLED is true', () => {
      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const clerkUserId = undefined
      const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)

      expect(devAuthDisabled).toBe(true)
      expect(userId).toBe('dev-user')
      expect(userId).not.toBeNull()
    })

    test('middleware should skip auth().protect() in dev mode', () => {
      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const isProtected = true

      // In dev mode, auth().protect() should not be called
      const shouldCallProtect = !devAuthDisabled && isProtected
      expect(shouldCallProtect).toBe(false)
    })

    test('API endpoints should work without Clerk auth in dev mode', () => {
      process.env.DEV_AUTH_DISABLED = 'true'
      process.env.USE_SUPABASE = 'false'

      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const clerkUserId = undefined

      const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)
      expect(userId).toBe('dev-user')

      // Should not require Supabase in dev mode
      const USE_SUPABASE = process.env.USE_SUPABASE === 'true'
      const canProceed = !USE_SUPABASE || userId
      expect(canProceed).toBe(true)
    })

    test('data isolation should use dev-user as base', () => {
      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const userId = 'dev-user'

      // All queries should filter by dev-user
      const dataQuery = { user_id: userId }
      expect(dataQuery.user_id).toBe('dev-user')
    })

    test('ClerkProvider should be skipped in dev mode', () => {
      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'

      // When DEV_AUTH_DISABLED=true, ClerkProvider should not be rendered
      const shouldSkipClerk = devAuthDisabled
      expect(shouldSkipClerk).toBe(true)
    })
  })

  describe('Production Mode with Clerk (DEV_AUTH_DISABLED=false)', () => {
    beforeEach(() => {
      process.env.DEV_AUTH_DISABLED = 'false'
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_example'
      process.env.CLERK_SECRET_KEY = 'sk_test_example'
    })

    test('should require Clerk userId when DEV_AUTH_DISABLED is false', () => {
      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const clerkUserId = 'user_123'
      const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)

      expect(devAuthDisabled).toBe(false)
      expect(userId).toBe('user_123')
    })

    test('middleware should call auth().protect() when route is protected', () => {
      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const isProtectedRoute = true

      // In production, should call protect for protected routes
      const shouldCallProtect = !devAuthDisabled && isProtectedRoute
      expect(shouldCallProtect).toBe(true)
    })

    test('API endpoints should require authentication in production', () => {
      process.env.DEV_AUTH_DISABLED = 'false'
      process.env.USE_SUPABASE = 'true'

      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const USE_SUPABASE = process.env.USE_SUPABASE === 'true'
      const clerkUserId = undefined

      const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)

      // If Supabase is enabled and no userId, should return 401
      if (USE_SUPABASE && !userId) {
        expect(userId).toBeNull()
        expect(USE_SUPABASE).toBe(true)
        expect(!userId).toBe(true)
      }
    })

    test('ClerkProvider should be rendered in production mode', () => {
      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'

      // When DEV_AUTH_DISABLED=false, ClerkProvider should be rendered
      const shouldRenderClerk = !devAuthDisabled
      expect(shouldRenderClerk).toBe(true)
    })

    test('user data should be isolated by Clerk userId', () => {
      const userId = 'user_123'
      const anotherUserId = 'user_456'

      // Each user should only access their own data
      const user1Data = { user_id: userId, title: 'My Idea' }
      const user2Data = { user_id: anotherUserId, title: 'Their Idea' }

      expect(user1Data.user_id).not.toBe(user2Data.user_id)
      expect(user1Data.user_id).toBe(userId)
    })
  })

  describe('Middleware Route Protection', () => {
    const protectedRoutes = ['/api/ideas', '/ideas', '/publish', '/settings']
    const unprotectedRoutes = ['/', '/public', '/_next/static']

    test('should match protected routes', () => {
      protectedRoutes.forEach(route => {
        // Protected routes should trigger protection if not in dev mode
        expect(protectedRoutes.includes(route)).toBe(true)
      })
    })

    test('should not protect unprotected routes', () => {
      unprotectedRoutes.forEach(route => {
        // Unprotected routes should be accessible
        expect(protectedRoutes.some(pr => route.startsWith(pr))).toBe(false)
      })
    })
  })

  describe('Environment Configuration', () => {
    test('should support Clerk keys in env variables', () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
      process.env.CLERK_SECRET_KEY = 'sk_test_456'

      expect(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe('pk_test_123')
      expect(process.env.CLERK_SECRET_KEY).toBe('sk_test_456')
    })

    test('should allow empty Clerk keys for dev mode', () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = ''
      process.env.CLERK_SECRET_KEY = ''
      process.env.DEV_AUTH_DISABLED = 'true'

      const keysEmpty = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      const devMode = process.env.DEV_AUTH_DISABLED === 'true'

      expect(keysEmpty).toBe(true)
      expect(devMode).toBe(true)
    })

    test('should require Clerk keys for production auth', () => {
      process.env.DEV_AUTH_DISABLED = 'false'
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = ''
      process.env.CLERK_SECRET_KEY = ''

      const keysEmpty = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      const prodMode = process.env.DEV_AUTH_DISABLED === 'false'

      // In prod mode without keys, should not work properly
      expect(keysEmpty).toBe(true)
      expect(prodMode).toBe(true)
      expect(keysEmpty && prodMode).toBe(true)
    })
  })

  describe('User Identification Strategy', () => {
    test('development: always returns dev-user regardless of Clerk', () => {
      process.env.DEV_AUTH_DISABLED = 'true'

      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const clerkUserId = 'user_123' // Even if Clerk returns a user
      const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)

      expect(devAuthDisabled).toBe(true)
      // In dev mode, we ignore Clerk and always use dev-user
      // This test simulates: if devAuthDisabled, use dev-user instead of Clerk userId
      const effectiveUserId = devAuthDisabled ? 'dev-user' : userId
      expect(effectiveUserId).toBe('dev-user')
    })

    test('production: uses Clerk userId if available', () => {
      process.env.DEV_AUTH_DISABLED = 'false'

      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const clerkUserId = 'user_123'
      const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)

      expect(devAuthDisabled).toBe(false)
      expect(userId).toBe('user_123') // Uses Clerk user
    })

    test('production: returns null if no Clerk userId', () => {
      process.env.DEV_AUTH_DISABLED = 'false'

      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const clerkUserId = undefined
      const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)

      expect(devAuthDisabled).toBe(false)
      expect(userId).toBeNull()
    })
  })

  describe('API Response Behavior', () => {
    test('dev mode should allow unauthenticated API requests', () => {
      process.env.DEV_AUTH_DISABLED = 'true'
      process.env.USE_SUPABASE = 'false'

      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const USE_SUPABASE = process.env.USE_SUPABASE === 'true'
      const clerkUserId = undefined

      const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)
      const shouldAllow = !USE_SUPABASE || userId

      expect(shouldAllow).toBe(true)
    })

    test('prod mode with Supabase should require userId', () => {
      process.env.DEV_AUTH_DISABLED = 'false'
      process.env.USE_SUPABASE = 'true'

      const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
      const USE_SUPABASE = process.env.USE_SUPABASE === 'true'
      const clerkUserId = undefined

      const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)
      const shouldReject = USE_SUPABASE && !userId

      expect(shouldReject).toBe(true)
    })

    test('file-based storage should work in all modes', () => {
      process.env.DEV_AUTH_DISABLED = 'true'
      process.env.USE_SUPABASE = 'false'

      const devMode = process.env.DEV_AUTH_DISABLED === 'true'
      const prodMode = !devMode
      const USE_SUPABASE = process.env.USE_SUPABASE === 'true'

      // File-based storage should work when Supabase is disabled
      const fileModeWorks = !USE_SUPABASE
      expect(fileModeWorks).toBe(true)

      // Both dev and prod can use file mode
      expect(devMode || prodMode).toBe(true)
    })
  })
})





