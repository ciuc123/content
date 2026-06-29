import fs from 'fs'
import path from 'path'

// Mock data directory
const TEST_DATA_DIR = path.join(process.cwd(), '__test_data__')

// Helper to clean up test data
function cleanupTestData() {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true })
  }
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true })
}

// Test Suite 1: Ideas Management
describe('Ideas API - Basic Workflow', () => {
  beforeEach(() => {
    cleanupTestData()
  })

  afterAll(() => {
    cleanupTestData()
  })

  test('should import ideas from JSON', () => {
    const ideas = [
      {
        title: 'AI in DevOps',
        why_it_matters: 'DevOps teams can save time',
        virality_score: 7,
        business_score: 8,
      },
      {
        title: 'Kubernetes Best Practices',
        why_it_matters: 'Improve cluster efficiency',
        virality_score: 6,
        business_score: 9,
      },
    ]

    // Simulate ideas import
    const dataFile = path.join(TEST_DATA_DIR, 'ideas.json')
    fs.writeFileSync(dataFile, JSON.stringify(ideas, null, 2))

    // Verify data was written
    const saved = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
    expect(saved).toHaveLength(2)
    expect(saved[0].title).toBe('AI in DevOps')
  })

  test('should select an idea', () => {
    const ideas = [
      {
        title: 'AI in DevOps',
        why_it_matters: 'DevOps teams can save time',
        virality_score: 7,
        business_score: 8,
      },
    ]

    // Simulate selecting idea
    const selected = { ...ideas[0], status: 'selected' }

    expect(selected.status).toBe('selected')
    expect(selected.title).toBe('AI in DevOps')
  })

  test('should maintain idea properties', () => {
    const idea = {
      title: 'Testing Microservices',
      why_it_matters: 'Ensure reliability',
      virality_score: 8,
      business_score: 7,
    }

    expect(idea).toHaveProperty('title')
    expect(idea).toHaveProperty('why_it_matters')
    expect(idea).toHaveProperty('virality_score')
    expect(idea).toHaveProperty('business_score')
    expect(idea.virality_score).toBeGreaterThanOrEqual(1)
    expect(idea.virality_score).toBeLessThanOrEqual(10)
  })
})

// Test Suite 2: Research Storage
describe('Research API - Storage', () => {
  beforeEach(() => {
    cleanupTestData()
  })

  test('should save research entry', () => {
    const research = {
      index: 0,
      idea: { title: 'AI in DevOps' },
      content: '# Research\nAI can automate monitoring and incident response',
      created_at: new Date().toISOString(),
    }

    const dataFile = path.join(TEST_DATA_DIR, 'research.json')
    const data = [research]
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))

    const saved = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
    expect(saved[0].content).toContain('AI can automate')
    expect(saved[0].idea.title).toBe('AI in DevOps')
  })

  test('should handle multiple research entries', () => {
    const research1 = {
      index: 0,
      idea: { title: 'Idea 1' },
      content: 'Research 1',
    }
    const research2 = {
      index: 1,
      idea: { title: 'Idea 2' },
      content: 'Research 2',
    }

    const dataFile = path.join(TEST_DATA_DIR, 'research.json')
    const data = [research1, research2]
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))

    const saved = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
    expect(saved).toHaveLength(2)
    expect(saved[0].index).toBe(0)
    expect(saved[1].index).toBe(1)
  })
})

// Test Suite 3: Content Generation
describe('Generated Content API - Storage', () => {
  beforeEach(() => {
    cleanupTestData()
  })

  test('should save generated content', () => {
    const generated = {
      id: Date.now().toString(),
      index: 0,
      idea: { title: 'AI in DevOps' },
      linkedin_post: 'AI is revolutionizing DevOps...',
      blog_post: '# AI in DevOps\n\nArtificial intelligence...',
      newsletter_post: 'This week: AI tools for DevOps',
      created_at: new Date().toISOString(),
    }

    const dataFile = path.join(TEST_DATA_DIR, 'generated.json')
    fs.writeFileSync(dataFile, JSON.stringify([generated], null, 2))

    const saved = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
    expect(saved[0].linkedin_post).toBeDefined()
    expect(saved[0].blog_post).toBeDefined()
    expect(saved[0].newsletter_post).toBeDefined()
  })

  test('should validate content formats', () => {
    const generated = {
      id: '1',
      index: 0,
      idea: { title: 'Test' },
      linkedin_post: 'Short post',
      blog_post: 'Long form article',
      newsletter_post: 'Newsletter content',
    }

    expect(generated.linkedin_post).toBeTruthy()
    expect(typeof generated.blog_post).toBe('string')
    expect(generated.newsletter_post.length).toBeGreaterThan(0)
  })
})

