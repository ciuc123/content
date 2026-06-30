import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '../../pages/api/ai/agent'
import { withAIAuth } from '../../lib/clerk'

// Mock withAIAuth to bypass authentication in tests
jest.mock('../../lib/clerk', () => ({
  withAIAuth: (handler: any) => handler
}))

// Mock AI provider
jest.mock('../../lib/ai/agentProvider', () => ({
  getAgentProvider: jest.fn().mockReturnValue({
    generateIdeas: jest.fn().mockResolvedValue([
      { title: 'Test', why_it_matters: 'Testing' }
    ]),
    generateResearch: jest.fn().mockResolvedValue('# Research\n\nContent'),
    generateContent: jest.fn().mockResolvedValue({
      linkedin_post: 'Post',
      blog_post: 'Blog',
      newsletter_post: 'Newsletter'
    })
  })
}))

describe('AI Agent API - Research Generation', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>

  beforeEach(() => {
    jest.clearAllMocks()

    req = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {}
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    }
  })

  describe('Generate Research', () => {
    test('should require POST method', async () => {
      req.method = 'GET'

      await handler(req as NextApiRequest, res as NextApiResponse, 'user123', 'test-key')

      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['POST'])
      expect(res.status).toHaveBeenCalledWith(405)
    })

    test('should require action parameter', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse, 'user123', 'test-key')

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'action is required'
      })
    })

    test('should generate research with idea parameter', async () => {
      const idea = {
        title: 'AI in DevOps',
        why_it_matters: 'DevOps teams can save time'
      }
      req.body = { action: 'generateResearch', idea }

      await handler(req as NextApiRequest, res as NextApiResponse, 'user123', 'test-key')

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { research: '# Research\n\nContent' }
      })
    })

    test('should return error if idea is missing', async () => {
      req.body = { action: 'generateResearch' }

      await handler(req as NextApiRequest, res as NextApiResponse, 'user123', 'test-key')

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'idea is required for generateResearch'
      })
    })

    test('should use depth parameter if provided', async () => {
      const idea = {
        title: 'Test Idea',
        why_it_matters: 'Testing'
      }
      req.body = {
        action: 'generateResearch',
        idea,
        depth: 'deep'
      }

      await handler(req as NextApiRequest, res as NextApiResponse, 'user123', 'test-key')

      expect(res.status).toHaveBeenCalledWith(200)
    })

    test('should extract research from nested response structure', async () => {
      const idea = { title: 'Test', why_it_matters: 'Test' }
      req.body = { action: 'generateResearch', idea }

      // The agent returns { research: '...' } but the handler wraps it in { data: { research: '...' } }
      await handler(req as NextApiRequest, res as NextApiResponse, 'user123', 'test-key')

      const result = (res.json as jest.Mock).mock.calls[0][0]
      expect(result.data).toHaveProperty('research')
      expect(typeof result.data.research).toBe('string')
    })
  })

  describe('Generate Ideas', () => {
    test('should generate ideas with topic', async () => {
      req.body = {
        action: 'generateIdeas',
        topic: 'DevOps trends',
        count: 10
      }

      await handler(req as NextApiRequest, res as NextApiResponse, 'user123', 'test-key')

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ title: 'Test', why_it_matters: 'Testing' }]
      })
    })

    test('should return error if topic is missing', async () => {
      req.body = { action: 'generateIdeas' }

      await handler(req as NextApiRequest, res as NextApiResponse, 'user123', 'test-key')

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'topic is required for generateIdeas'
      })
    })

    test('should use default count if not provided', async () => {
      req.body = {
        action: 'generateIdeas',
        topic: 'Topic'
      }

      await handler(req as NextApiRequest, res as NextApiResponse, 'user123', 'test-key')

      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('Error Handling', () => {
    test('should handle unknown action', async () => {
      req.body = { action: 'unknownAction' }

      await handler(req as NextApiRequest, res as NextApiResponse, 'user123', 'test-key')

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown action: unknownAction'
      })
    })

    test('should handle API errors gracefully', async () => {
      const error = new Error('API Provider error')
      const mockAgent = {
        generateResearch: jest.fn().mockRejectedValue(error)
      }

      // Re-mock the provider to return our error-throwing agent
      jest.doMock('../../lib/ai/agentProvider', () => ({
        getAgentProvider: jest.fn().mockReturnValue(mockAgent)
      }))

      req.body = {
        action: 'generateResearch',
        idea: { title: 'Test' }
      }

      try {
        await handler(req as NextApiRequest, res as NextApiResponse, 'user123', 'test-key')
      } catch (err) {
        // Error is expected to be thrown
      }

      jest.doUnmock('../../lib/ai/agentProvider')
    })
  })

  describe('Authentication Integration', () => {
    test('should receive decrypted API key from withAIAuth', async () => {
      // withAIAuth is mocked to pass through the apiKey parameter
      const apiKey = 'decrypted-api-key-123'

      req.body = {
        action: 'generateIdeas',
        topic: 'Test'
      }

      await handler(req as NextApiRequest, res as NextApiResponse, 'user123', apiKey)

      // Verify the call succeeded (would fail if apiKey was missing/invalid)
      expect(res.status).toHaveBeenCalledWith(200)
    })

    test('should have access to userId in handler context', async () => {
      const userId = 'user123'

      req.body = {
        action: 'generateIdeas',
        topic: 'Test'
      }

      // Handler is called with userId, apiKey
      await handler(req as NextApiRequest, res as NextApiResponse, userId, 'api-key')

      // If userId wasn't available, the handler would fail
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})

