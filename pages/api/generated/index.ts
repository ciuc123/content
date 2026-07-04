import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import fs from 'fs'
import path from 'path'
import { supabaseServer, type GeneratedContent } from '../../../lib/supabase'

const USE_SUPABASE = process.env.USE_SUPABASE === 'true'
const dataFile = path.join(process.cwd(), 'data', 'generated.json')

type ResponseData = {
  generated?: GeneratedContent[]
  ok?: boolean
  entry?: GeneratedContent
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
        const supabase = supabaseServer()
        const { data, error } = await supabase
          .from('generated_content')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return res.status(200).json({ generated: data || [] })
      } else {
        // Unauthenticated users or file-based storage
        const raw = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf-8') : '[]'
        const data = JSON.parse(raw || '[]')
        return res.status(200).json({ generated: data })
      }
    } catch (err: any) {
      return res.status(500).json({ error: String(err) })
    }
  }

  if (req.method === 'POST') {
    try {
      const { idea, linkedin_post, blog_post, newsletter_post } = req.body

      if (USE_SUPABASE && userId) {
        // Use the provided idea's ID
        const ideaId = idea?.id
        if (!ideaId) {
          return res.status(400).json({ error: 'Idea ID is required' })
        }

        // Verify the idea belongs to the user
        const supabase = supabaseServer()
        const { data: ideaRecord, error: ideaError } = await supabase
          .from('ideas')
          .select('id')
          .eq('id', ideaId)
          .eq('user_id', userId)
          .single()

        if (ideaError || !ideaRecord) {
          return res.status(400).json({ error: 'Idea not found or access denied' })
        }

        const entry: GeneratedContent = {
          user_id: userId,
          idea_id: ideaId,
          linkedin_post,
          blog_post,
          newsletter_post,
          slug: idea?.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '',
        }

        const { data: inserted, error } = await supabase
          .from('generated_content')
          .insert([entry])
          .select()

        if (error) throw new Error(error.message)
        return res.status(200).json({ ok: true, entry: inserted?.[0] })
      } else {
        const raw = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, 'utf-8') : '[]'
        const data = JSON.parse(raw || '[]')
        const entry = {
          id: Date.now().toString(),
          idea,
          linkedin_post,
          blog_post,
          newsletter_post,
          created_at: new Date().toISOString(),
        } as any
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
