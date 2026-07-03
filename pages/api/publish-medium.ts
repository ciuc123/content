import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { supabaseServer } from '../../lib/supabase'
import { publishToGitHub } from '../../lib/github/publisher'

type PublishMedium = 'blog' | 'linkedin' | 'newsletter'

interface PublishRequest {
  medium: PublishMedium
  ideaId: string
  content: string
  title?: string
  slug?: string
  description?: string
}

interface PublishResponse {
  ok?: boolean
  error?: string
  result?: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublishResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { medium, ideaId, content, title, slug, description } = req.body as PublishRequest

    if (!medium || !ideaId || !content) {
      return res.status(400).json({ error: 'medium, ideaId, and content are required' })
    }

    if (!['blog', 'linkedin', 'newsletter'].includes(medium)) {
      return res.status(400).json({ error: 'Invalid medium' })
    }

    const supabase = supabaseServer()

    // Verify idea exists and belongs to user
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('id, title')
      .eq('id', ideaId)
      .eq('user_id', userId)
      .single()

    if (ideaError || !idea) {
      return res.status(403).json({ error: 'Idea not found or access denied' })
    }

    if (medium === 'blog') {
      // Blog post: create GitHub PR
      if (!title || !slug) {
        return res.status(400).json({ error: 'title and slug required for blog publishing' })
      }

      const date = new Date().toISOString().split('T')[0]
      const fileName = `${date}-${slug}.md`
      const filePath = `content/posts/${fileName}`

      const frontmatter = `---\ntitle: "${title.replace(/\"/g, '\\"')}"\ndescription: "${(description || '').replace(/\"/g, '\\"')}"\ndate: "${new Date().toISOString()}"\nslug: "${slug}"\ntags: []\n---\n\n`
      const markdown = frontmatter + content

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

      // Update idea status to published
      await supabase
        .from('ideas')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', ideaId)

      // Update or create generated_content entry with blog_post
      const { data: existing } = await supabase
        .from('generated_content')
        .select('id')
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .single()

      if (existing) {
        await supabase
          .from('generated_content')
          .update({ blog_post: content })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('generated_content')
          .insert({
            user_id: userId,
            idea_id: ideaId,
            blog_post: content,
            slug,
            seo_title: title,
            seo_description: description || '',
            created_at: new Date().toISOString()
          })
      }

      return res.status(200).json({ ok: true, result })
    } else {
      // LinkedIn or Newsletter: save to generated_content
      const updateField = medium === 'linkedin' ? 'linkedin_post' : 'newsletter_post'

      const { data: existing } = await supabase
        .from('generated_content')
        .select('id')
        .eq('idea_id', ideaId)
        .eq('user_id', userId)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('generated_content')
          .update({ [updateField]: content })
          .eq('id', existing.id)

        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('generated_content')
          .insert({
            user_id: userId,
            idea_id: ideaId,
            [updateField]: content,
            created_at: new Date().toISOString()
          })

        if (error) throw new Error(error.message)
      }

      return res.status(200).json({ ok: true, result: { saved: medium } })
    }
  } catch (err: any) {
    console.error('Publish medium error:', err)
    return res.status(500).json({ error: String(err) })
  }
}

