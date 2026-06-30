import { AIProvider } from './ai'
import { spawn } from 'child_process'

export class GitHubModelsProvider implements AIProvider {
  private githubToken?: string

  constructor(githubToken?: string) {
    this.githubToken = githubToken
  }

  async generate(prompt: string, context?: string): Promise<string> {
    const fullPrompt = context ? `${prompt}\n\nContext:\n${context}` : prompt
    const cmd = process.env.COPILOT_CLI_BIN || '/usr/local/bin/copilot'

    return new Promise((resolve, reject) => {
      // Prepare environment with GitHub token if provided
      const env = { ...process.env }
      if (this.githubToken) {
        env.GITHUB_TOKEN = this.githubToken
      }

      // Use spawn instead of exec for safer argument passing
      // Arguments are passed as array - shell cannot interpret them as code
      const child = spawn(cmd, ['-p', fullPrompt], {
        timeout: 60000,
        stdio: ['ignore', 'pipe', 'pipe'],
        env // Pass environment with token if available
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
          resolve(stdout.trim())
        } else {
          reject(new Error('No output from copilot CLI'))
        }
      })
    })
  }
}
