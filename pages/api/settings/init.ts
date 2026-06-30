import type { NextApiRequest, NextApiResponse } from 'next'
import { auth } from '@clerk/nextjs'
import { supabaseServer } from '../../../lib/supabase'

interface InitUserResponse {
  success?: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InitUserResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { userId } = auth()
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabase = supabaseServer()

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    // User already exists - nothing to do
    if (existingUser) {
      return res.status(200).json({ success: true })
    }

    // Create new user record
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error creating user:', insertError)
      return res.status(500).json({ error: 'Failed to create user record' })
    }

    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('Init user error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

