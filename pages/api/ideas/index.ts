import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { supabaseHelpers } from '../../../lib/supabase'

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
    // Unauthenticated users cannot sync from cloud
    if (!userId) {
      return res.status(401).json({ error: 'Sign in to sync data' })
    }
    try {
      const { data, error } = await supabaseHelpers.getIdeas(userId)
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ideas: data || [] })
    } catch (err: any) {
      return res.status(500).json({ error: String(err) })
    }
  }

  if (req.method === 'POST') {
    // Unauthenticated users must use client-side storage
    if (!userId) {
      return res.status(401).json({ error: 'Sign in to sync ideas to cloud. Using browser storage locally.' })
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

      let count = 0
      for (const idea of ideas) {
        const { error } = await supabaseHelpers.createIdea(userId, {
          title: idea.title,
          why_it_matters: idea.why_it_matters,
          virality_score: idea.virality_score,
          business_score: idea.business_score,
        })
        if (!error) count++
      }

      return res.status(200).json({ ok: true, count })
    } catch (err: any) {
      return res.status(500).json({ error: String(err) })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end('Method Not Allowed')
}
