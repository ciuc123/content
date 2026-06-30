import { auth } from '@clerk/nextjs'
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
      // This works in pages/api routes when middleware is configured
      const { userId } = auth()

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

