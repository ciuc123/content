import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const baseDir = path.join(process.cwd(), 'knowledge')
const files = {
  cv: path.join(baseDir, 'cv.md'),
  experience: path.join(baseDir, 'experience.md')
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const data: any = {}
      for (const key of Object.keys(files)) {
        const p = (files as any)[key]
        data[key] = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : ''
      }
      return res.status(200).json({ ok: true, data })
    } catch (err: any) {
      return res.status(500).json({ error: St1ring(err) })
    }
  }

  if (req.method === 'POST') {
    try {
      const { key, content } = req.body
      if (!key || typeof content !== 'string') return res.status(400).json({ error: 'key and content are required' })
      if (!(key in files)) return res.status(400).json({ error: 'unknown key' })
      const outPath = (files as any)[key]
      fs.mkdirSync(path.dirname(outPath), { recursive: true })
      fs.writeFileSync(outPath, content)
      return res.status(200).json({ ok: true })
    } catch (err: any) {
      return res.status(500).json({ error: String(err) })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end('Method Not Allowed')
}

