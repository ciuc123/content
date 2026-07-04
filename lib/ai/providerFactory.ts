import { AIProvider } from './ai'
import { GitHubModelsProvider } from './githubProvider'
import { OpenAIProvider } from './openaiProvider'

export function getAIProvider(apiKey?: string): AIProvider {
  // Detect if apiKey is a GitHub token (starts with gh or gho)
  const isGitHubToken = apiKey && (apiKey.startsWith('gh') || apiKey.startsWith('gho'))

  // Use OpenAI if API key is provided (user's key or environment variable) and it's NOT a GitHub token
  const useOpenAI = (apiKey || process.env.OPENAI_API_KEY) && !isGitHubToken

  if (useOpenAI) {
    return new OpenAIProvider(apiKey)
  } else {
    // GitHub Copilot CLI provider (from copilot_boot container)
    // This is used when:
    // - apiKey is a GitHub token (admin using GITHUB_TOKEN)
    // - OR no API key provided (fallback to CLI)
    return new GitHubModelsProvider()
  }
}
