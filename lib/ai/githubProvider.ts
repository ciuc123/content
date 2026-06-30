import { AIProvider } from './ai'
import { exec as cpExec } from 'child_process'
import { promisify } from 'util'
const exec = promisify(cpExec)

export class GitHubModelsProvider implements AIProvider {
  async generate(prompt: string, context?: string) {
    const fullPrompt = context ? `${prompt}\n\nContext:\n${context}` : prompt
    // Escape double quotes
    const safePrompt = fullPrompt.replace(/"/g, '\\"')

    // Try a set of possible CLI invocations. The container image attempts to install
    // a `copilot` binary. You can also set COPILOT_CLI_BIN to an explicit command.
    const candidates: string[] = []
    if (process.env.COPILOT_CLI_BIN) candidates.push(process.env.COPILOT_CLI_BIN)
    candidates.push('copilot')
    candidates.push('npx @githubnext/copilot-cli')

    let lastErr: any = null
    for (const cmd of candidates) {
      try {
        // Use -p flag for prompt mode in copilot CLI
        const { stdout, stderr } = await exec(`${cmd} -p "${safePrompt}"`)
        if (stderr) console.error('copilot-stderr:', stderr)
        const out = (stdout || '').toString().trim()
        if (out) return out
      } catch (err: any) {
        lastErr = err
        // try next candidate
      }
    }

    throw new Error(
      'GitHub Copilot CLI invocation failed. Tried: ' + candidates.join(', ') +
      '. Set COPILOT_CLI_BIN to a usable command or use AI_PROVIDER=manual. Last error: ' + String(lastErr)
    )
  }
}
