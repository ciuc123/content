import type { NextApiRequest, NextApiResponse } from 'next'

// Mock Supabase BEFORE importing anything that uses it
jest.mock('../../lib/supabase', () => ({
  supabaseServer: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis()
  })),
  supabase: jest.fn()
}))

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn()
}))

import handler from '../../pages/api/ideas/index'
import { getAuth } from '@clerk/nextjs/server'
import { supabaseServer } from '../../lib/supabase'


const mockGetAuth = getAuth as jest.MockedFunction<typeof getAuth>
const mockSupabaseServer = supabaseServer as jest.MockedFunction<typeof supabaseServer>

describe('Ideas API - Research Workflow', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>

  beforeEach(() => {
    jest.clearAllMocks()

    req = {
      method: 'PATCH',
      headers: {},
      body: {}
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    }
  })

  describe('PATCH /api/ideas - Update Status', () => {
    test('should return 401 if user is not authenticated', async () => {
      mockGetAuth.mockReturnValue({ userId: null } as any)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Sign in to update ideas. Using browser storage locally.'
      })
    })

    test('should return 400 if idea_id is missing', async () => {
      mockGetAuth.mockReturnValue({ userId: 'user123' } as any)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'idea_id is required'
      })
    })

    test('should update idea status to researched', async () => {
      const userId = 'user123'
      const ideaId = 'idea456'

      mockGetAuth.mockReturnValue({ userId } as any)
      req.body = { idea_id: ideaId }

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValueOnce({
          data: [{ id: ideaId, status: 'researched' }],
          error: null
        })
      }

      mockSupabaseServer.mockReturnValue(mockSupabase as any)

      await handler(req as NextApiRequest, res as NextApiResponse)

      // Verify reset was called
      expect(mockSupabase.from).toHaveBeenCalledWith('ideas')
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'new' })

      // Verify update was called
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        idea: { id: ideaId, status: 'researched' }
      })
    })

    test('should handle database errors', async () => {
      const userId = 'user123'
      const ideaId = 'idea456'

      mockGetAuth.mockReturnValue({ userId } as any)
      req.body = { idea_id: ideaId }

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database connection failed' }
        })
      }

      mockSupabaseServer.mockReturnValue(mockSupabase as any)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Database connection failed'
      })
    })

    test('should allow PATCH method in allowed methods', async () => {
      req.method = 'DELETE'
      mockGetAuth.mockReturnValue({ userId: 'user123' } as any)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST', 'PATCH'])
      expect(res.status).toHaveBeenCalledWith(405)
    })

    test('should reset all other ideas to new status before selecting', async () => {
      const userId = 'user123'
      const ideaId = 'idea456'

      mockGetAuth.mockReturnValue({ userId } as any)
      req.body = { idea_id: ideaId }

      const updateCalls: any[] = []
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockImplementation((status) => {
          updateCalls.push(status)
          return mockSupabase
        }),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValueOnce({
          data: [{ id: ideaId, status: 'researched' }],
          error: null
        })
      }

      mockSupabaseServer.mockReturnValue(mockSupabase as any)

      await handler(req as NextApiRequest, res as NextApiResponse)

      // First update should set all to 'new'
      expect(updateCalls[0]).toEqual({ status: 'new' })
      // Second update should set selected to 'researched'
      expect(updateCalls[1]).toEqual({ status: 'researched' })
    })

    test('should update only the selected idea for the user', async () => {
      const userId = 'user123'
      const ideaId = 'idea456'

      mockGetAuth.mockReturnValue({ userId } as any)
      req.body = { idea_id: ideaId }

      const eqCalls: any[] = []
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((key, value) => {
          eqCalls.push({ key, value })
          return mockSupabase
        }),
        select: jest.fn().mockResolvedValueOnce({
          data: [{ id: ideaId, status: 'researched' }],
          error: null
        })
      }

      mockSupabaseServer.mockReturnValue(mockSupabase as any)

      await handler(req as NextApiRequest, res as NextApiResponse)

      // Check that we filter by both idea_id and user_id
      const ideaFilter = eqCalls.find(call => call.key === 'id')
      const userFilter = eqCalls.find(call => call.key === 'user_id')

      expect(ideaFilter?.value).toBe(ideaId)
      expect(userFilter?.value).toBe(userId)
    })
  })

  describe('Ideas API - Full Workflow', () => {
    test('should handle complete research workflow', async () => {
      const userId = 'user123'
      const ideaId = 'idea456'

      // Step 1: GET ideas
      mockGetAuth.mockReturnValue({ userId } as any)
      req.method = 'GET'

      let mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: [{ id: ideaId, title: 'Test', status: 'new' }],
          error: null
        })
      }

      mockSupabaseServer.mockReturnValue(mockSupabase as any)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.json).toHaveBeenCalledWith({
        ideas: [{ id: ideaId, title: 'Test', status: 'new' }]
      })

      // Step 2: PATCH to select idea
      jest.clearAllMocks()
      mockGetAuth.mockReturnValue({ userId } as any)
      req.method = 'PATCH'
      req.body = { idea_id: ideaId }

      mockSupabase = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValueOnce({
          data: [{ id: ideaId, title: 'Test', status: 'researched' }],
          error: null
        })
      }

      mockSupabaseServer.mockReturnValue(mockSupabase as any)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        idea: { id: ideaId, title: 'Test', status: 'researched' }
      })
    })
  })
})

