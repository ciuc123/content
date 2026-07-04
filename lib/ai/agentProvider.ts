import { AIProvider } from './ai'
import { GitHubModelsProvider } from './githubProvider'
import { getAIProvider as getBaseProvider } from './providerFactory'

/**
 * AI Agent Provider
 * Automatically orchestrates the full workflow:
 * 1. Generates ideas
 * 2. Researches selected idea
 * 3. Generates content (LinkedIn, blog, newsletter)
 * 4. Publishes to GitHub
 */
export class AgentProvider implements AIProvider {
  private baseProvider: AIProvider

  constructor(apiKey?: string) {
    // Detect if apiKey is a GitHub token
    const isGitHubToken = apiKey && (apiKey.startsWith('gh') || apiKey.startsWith('gho'))

    if (isGitHubToken) {
      // Use GitHub provider with the token
      this.baseProvider = new GitHubModelsProvider(apiKey)
    } else {
      // Use the configured provider (OpenAI, GitHub CLI, or Manual)
      // Pass user's API key if provided
      this.baseProvider = getBaseProvider(apiKey)
    }
  }

  /**
   * Generate ideas automatically
   */
  async generateIdeas(topic: string, count: number = 10, context?: string): Promise<any[]> {
    const prompt = `Generate ${count} unique content ideas for: ${topic}
    
For each idea provide:
- title: Brief, catchy title
- why_it_matters: 1-2 sentences explaining importance
- virality_score: 1-10 rating
- business_score: 1-10 rating

Output ONLY valid JSON array, no extra text.`

    const response = await this.baseProvider.generate(prompt, context)

    try {
      // Extract JSON from response (might be wrapped in text)
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array found in response')

      const ideas = JSON.parse(jsonMatch[0])
      if (!Array.isArray(ideas)) throw new Error('Response is not an array')

      return ideas
    } catch (e: any) {
      throw new Error(`Failed to parse ideas: ${e.message}. Response: ${response}`)
    }
  }

  /**
   * Generate research for a selected idea
   */
  async generateResearch(idea: any, depth: string = 'medium', context?: string): Promise<string> {
    const depthGuide = {
      brief: 'Provide 2-3 key points in 100-150 words',
      medium: 'Provide 4-5 key insights with examples in 300-400 words',
      deep: 'Provide comprehensive research with citations in 600-800 words'
    }

    const prompt = `Research and provide detailed information about: "${idea.title}"

Why it matters: ${idea.why_it_matters}

${depthGuide[depth as keyof typeof depthGuide] || depthGuide.medium}

Include:
- Current trends
- Real-world examples
- Best practices
- Key statistics (if available)

Format as clear paragraphs, suitable for a blog post.`

    const research = await this.baseProvider.generate(prompt, context)
    return research.trim()
  }

  /**
   * Generate all three content formats
   */
  async generateContent(idea: any, research: string, context?: string): Promise<{
    linkedin_post: string
    blog_post: string
    newsletter_post: string
  }> {
    const basePrompt = `You have this idea: "${idea.title}"
    
Why it matters: ${idea.why_it_matters}

Research/Background: ${research}

Generate a specific content piece following the format below. Output ONLY the content, no explanations.`

    const [linkedin, blog, newsletter] = await Promise.all([
      this.generateLinkedInPost(idea, research, context),
      this.generateBlogPost(idea, research, context),
      this.generateNewsletterPost(idea, research, context)
    ])

    return {
      linkedin_post: linkedin,
      blog_post: blog,
      newsletter_post: newsletter
    }
  }

  private async generateLinkedInPost(idea: any, research: string, context?: string): Promise<string> {
    const prompt = `Create a LinkedIn post for: "${idea.title}"

Research: ${research}

Requirements:
- 150-250 words
- Conversational, professional tone
- Include 2-3 relevant hashtags
- Call-to-action at the end
- Start with a hook (question or interesting statement)

Output ONLY the LinkedIn post content.`

    return this.baseProvider.generate(prompt, context)
  }

   private async generateBlogPost(idea: any, research: string, context?: string): Promise<string> {
     const prompt = `Create a comprehensive blog post for: "${idea.title}"

Research/Background: ${research}

STRUCTURE REQUIREMENTS (MUST FOLLOW THIS ORDER):

1. **INTRODUCTION SECTION** (150-200 words)
   - Start with an engaging hook (question, statistic, or surprising statement)
   - Clearly state the problem or topic you're addressing
   - Explain why this matters to the reader
   - Preview what the post will cover
   - End with a smooth transition to the first main section

2. **MAIN CONTENT** (3-4 clearly numbered and titled sections, 150-250 words each)
   - Each section must have a descriptive heading (use ## for markdown headings)
   - Start each section with context-setting sentence
   - Include practical examples, code snippets, or real-world scenarios
   - Use bullet points where appropriate
   - Add transitions between sections for flow

3. **CONCLUSION** (100-150 words)
   - Summarize the key points
   - Reinforce why this matters
   - Provide clear next steps or action items
   - Include a strong call-to-action

FORMATTING GUIDELINES:
- Use markdown formatting (## for section headings, *** or --- for emphasis)
- Keep paragraphs to 3-5 sentences max
- Include code blocks with triple backticks when relevant
- Maintain professional, informative tone throughout
- Ensure smooth transitions between sections

CRITICAL: The introduction MUST come first and set up the entire post. Do not start with solutions or details - establish context first.

Output ONLY the blog post content (no frontmatter, no metadata, no title).`

     return this.baseProvider.generate(prompt, context)
   }

  private async generateNewsletterPost(idea: any, research: string, context?: string): Promise<string> {
    const prompt = `Create a newsletter article for: "${idea.title}"

Research: ${research}

Requirements:
- 300-500 words
- Friendly, approachable tone
- Start with a personal hook or story
- Include 1-2 key takeaways
- End with a question for reader engagement
- Suitable for email newsletters

Output ONLY the newsletter article content.`

    return this.baseProvider.generate(prompt, context)
  }

  /**
   * Main generate method (implements AIProvider interface)
   * For agent mode, this orchestrates the full workflow
   */
  async generate(prompt: string, context?: string): Promise<string> {
    // If called directly, just pass through to base provider
    // The orchestration happens through the specific methods above
    return this.baseProvider.generate(prompt, context)
  }

  /**
   * Streaming support (delegates to base provider when available).
   * Declared without `?` because optional method syntax is only valid in
   * interfaces/abstract classes; a concrete class must provide a full definition.
   */
  async stream(
    prompt: string,
    context: string | undefined,
    onChunk: (chunk: string) => void,
    options?: Record<string, any>
  ): Promise<void> {
    if (this.baseProvider.stream) {
      return this.baseProvider.stream(prompt, context, onChunk, options)
    }
  }
}

/**
 * Get agent provider instance
 */
let agentInstance: AgentProvider | null = null

export function getAgentProvider(apiKey?: string): AgentProvider {
  // If apiKey is provided, create a new instance (per-user, don't cache)
  if (apiKey) {
    return new AgentProvider(apiKey)
  }
  // Otherwise use cached singleton
  if (!agentInstance) {
    agentInstance = new AgentProvider()
  }
  return agentInstance
}

