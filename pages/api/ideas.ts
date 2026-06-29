import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const dataFile = path.join(process.cwd(), 'data', 'ideas.json')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const raw = fs.readFileSync(dataFile, 'utf-8')
      const data = JSON.parse(raw || '[]')
      return res.status(200).json({ ideas: data })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read ideas file', details: String(err) })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body
      let ideas = []
      if (Array.isArray(body)) {
        ideas = body
      } else if (Array.isArray(body.ideas)) {
        ideas = body.ideas
      } else if (typeof body.payload === 'string') {
        ideas = JSON.parse(body.payload)
      } else if (typeof body.text === 'string') {
        ideas = JSON.parse(body.text)
      } else {
        return res.status(400).json({ error: 'Invalid payload' })
      }
      fs.mkdirSync(path.dirname(dataFile), { recursive: true })
      fs.writeFileSync(dataFile, JSON.stringify(ideas, null, 2))
      return res.status(200).json({ ok: true, count: ideas.length })
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save ideas', details: String(err) })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}

