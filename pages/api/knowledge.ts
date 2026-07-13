import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { supabaseServer } from '../../lib/supabase'

type ResponseData = { ok?: boolean; data?: any; error?: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  const { userId: clerkUserId } = getAuth(req)
  const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
  const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)

  if (!userId) return res.status(401).json({ error: 'Authentication required' })

  try {
    const supabase = supabaseServer()

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('user_knowledge')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && (error as any).message) throw new Error((error as any).message)
      return res.status(200).json({
        ok: true,
        data: {
          cv: data?.cv_content || '',
          experience: data?.experience_content || '',
        },
      })
    }

    if (req.method === 'POST') {
      const { key, content } = req.body
      if (!key || typeof content !== 'string') return res.status(400).json({ error: 'key and content are required' })
      if (!['cv', 'experience'].includes(key)) return res.status(400).json({ error: 'unknown key' })

      const payload: any = {}
      if (key === 'cv') payload.cv_content = content
      if (key === 'experience') payload.experience_content = content

      // Upsert for user's knowledge
      const { data: existing } = await supabase.from('user_knowledge').select('id').eq('user_id', userId).single()
      let result
      if (existing) {
        const { data, error } = await supabase
          .from('user_knowledge')
          .update(payload)
          .eq('user_id', userId)
          .select()
          .single()
        result = { data, error }
      } else {
        const { data, error } = await supabase.from('user_knowledge').insert({ user_id: userId, ...payload }).select().single()
        result = { data, error }
      }

      if (result.error) throw new Error((result.error as any).message)
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end('Method Not Allowed')
  } catch (err: any) {
    return res.status(500).json({ error: String(err) })
  }
}

