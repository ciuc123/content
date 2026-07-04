import { auth } from '@clerk/nextjs'
import { getAuth } from '@clerk/nextjs/server'
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * Get the current authenticated user ID from Clerk
 * Use this in Server Components
 */
export function getAuthUserId() {
  const { userId } = auth()
  if (!userId) {
    throw new Error('User not authenticated')
  }
  return userId
}

/**
 * Middleware to protect API routes with Clerk authentication
 *
 * Usage in API routes:
 * export default withClerkAuth(async (req, res, userId) => {
 *   // Your handler code
 * })
 */
export function withClerkAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, userId: string) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Use getAuth for API routes (not auth() which is for Server Components)
      const { userId } = getAuth(req)

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      await handler(req, res, userId)
    } catch (error: any) {
      console.error('Auth error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

/**
 * Middleware to protect AI endpoints with Clerk authentication and API key retrieval
 *
 * Usage in API routes:
 * export default withAIAuth(async (req, res, userId, apiKey) => {
 *   // Your handler code - apiKey is already decrypted and ready to use
 * })
 *
 * API key priority:
 * 1. User's encrypted API key from database (users can configure custom keys in settings)
 * 2. Environment GITHUB_TOKEN (admins can use project-wide token automatically)
 * 3. None - returns 401 error
 */
export function withAIAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, userId: string, apiKey: string) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Use getAuth for API routes (not auth() which is for Server Components)
      const { userId } = getAuth(req)

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - Sign in required' })
      }

      // Get the user's API key from Supabase
      const { supabaseServer } = await import('./supabase')
      const { decryptString } = await import('./encryption')

      const supabase = supabaseServer()
      const { data: userRecord, error } = await supabase
        .from('users')
        .select('api_key_encrypted, is_admin')
        .eq('clerk_id', userId)
        .single()

      if (error || !userRecord) {
        console.error('Error fetching user API key:', error)
        return res.status(401).json({ error: 'API key not found - please add one in settings' })
      }

      let apiKey: string | null = null

      // Priority 1: Check for user's encrypted API key
      if (userRecord.api_key_encrypted) {
        try {
          apiKey = decryptString(userRecord.api_key_encrypted)
        } catch (err: any) {
          console.error('Decryption error:', err)
          return res.status(500).json({ error: 'Failed to decrypt API key' })
        }
      }

      // Priority 2: If no user key and user is admin, use environment GITHUB_TOKEN
      if (!apiKey && userRecord.is_admin && process.env.GITHUB_TOKEN) {
        apiKey = process.env.GITHUB_TOKEN
        console.log(`Admin user ${userId} using GITHUB_TOKEN from environment`)
      }

      // If still no API key, return error
      if (!apiKey) {
        return res.status(401).json({ error: 'API key not configured - please add one in settings' })
      }

      // Call the handler with the API key (decrypted or from environment)
      await handler(req, res, userId, apiKey)
    } catch (error: any) {
      console.error('AI auth error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

/**
 * Server Action to get current user info from Clerk
 * Use this in Server Components or API routes
 */
export async function getCurrentUser() {
  try {
    const { userId } = auth()
    if (!userId) return null

    // You can fetch more user info here if needed
    return { userId }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { supabaseServer } = await import('./supabase')
    const supabase = supabaseServer()

    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single()

    if (error || !user) {
      return false
    }

    return user.is_admin === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Middleware to protect admin-only API routes
 * Usage: export default withAdminAuth(async (req, res, userId) => { ... })
 */
export function withAdminAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, userId: string) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const { userId } = getAuth(req)

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - Sign in required' })
      }

      const admin = await isUserAdmin(userId)
      if (!admin) {
        return res.status(403).json({ error: 'Forbidden - Admin access required' })
      }

      await handler(req, res, userId)
    } catch (error: any) {
      console.error('Admin auth error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}
