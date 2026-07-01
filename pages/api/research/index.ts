import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import fs from 'fs'
import path from 'path'
import { supabase, type Research } from '../../../lib/supabase'

const USE_SUPABASE = process.env.USE_SUPABASE === 'true'
const dataFile = path.join(process.cwd(), 'data', 'research.json')

type ResponseData = {
  research?: Research[]
  ok?: boolean
  entry?: Research
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { userId: clerkUserId } = getAuth(req)

  // In dev mode with auth disabled, use a default dev user ID
  const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
  const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)

  if (req.method === 'GET') {
    try {
      if (USE_SUPABASE && userId) {
        const { data, error } = await supabase
          .from('research')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return res.status(200).json({ research: data || [] })
      } else {
        // Unauthenticated users or file-based storage
        const raw = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf-8') : '[]'
        const data = JSON.parse(raw || '[]')
        return res.status(200).json({ research: data })
      }
    } catch (err: any) {
      return res.status(500).json({ error: String(err) })
    }
  }

  if (req.method === 'POST') {
    try {
      const { index, idea, content } = req.body
      if (typeof content !== 'string') return res.status(400).json({ error: 'content is required' })

      if (USE_SUPABASE && userId) {
        // For authenticated users, save research with the idea data
        // The idea might not have a database ID yet (if just generated)

        let ideaId = idea?.id

        // If idea has an ID, verify it exists and belongs to user
        if (ideaId) {
          const { data: ideaRecord, error: ideaError } = await supabase
            .from('ideas')
            .select('id')
            .eq('id', ideaId)
            .eq('user_id', userId)
            .single()

          if (ideaError || !ideaRecord) {
            return res.status(400).json({ error: 'Idea not found or access denied' })
          }
        } else if (idea?.title) {
          // If no ID but has title, try to find by title (for generated ideas)
          const { data: ideaRecord, error: ideaError } = await supabase
            .from('ideas')
            .select('id')
            .eq('title', idea.title)
            .eq('user_id', userId)
            .single()

          if (!ideaError && ideaRecord) {
            ideaId = ideaRecord.id
          }
          // If not found, we'll create a research entry without an idea_id
          // (in case the idea needs to be saved separately first)
        }

        const entry: Research = {
          user_id: userId,
          idea_id: ideaId || null, // Can be null if idea hasn't been saved yet
          content,
        }

        const { data: inserted, error } = await supabase
          .from('research')
          .insert([entry])
          .select()

        if (error) throw new Error(error.message)
        return res.status(200).json({ ok: true, entry: inserted?.[0] })
      } else {
        const raw = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf-8') : '[]'
        const data = JSON.parse(raw || '[]')
        const entry = { index, idea, content, created_at: new Date().toISOString() } as any
        data.push(entry)
        fs.mkdirSync(path.dirname(dataFile), { recursive: true })
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))
        return res.status(200).json({ ok: true, entry })
      }
    } catch (err: any) {
      return res.status(500).json({ error: String(err) })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end('Method Not Allowed')
}

