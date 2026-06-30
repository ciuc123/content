import { AIProvider } from './ai'
import { exec as cpExec } from 'child_process'
import { promisify } from 'util'
const exec = promisify(cpExec)

export class GitHubModelsProvider implements AIProvider {
  async generate(prompt: string, context?: string) {
    const fullPrompt = context ? `${prompt}\n\nContext:\n${context}` : prompt
    // Escape double quotes
    const safePrompt = fullPrompt.replace(/"/g, '\\"')

    // Use the copilot binary from copilot_boot container
    // The copilot_boot container downloads and extracts the binary into /opt/copilot/
    // which is mounted as a shared volume and linked to /usr/local/bin/copilot
    const cmd = process.env.COPILOT_CLI_BIN || '/usr/local/bin/copilot'

    try {
      // Use -p flag for prompt mode in copilot CLI
      const { stdout, stderr } = await exec(`${cmd} -p "${safePrompt}"`)
      if (stderr) console.error('copilot-stderr:', stderr)
      const out = (stdout || '').toString().trim()
      if (out) return out

      throw new Error('No output from copilot CLI')
    } catch (err: any) {
      throw new Error(
        `Copilot CLI failed at ${cmd}. Ensure copilot_boot container completed successfully. ` +
        `Check docker logs: docker compose logs copilot_boot. Error: ${String(err)}`
      )
    }
  }
}
