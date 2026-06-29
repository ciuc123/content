import { AIProvider } from './ai'

export class ManualProvider implements AIProvider {
  async generate(prompt: string, context?: string) {
    // For local development, allow returning a canned response via env var
    if (process.env.MANUAL_AI_RESPONSE) {
      return process.env.MANUAL_AI_RESPONSE
    }
    // Otherwise, instruct the caller to use the UI to paste Copilot output
    throw new Error(
      'ManualProvider requires MANUAL_AI_RESPONSE env var or using the web UI to paste Copilot output.\nIn dev you can set MANUAL_AI_RESPONSE in .env.local or paste the generated text into the Research/Generate textareas.'
    )
  }
}

22