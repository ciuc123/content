import type { NextApiRequest, NextApiResponse } from 'next'
import { auth } from '@clerk/nextjs/server'
import fs from 'fs'
import path from 'path'
import { supabase, type Idea } from '../../../lib/supabase'

const USE_SUPABASE = process.env.USE_SUPABASE === 'true'
const dataFile = path.join(process.cwd(), 'data', 'ideas.json')

type ResponseData = {
  ideas?: Idea[]
  ok?: boolean
  count?: number
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  // Get user ID from Clerk
  const { userId } = auth()

  // If Supabase is enabled, require authentication
  if (USE_SUPABASE && !userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      if (USE_SUPABASE && userId) {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('ideas')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return res.status(200).json({ ideas: data || [] })
      } else {
        // Fallback to file-based storage (dev mode)
        const raw = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf-8') : '[]'
        const ideas = JSON.parse(raw || '[]')
        return res.status(200).json({ ideas })
      }
    } catch (err: any) {
      return res.status(500).json({ error: String(err) })
    }
  }

  if (req.method === 'POST') {
    try {
      const { payload } = req.body
      if (!payload) return res.status(400).json({ error: 'payload is required' })

      let ideas: Idea[] = []

      // Parse payload as JSON if string
      if (typeof payload === 'string') {
        ideas = JSON.parse(payload)
      } else {
        ideas = Array.isArray(payload) ? payload : [payload]
      }

      if (!Array.isArray(ideas)) {
        return res.status(400).json({ error: 'payload must be an array' })
      }

      if (USE_SUPABASE && userId) {
        // Insert into Supabase
        const dataToInsert = ideas.map(idea => ({
          ...idea,
          user_id: userId,
          status: 'new',
        }))

        const { error } = await supabase
          .from('ideas')
          .insert(dataToInsert)

        if (error) throw new Error(error.message)
        return res.status(200).json({ ok: true, count: ideas.length })
      } else {
        // Save to file (dev mode)
        const raw = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf-8') : '[]'
        const existing = JSON.parse(raw || '[]')
        const updated = [...existing, ...ideas]
        fs.mkdirSync(path.dirname(dataFile), { recursive: true })
        fs.writeFileSync(dataFile, JSON.stringify(updated, null, 2))
        return res.status(200).json({ ok: true, count: ideas.length })
      }
    } catch (err: any) {
      return res.status(500).json({ error: String(err) })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end('Method Not Allowed')
}

