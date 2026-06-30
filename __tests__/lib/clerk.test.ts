import { withClerkAuth, withAIAuth } from '../../lib/clerk'
import { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'

// Mock Clerk
jest.mock('@clerk/nextjs/server')

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabaseServer: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { api_key_encrypted: 'encrypted-key-data' },
            error: null
          }))
        }))
      }))
    }))
  }))
}))

// Mock encryption
jest.mock('../../lib/encryption', () => ({
  decryptString: jest.fn((encrypted) => 'sk-decrypted-key')
}))

const mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>

describe('Clerk Auth Middleware', () => {
  let mockReq: Partial<NextApiRequest>
  let mockRes: Partial<NextApiResponse>

  beforeEach(() => {
    mockReq = {}
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    }
    jest.clearAllMocks()
  })

  describe('withClerkAuth', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetAuth.mockReturnValue({ userId: null } as any)

      const handler = jest.fn()
      const wrappedHandler = withClerkAuth(handler)

      await wrappedHandler(mockReq as NextApiRequest, mockRes as NextApiResponse)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
      expect(handler).not.toHaveBeenCalled()
    })

    it('should call handler with userId if authenticated', async () => {
      const userId = 'user_123'
      mockGetAuth.mockReturnValue({ userId } as any)

      const handler = jest.fn().mockResolvedValue(undefined)
      const wrappedHandler = withClerkAuth(handler)

      await wrappedHandler(mockReq as NextApiRequest, mockRes as NextApiResponse)

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, userId)
    })

    it('should handle handler errors gracefully', async () => {
      mockGetAuth.mockReturnValue({ userId: 'user_123' } as any)

      const handler = jest.fn().mockRejectedValue(new Error('Handler error'))
      const wrappedHandler = withClerkAuth(handler)

      await wrappedHandler(mockReq as NextApiRequest, mockRes as NextApiResponse)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' })
    })
  })

  describe('withAIAuth', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetAuth.mockReturnValue({ userId: null } as any)

      const handler = jest.fn()
      const wrappedHandler = withAIAuth(handler)

      await wrappedHandler(mockReq as NextApiRequest, mockRes as NextApiResponse)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized - Sign in required' })
      expect(handler).not.toHaveBeenCalled()
    })

    it('should return 401 if no API key is configured', async () => {
      mockGetAuth.mockReturnValue({ userId: 'user_123' } as any)

      // Mock Supabase to return no key
      const { supabaseServer } = require('../../lib/supabase')
      supabaseServer.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: { api_key_encrypted: null },
                error: null
              }))
            }))
          }))
        }))
      })

      const handler = jest.fn()
      const wrappedHandler = withAIAuth(handler)

      await wrappedHandler(mockReq as NextApiRequest, mockRes as NextApiResponse)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'API key not configured - please add one in settings'
      })
      expect(handler).not.toHaveBeenCalled()
    })

    it('should call handler with userId and decrypted apiKey if authenticated', async () => {
      const userId = 'user_123'
      mockGetAuth.mockReturnValue({ userId } as any)

      const handler = jest.fn().mockResolvedValue(undefined)
      const wrappedHandler = withAIAuth(handler)

      await wrappedHandler(mockReq as NextApiRequest, mockRes as NextApiResponse)

      expect(handler).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        userId,
        'sk-decrypted-key'
      )
    })

    it('should return 500 if decryption fails', async () => {
      mockGetAuth.mockReturnValue({ userId: 'user_123' } as any)

      const { decryptString } = require('../../lib/encryption')
      decryptString.mockImplementation(() => {
        throw new Error('Decryption failed')
      })

      const handler = jest.fn()
      const wrappedHandler = withAIAuth(handler)

      await wrappedHandler(mockReq as NextApiRequest, mockRes as NextApiResponse)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to decrypt API key' })
      expect(handler).not.toHaveBeenCalled()
    })
  })
})

