import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import { supabaseServer } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { userId: clerkUserId } = getAuth(req)
    const devAuthDisabled = process.env.DEV_AUTH_DISABLED === 'true'
    const userId = clerkUserId || (devAuthDisabled ? 'dev-user' : null)
    if (!userId) return res.status(401).json({ error: 'Authentication required' })

    const { index, ideaId } = req.body
    const supabase = supabaseServer()

    // If ideaId provided, validate ownership and update
    if (ideaId) {
      const { data: ideaRecord, error: findErr } = await supabase
        .from('ideas')
        .select('id')
        .eq('id', ideaId)
        .eq('user_id', userId)
        .single()

      if (findErr || !ideaRecord) return res.status(400).json({ error: 'Idea not found or access denied' })

      const { data: updated, error: updateErr } = await supabase
        .from('ideas')
        .update({ status: 'selected' })
        .eq('id', ideaId)
        .select()
        .single()

      if (updateErr) throw new Error(updateErr.message)
      return res.status(200).json({ ok: true, index: null, idea: updated })
    }

    // Otherwise, use index (compatibility with older file-based UI)
    if (typeof index !== 'number') return res.status(400).json({ error: 'ideaId or index is required' })

    const { data: ideas, error: listErr } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (listErr) throw new Error(listErr.message)
    if (!Array.isArray(ideas) || index < 0 || index >= ideas.length) return res.status(400).json({ error: 'Invalid index' })

    const selected = ideas[index]
    const { data: updated, error: updateErr } = await supabase
      .from('ideas')
      .update({ status: 'selected' })
      .eq('id', selected.id)
      .select()
      .single()

    if (updateErr) throw new Error(updateErr.message)
    return res.status(200).json({ ok: true, index, idea: updated })
  } catch (err: any) {
    return res.status(500).json({ error: String(err) })
  }
}

