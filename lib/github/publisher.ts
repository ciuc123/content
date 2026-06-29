import { Octokit } from '@octokit/rest'
import fs from 'fs'
import path from 'path'

interface PublishParams {
  repoFullName: string // owner/repo
  branchName: string
  filePath: string
  fileContent: string
  commitMessage: string
  prTitle: string
  prBody: string
}

export async function publishToGitHub(params: PublishParams) {
  const { repoFullName, branchName, filePath, fileContent, commitMessage, prTitle, prBody } = params

  const mock = process.env.GITHUB_MOCK === 'true' || process.env.GITHUB_MOCK === '1' || process.env.GITHUB_MOCK === 'true'
  if (mock) {
    // write to local content/posts for quick dev
    const outDir = path.resolve(process.cwd(), 'content', 'posts')
    try {
      fs.mkdirSync(outDir, { recursive: true })
      const localPath = path.join(outDir, path.basename(filePath))
      fs.writeFileSync(localPath, fileContent)
      return { mock: true, path: localPath }
    } catch (err) {
      throw new Error('Failed to write mock file: ' + String(err))
    }
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN not set')

  const [owner, repo] = repoFullName.split('/')
  const octokit = new Octokit({ auth: token })

  // get default branch
  const { data: repoData } = await octokit.repos.get({ owner, repo })
  const defaultBranch = repoData.default_branch

  // get default branch ref
  const refName = `refs/heads/${defaultBranch}`
  const { data: refData } = await octokit.git.getRef({ owner, repo, ref: refName })
  const baseSha = refData.object.sha

  // create branch
  await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branchName}`, sha: baseSha })

  // create or update file on new branch using createOrUpdateFileContents
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(fileContent).toString('base64'),
    branch: branchName
  })

  // create PR
  const pr = await octokit.pulls.create({ owner, repo, title: prTitle, head: branchName, base: defaultBranch, body: prBody })

  return pr.data
}

