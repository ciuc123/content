import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { supabaseHelpers, supabaseServer } from '../../../lib/supabase'

type ResponseData = {
  ideas?: any[]
  ok?: boolean
  count?: number
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  // Get user ID from Clerk
  const { userId } = getAuth(req)

  if (req.method === 'GET') {
    // Unauthenticated users get empty list (they use localStorage)
    if (!userId) {
      return res.status(200).json({ ideas: [] })
    }
    try {
      // Use server-side Supabase client for secure server operations
      const supabaseAdmin = supabaseServer()
      const { data, error } = await supabaseAdmin
        .from('ideas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Failed to fetch ideas:', error)
        return res.status(500).json({ error: error.message })
      }
      return res.status(200).json({ ideas: data || [] })
    } catch (err: any) {
      console.error('Ideas GET error:', err)
      return res.status(500).json({ error: String(err) })
    }
  }

  if (req.method === 'POST') {
    // Unauthenticated users must use client-side storage
    if (!userId) {
      return res.status(400).json({ error: 'Sign in to sync ideas to cloud. Using browser storage locally.' })
    }
    try {
      const { payload } = req.body
      if (!payload) return res.status(400).json({ error: 'payload is required' })

      let ideas: any[] = []

      // Parse payload as JSON if string
      if (typeof payload === 'string') {
        ideas = JSON.parse(payload)
      } else {
        ideas = Array.isArray(payload) ? payload : [payload]
      }

      if (!Array.isArray(ideas)) {
        return res.status(400).json({ error: 'payload must be an array' })
      }

      // Use server-side Supabase client to bypass RLS and insert ideas
      const supabaseAdmin = supabaseServer()
      let count = 0
      const inserted: any[] = []

      for (const idea of ideas) {
         const { data, error } = await supabaseAdmin
           .from('ideas')
           .insert({
             user_id: userId,
             title: idea.title,
             why_it_matters: idea.why_it_matters,
             virality_score: idea.virality_score,
             business_score: idea.business_score,
             status: 'new',
           })
           .select()

        if (error) {
          console.error(`Failed to create idea "${idea.title}":`, error)
        } else {
          count++
          if (Array.isArray(data) && data.length > 0) {
            inserted.push(data[0])
          }
        }
      }

      return res.status(200).json({ ok: true, count, inserted })
    } catch (err: any) {
      console.error('Ideas POST error:', err)
      return res.status(500).json({ error: String(err) })
    }
  }

    if (req.method === 'PATCH') {
      // Unauthenticated users cannot update ideas in database
      if (!userId) {
        return res.status(400).json({ error: 'Sign in to update ideas. Using browser storage locally.' })
      }
      try {
        const { idea_id, status } = req.body
        if (!idea_id) return res.status(400).json({ error: 'idea_id is required' })

        // Default to 'researched' if no status provided (backward compatibility)
        const newStatus = status || 'researched'

        // Use server-side Supabase client to update status
        const supabaseAdmin = supabaseServer()

        // Reset all ideas to 'new' status for this user first
        await supabaseAdmin
          .from('ideas')
          .update({ status: 'new' })
          .eq('user_id', userId)

        // Set the selected idea to the requested status
        const { data, error } = await supabaseAdmin
          .from('ideas')
          .update({ status: newStatus })
          .eq('id', idea_id)
          .eq('user_id', userId)
          .select()

        if (error) {
          console.error('Failed to update idea status:', error)
          return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ ok: true, idea: data?.[0] })
      } catch (err: any) {
        console.error('Ideas PATCH error:', err)
        return res.status(500).json({ error: String(err) })
      }
    }

   res.setHeader('Allow', ['GET', 'POST', 'PATCH'])
   res.status(405).end('Method Not Allowed')
}
