import { AIProvider } from './ai'
import { ManualProvider } from './manualProvider'
import { GitHubModelsProvider } from './githubProvider'
import { OpenAIProvider } from './openaiProvider'

let instance: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (instance) return instance

  const provider = process.env.AI_PROVIDER || 'manual'
  if (provider === 'manual') {
    instance = new ManualProvider()
  } else if (provider === 'openai') {
    instance = new OpenAIProvider()
  } else {
    // GitHub models provider which uses Copilot CLI
    instance = new GitHubModelsProvider()
  }
  return instance
}
