import { AIProvider } from './ai'
import { GitHubModelsProvider } from './githubProvider'
import { OpenAIProvider } from './openaiProvider'

export function getAIProvider(apiKey?: string): AIProvider {
  // Use OpenAI if API key is provided (user's key or environment variable), otherwise use GitHub Copilot CLI
  const provider = apiKey || process.env.OPENAI_API_KEY ? 'openai' : 'github'

  if (provider === 'openai') {
    return new OpenAIProvider(apiKey)
  } else {
    // GitHub Copilot CLI provider (from copilot_boot container)
    return new GitHubModelsProvider()
  }
}
