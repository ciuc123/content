import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const dataFile = path.join(process.cwd(), 'data', 'generated.json')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const raw = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf-8') : '[]'
      const data = JSON.parse(raw || '[]')
      return res.status(200).json({ generated: data })
    } catch (err: any) {
      return res.status(500).json({ error: String(err) })
    }
  }

  if (req.method === 'POST') {
    try {
      const { index, idea, linkedin_post, blog_post, newsletter_post, seo_title, seo_description, slug } = req.body
      if (typeof index !== 'number' && typeof idea === 'undefined') return res.status(400).json({ error: 'index or idea required' })

      const raw = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf-8') : '[]'
      const data = JSON.parse(raw || '[]')
      const entry = {
        id: Date.now().toString(),
        index,
        idea,
        linkedin_post: linkedin_post || '',
        blog_post: blog_post || '',
        newsletter_post: newsletter_post || '',
        seo_title: seo_title || '',
        seo_description: seo_description || '',
        slug: slug || '',
        created_at: new Date().toISOString()
      }
      data.push(entry)
      fs.mkdirSync(path.dirname(dataFile), { recursive: true })
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))
      return res.status(200).json({ ok: true, entry })
    } catch (err: any) {
      return res.status(500).json({ error: String(err) })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end('Method Not Allowed')
}

