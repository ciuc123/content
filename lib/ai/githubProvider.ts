import { AIProvider } from './ai'
import { spawn } from 'child_process'

export class GitHubModelsProvider implements AIProvider {
  private githubToken?: string

  constructor(githubToken?: string) {
    this.githubToken = githubToken
  }

  /**
   * Try GitHub Models API first (supports web search with proper authentication)
   * This method has pre-authorized web search - no permission needed
   */
  private async generateWithModelsAPI(prompt: string, maxTokens: number = 2000): Promise<string | null> {
    const token = this.githubToken || process.env.GITHUB_TOKEN
    if (!token) {
      return null
    }

    try {
      console.log('Attempting GitHub Models API with web search capability...')

      const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.6,
          top_p: 1
        })
      })

      if (!response.ok) {
        console.warn(`GitHub Models API returned ${response.status}`)
        return null
      }

      const json = await response.json()
      const text = json.choices?.[0]?.message?.content ?? ''

      if (text) {
        console.log('✓ Generated using GitHub Models API (with web search support)')
        return text
      }

      return null
    } catch (err) {
      console.warn('GitHub Models API failed, will try Copilot CLI:', err)
      return null
    }
  }

  /**
   * Fallback to local Copilot CLI (no web search, but reliable)
   */
  private async generateWithCopilotCLI(prompt: string): Promise<string> {
    const cmd = process.env.COPILOT_CLI_BIN || '/usr/local/bin/copilot'

    return new Promise((resolve, reject) => {
      const env = { ...process.env }
      if (this.githubToken) {
        env.GITHUB_TOKEN = this.githubToken
      }

      const child = spawn(cmd, ['-p', prompt], {
        timeout: 60000,
        stdio: ['ignore', 'pipe', 'pipe'],
        env
      })

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
        console.error('copilot-stderr:', data.toString())
      })

      child.on('error', (err) => {
        reject(new Error(
          `Copilot CLI failed at ${cmd}. Ensure copilot_boot container completed successfully. ` +
          `Check docker logs: docker compose logs copilot_boot. Error: ${String(err)}`
        ))
      })

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(
            `Copilot CLI failed at ${cmd}. Ensure copilot_boot container completed successfully. ` +
            `Check docker logs: docker compose logs copilot_boot. Error: ${stderr || stdout}`
          ))
        } else if (stdout.trim()) {
          console.log('✓ Generated using Copilot CLI (fallback)')
          resolve(stdout.trim())
        } else {
          reject(new Error('No output from copilot CLI'))
        }
      })
    })
  }

  async generate(prompt: string, context?: string, options?: Record<string, any>): Promise<string> {
    const fullPrompt = context ? `${prompt}\n\nContext:\n${context}` : prompt
    const maxTokens = options?.maxTokens || 2000

    // Priority 1: Try GitHub Models API (supports web search with web browsing)
    try {
      const result = await this.generateWithModelsAPI(fullPrompt, maxTokens)
      if (result) {
        return result
      }
    } catch (err) {
      console.warn('GitHub Models API error:', err)
    }

    // Priority 2: Fall back to local Copilot CLI (reliable but no web search)
    console.log('Falling back to Copilot CLI...')
    return this.generateWithCopilotCLI(fullPrompt)
  }
}
