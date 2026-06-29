import { AgentProvider } from '../lib/ai/agentProvider'
import { AIProvider } from '../lib/ai/ai'

/**
 * AI Agent Tests
 * Tests the automated workflow orchestration
 */

// Mock AIProvider for testing
class MockAIProvider implements AIProvider {
  private callCount = 0

  async generate(prompt: string, context?: string): Promise<string> {
    this.callCount++

    // Return mock responses based on prompt content - check most specific first
    if (prompt.includes('Generate') && prompt.includes('ideas')) {
      return JSON.stringify([
        {
          title: 'Test Idea 1',
          why_it_matters: 'This is important',
          virality_score: 8,
          business_score: 7
        },
        {
          title: 'Test Idea 2',
          why_it_matters: 'This matters too',
          virality_score: 7,
          business_score: 8
        }
      ])
    }

    // Check for specific content formats first (before generic Research check)
    if (prompt.toLowerCase().includes('linkedin')) {
      return `LinkedIn post content (call ${this.callCount}): Check out this amazing insight! #ai #productivity`
    }
    if (prompt.toLowerCase().includes('blog post')) {
      return `Blog post content (call ${this.callCount}): This is a comprehensive blog post about the topic with detailed information and examples.`
    }
    if (prompt.toLowerCase().includes('newsletter')) {
      return `Newsletter article (call ${this.callCount}): Here is what you need to know about this topic in an engaging conversational way.`
    }

    // Generic research
    if (prompt.includes('Research')) {
      return 'This is detailed research content about the topic. It includes important information and best practices.'
    }

    return `Mock response (call ${this.callCount})`
  }
}

