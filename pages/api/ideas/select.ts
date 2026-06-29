import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

const dataFile = path.join(process.cwd(), 'data', 'ideas.json')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { index } = req.body
    const raw = fs.readFileSync(dataFile, 'utf-8')
    const ideas = JSON.parse(raw || '[]')
    if (typeof index !== 'number' || index < 0 || index >= ideas.length) {
      return res.status(400).json({ error: 'Invalid index' })
    }

    ideas.forEach((it: any, idx: number) => {
      if (idx === index) it.status = 'selected'
    })

    fs.writeFileSync(dataFile, JSON.stringify(ideas, null, 2))
    return res.status(200).json({ ok: true, index, idea: ideas[index] })
  } catch (err: any) {
    return res.status(500).json({ error: String(err) })
  }
}

