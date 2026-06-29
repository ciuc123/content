import { AIProvider } from './ai'
import { exec as cpExec } from 'child_process'
import { promisify } from 'util'
const exec = promisify(cpExec)

export class GitHubModelsProvider implements AIProvider {
  async generate(prompt: string, context?: string) {
    // Prefer explicit CLI binary if set
    const cliBin = process.env.COPILOT_CLI_BIN || 'npx @githubnext/copilot-cli'
    const fullPrompt = context ? `${prompt}\n\nContext:\n${context}` : prompt

    // Escape double quotes
    const safePrompt = fullPrompt.replace(/"/g, '\\"')

    try {
      // Call the Copilot CLI via npx (will download if not installed) or use installed binary
      const { stdout, stderr } = await exec(`${cliBin} "${safePrompt}"`)
      if (stderr) console.error('copilot-stderr:', stderr)
      return (stdout || '').toString().trim()
    } catch (err: any) {
      throw new Error(
        'GitHub Copilot CLI invocation failed. Install the CLI with `npm i -g @githubnext/copilot-cli` or set COPILOT_CLI_BIN to a usable command. Original error: ' + String(err)
      )
    }
  }
}

