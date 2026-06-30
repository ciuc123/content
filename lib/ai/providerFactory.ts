import { AIProvider } from './ai'
import { GitHubModelsProvider } from './githubProvider'
import { OpenAIProvider } from './openaiProvider'

let instance: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (instance) return instance

  // Use OpenAI if API key is provided, otherwise use GitHub Copilot CLI from copilot_boot container
  const provider = process.env.OPENAI_API_KEY ? 'openai' : 'github'

  if (provider === 'openai') {
    instance = new OpenAIProvider()
  } else {
    // GitHub Copilot CLI provider (from copilot_boot container)
    instance = new GitHubModelsProvider()
  }
  return instance
}