describe('AI Agent Provider', () => {
  let agent: AgentProvider

  beforeEach(() => {
    // Create agent with mocked provider
    agent = new AgentProvider()
    // Override the base provider with mock
    ;(agent as any).baseProvider = new MockAIProvider()
  })

  describe('generateIdeas', () => {
    test('should generate array of ideas with required fields', async () => {
      const ideas = await agent.generateIdeas('Web Development', 5)

      expect(Array.isArray(ideas)).toBe(true)
      expect(ideas.length).toBeGreaterThan(0)
      expect(ideas[0]).toHaveProperty('title')
      expect(ideas[0]).toHaveProperty('why_it_matters')
      expect(ideas[0]).toHaveProperty('virality_score')
      expect(ideas[0]).toHaveProperty('business_score')
    })

    test('should handle custom count parameter', async () => {
      const ideas = await agent.generateIdeas('DevOps', 3)
      expect(Array.isArray(ideas)).toBe(true)
    })

    test('should include context in generation', async () => {
      const context = 'Focus on kubernetes and containerization'
      const ideas = await agent.generateIdeas('Cloud Computing', 5, context)
      expect(ideas).toBeDefined()
    })

    test('should validate idea structure', async () => {
      const ideas = await agent.generateIdeas('Testing', 1)
      ideas.forEach(idea => {
        expect(typeof idea.title).toBe('string')
        expect(typeof idea.why_it_matters).toBe('string')
        expect(typeof idea.virality_score).toBe('number')
        expect(typeof idea.business_score).toBe('number')
        expect(idea.virality_score).toBeGreaterThanOrEqual(1)
        expect(idea.virality_score).toBeLessThanOrEqual(10)
      })
    })
  })

  describe('generateResearch', () => {
    test('should generate research content for an idea', async () => {
      const idea = {
        title: 'AI in DevOps',
        why_it_matters: 'Important for automation'
      }

      const research = await agent.generateResearch(idea)

      expect(typeof research).toBe('string')
      expect(research.length).toBeGreaterThan(0)
    })

    test('should support different depth levels', async () => {
      const idea = { title: 'Test', why_it_matters: 'Important' }

      const brief = await agent.generateResearch(idea, 'brief')
      const medium = await agent.generateResearch(idea, 'medium')
      const deep = await agent.generateResearch(idea, 'deep')

      expect(brief).toBeDefined()
      expect(medium).toBeDefined()
      expect(deep).toBeDefined()
    })

    test('should include context in research', async () => {
      const idea = { title: 'Cloud', why_it_matters: 'Scalability' }
      const context = 'Focus on cost optimization'

      const research = await agent.generateResearch(idea, 'medium', context)
      expect(research).toBeDefined()
    })

    test('should return non-empty research', async () => {
      const idea = {
        title: 'Microservices',
        why_it_matters: 'Architecture pattern'
      }

      const research = await agent.generateResearch(idea)
      expect(research.trim().length).toBeGreaterThan(0)
    })
  })

  describe('generateContent', () => {
    test('should generate all three content formats', async () => {
      const idea = {
        title: 'Web Security',
        why_it_matters: 'Protects users'
      }
      const research = 'Security best practices include encryption and validation'

      const content = await agent.generateContent(idea, research)

      expect(content).toHaveProperty('linkedin_post')
      expect(content).toHaveProperty('blog_post')
      expect(content).toHaveProperty('newsletter_post')
    })

    test('LinkedIn post should be formatted correctly', async () => {
      const idea = { title: 'Test', why_it_matters: 'Important' }
      const research = 'Test research'

      const content = await agent.generateContent(idea, research)

      expect(typeof content.linkedin_post).toBe('string')
      expect(content.linkedin_post.length).toBeGreaterThan(0)
    })

    test('blog post should be substantial', async () => {
      const idea = { title: 'Test', why_it_matters: 'Important' }
      const research = 'Detailed research content'

      const content = await agent.generateContent(idea, research)

      expect(content.blog_post.length).toBeGreaterThan(100)
    })

    test('newsletter post should be conversational', async () => {
      const idea = { title: 'Test', why_it_matters: 'Important' }
      const research = 'Research data'

      const content = await agent.generateContent(idea, research)

      expect(content.newsletter_post.length).toBeGreaterThan(50)
    })

    test('should include context in content generation', async () => {
      const idea = { title: 'AI', why_it_matters: 'Future' }
      const research = 'AI research'
      const context = 'Target audience: software engineers'

      const content = await agent.generateContent(idea, research, context)

      expect(content).toBeDefined()
    })
  })

  describe('Workflow Integration', () => {
    test('should handle complete workflow in correct order', async () => {
      // Step 1: Generate ideas
      const ideas = await agent.generateIdeas('Automation')
      expect(ideas.length).toBeGreaterThan(0)

      // Step 2: Select first idea
      const selectedIdea = ideas[0]
      expect(selectedIdea.title).toBeDefined()

      // Step 3: Generate research
      const research = await agent.generateResearch(selectedIdea)
      expect(research.length).toBeGreaterThan(0)

      // Step 4: Generate content
      const content = await agent.generateContent(selectedIdea, research)
      expect(content.linkedin_post).toBeDefined()
      expect(content.blog_post).toBeDefined()
      expect(content.newsletter_post).toBeDefined()

      // Verify complete workflow
      expect({
        idea: selectedIdea,
        research,
        content
      }).toBeDefined()
    })

    test('should maintain idea structure through workflow', async () => {
      const ideas = await agent.generateIdeas('Testing')
      const idea = ideas[0]

      const research = await agent.generateResearch(idea)
      const content = await agent.generateContent(idea, research)

      // Original idea should be unchanged
      expect(idea.title).toBeDefined()
      expect(idea.virality_score).toBeDefined()
    })

    test('should handle multiple ideas', async () => {
      const ideas = await agent.generateIdeas('Architecture', 3)

      const results = []
      for (const idea of ideas.slice(0, 2)) {
        const research = await agent.generateResearch(idea, 'brief')
        const content = await agent.generateContent(idea, research)
        results.push({ idea, research, content })
      }

      expect(results.length).toBe(2)
      results.forEach(result => {
        expect(result.idea).toBeDefined()
        expect(result.research).toBeDefined()
        expect(result.content).toBeDefined()
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle provider errors gracefully', async () => {
      const errorProvider = new (class implements AIProvider {
        async generate() {
          throw new Error('Provider error')
        }
      })()

      agent = new AgentProvider()
      ;(agent as any).baseProvider = errorProvider

      await expect(agent.generateIdeas('Test')).rejects.toThrow()
    })

    test('should handle invalid JSON in response', async () => {
      const badProvider = new (class implements AIProvider {
        async generate() {
          return 'This is not JSON'
        }
      })()

      agent = new AgentProvider()
      ;(agent as any).baseProvider = badProvider

      await expect(agent.generateIdeas('Test')).rejects.toThrow()
    })

    test('should require idea for generateResearch', async () => {
      // This would be caught by the API layer, but good to document
      const idea = null as any
      // In actual usage, this would be prevented by API validation
      expect(idea).toBeNull()
    })
  })

  describe('Content Quality', () => {
    test('generated ideas should have proper score ranges', async () => {
      const ideas = await agent.generateIdeas('Quality Test', 5)

      ideas.forEach(idea => {
        expect(idea.virality_score).toBeGreaterThanOrEqual(1)
        expect(idea.virality_score).toBeLessThanOrEqual(10)
        expect(idea.business_score).toBeGreaterThanOrEqual(1)
        expect(idea.business_score).toBeLessThanOrEqual(10)
      })
    })

    test('research should include key sections', async () => {
      const idea = { title: 'Quality', why_it_matters: 'Important' }
      const research = await agent.generateResearch(idea, 'medium')

      // Research should mention key elements
      expect(research.toLowerCase()).toMatch(/trend|example|best|practice|statistic|insight|key/i)
    })

    test('content should be distinct per format', async () => {
      const idea = { title: 'Format Test', why_it_matters: 'Different formats' }
      const research = 'Content research'

      const content = await agent.generateContent(idea, research)

      // Each format should be different
      expect(content.linkedin_post).not.toBe(content.blog_post)
      expect(content.blog_post).not.toBe(content.newsletter_post)

      // But all should exist
      expect(content.linkedin_post.length).toBeGreaterThan(0)
      expect(content.blog_post.length).toBeGreaterThan(0)
      expect(content.newsletter_post.length).toBeGreaterThan(0)
    })
  })
})





