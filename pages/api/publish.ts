import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { publishToGitHub } from '../../lib/github/publisher'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end("Method Not Allowed")
  }

  try {
    const { title, slug, body, description, tags } = req.body
    if (!title || !slug || !body) return res.status(400).json({ error: 'title, slug and body are required' })

    const date = new Date().toISOString().split('T')[0]
    const fileName = `${date}-${slug}.md`
    const filePath = `content/posts/${fileName}`

    const frontmatter = `---\ntitle: "${title.replace(/\"/g, '\\"')}"\ndescription: "${(description || '').replace(/\"/g, '\\"')}"\ndate: "${new Date().toISOString()}"\nslug: "${slug}"\ntags: ${JSON.stringify(tags || [])}\n---\n\n`
    const markdown = frontmatter + body

    // call publisher (will respect GITHUB_MOCK env var)
    const repo = process.env.GITHUB_TARGET_REPO || 'ciuc123/ciuc123.github.io'
    const branch = `ideas/${date}-${slug}`
    const commitMessage = `Add blog post: ${title}`
    const prTitle = `Add blog post: ${title}`
    const prBody = 'Generated from Ideas Content Engine'

    const result = await publishToGitHub({
      repoFullName: repo,
      branchName: branch,
      filePath,
      fileContent: markdown,
      commitMessage,
      prTitle,
      prBody
    })

    return res.status(200).json({ ok: true, result })
  } catch (err: any) {
    return res.status(500).json({ error: String(err) })
  }
}