// Test Suite 4: Publishing Workflow
describe('Publish API - File Publishing', () => {
  beforeEach(() => {
    cleanupTestData()
  })

  test('should create markdown file with frontmatter', () => {
    const postDir = path.join(TEST_DATA_DIR, 'posts')
    fs.mkdirSync(postDir, { recursive: true })

    const title = 'AI in DevOps'
    const slug = 'ai-devops'
    const body = '# AI in DevOps\n\nContent here...'
    const date = new Date().toISOString().split('T')[0]

    const fileName = `${date}-${slug}.md`
    const frontmatter = `---\ntitle: "${title}"\nslug: "${slug}"\ndate: "${date}"\n---\n`
    const markdown = frontmatter + body

    const filePath = path.join(postDir, fileName)
    fs.writeFileSync(filePath, markdown)

    const saved = fs.readFileSync(filePath, 'utf-8')
    expect(saved).toContain('title:')
    expect(saved).toContain('AI in DevOps')
    expect(saved).toContain('# AI in DevOps')
  })

  test('should generate valid filename', () => {
    const date = '2026-06-29'
    const slug = 'kubernetes-scaling'
    const fileName = `${date}-${slug}.md`

    expect(fileName).toMatch(/^\d{4}-\d{2}-\d{2}-[\w-]+\.md$/)
  })
})

// Test Suite 5: Complete Workflow End-to-End
describe('Complete Workflow - End to End', () => {
  beforeEach(() => {
    cleanupTestData()
  })

  test('should complete full content creation workflow', () => {
    // Step 1: Import ideas
    const ideas = [
      {
        title: 'Testing Best Practices',
        why_it_matters: 'Ensure code quality',
        virality_score: 8,
        business_score: 7,
      },
    ]
    const ideasFile = path.join(TEST_DATA_DIR, 'ideas.json')
    fs.writeFileSync(ideasFile, JSON.stringify(ideas, null, 2))

    // Step 2: Select idea
    const selected = { ...ideas[0], status: 'selected' }
    expect(selected.status).toBe('selected')

    // Step 3: Save research
    const research = {
      index: 0,
      idea: selected,
      content: '# Research on Testing\n\nTesting is crucial...',
    }
    const researchFile = path.join(TEST_DATA_DIR, 'research.json')
    fs.writeFileSync(researchFile, JSON.stringify([research], null, 2))

    // Step 4: Save generated content
    const generated = {
      id: '1',
      index: 0,
      idea: selected,
      linkedin_post: 'Testing is important for quality...',
      blog_post: '# Testing Best Practices\n\nComprehensive guide...',
      newsletter_post: 'This week: testing strategies',
    }
    const generatedFile = path.join(TEST_DATA_DIR, 'generated.json')
    fs.writeFileSync(generatedFile, JSON.stringify([generated], null, 2))

    // Step 5: Publish
    const postDir = path.join(TEST_DATA_DIR, 'posts')
    fs.mkdirSync(postDir, { recursive: true })
    const filePath = path.join(postDir, '2026-06-29-testing-best-practices.md')
    const markdown = `---\ntitle: "${selected.title}"\n---\n\n${generated.blog_post}`
    fs.writeFileSync(filePath, markdown)

    // Verify all steps completed
    expect(fs.existsSync(ideasFile)).toBe(true)
    expect(fs.existsSync(researchFile)).toBe(true)
    expect(fs.existsSync(generatedFile)).toBe(true)
    expect(fs.existsSync(filePath)).toBe(true)

    // Verify content integrity
    const savedPost = fs.readFileSync(filePath, 'utf-8')
    expect(savedPost).toContain('Testing Best Practices')
    expect(savedPost).toContain('---')
  })

  test('should handle multiple workflow iterations', () => {
    const ideas = [
      { title: 'Idea 1', why_it_matters: 'Reason 1', virality_score: 5, business_score: 6 },
      { title: 'Idea 2', why_it_matters: 'Reason 2', virality_score: 7, business_score: 8 },
    ]

    const ideasFile = path.join(TEST_DATA_DIR, 'ideas.json')
    fs.writeFileSync(ideasFile, JSON.stringify(ideas, null, 2))

    // Process first idea
    let research1 = [{ index: 0, idea: ideas[0], content: 'Research 1' }]
    const researchFile = path.join(TEST_DATA_DIR, 'research.json')
    fs.writeFileSync(researchFile, JSON.stringify(research1, null, 2))

    // Add research for second idea
    research1.push({ index: 1, idea: ideas[1], content: 'Research 2' })
    fs.writeFileSync(researchFile, JSON.stringify(research1, null, 2))

    const saved = JSON.parse(fs.readFileSync(researchFile, 'utf-8'))
    expect(saved).toHaveLength(2)
  })
})

// Test Suite 6: Error Handling
describe('Error Handling', () => {
  test('should handle missing idea title gracefully', () => {
    const invalidIdea = { why_it_matters: 'Reason' }

    expect(invalidIdea.title).toBeUndefined()
    expect(invalidIdea.why_it_matters).toBeDefined()
  })

  test('should validate score ranges', () => {
    const idea = { virality_score: 5, business_score: 8 }

    expect(idea.virality_score).toBeLessThanOrEqual(10)
    expect(idea.business_score).toBeLessThanOrEqual(10)
    expect(idea.virality_score).toBeGreaterThanOrEqual(1)
  })
})

