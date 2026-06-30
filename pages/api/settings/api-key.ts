import type { NextApiRequest, NextApiResponse } from 'next'
import { auth } from '@clerk/nextjs'
import { supabaseServer } from '../../../lib/supabase'
import { encryptString } from '../../../lib/encryption'

interface ApiKeyRequest {
  apiKey: string
}

interface ApiKeyResponse {
  success?: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiKeyResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    // Check authentication
    const { userId } = auth()
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { apiKey } = req.body as ApiKeyRequest
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'apiKey is required' })
    }

    // Encrypt the API key
    let encrypted: string
    try {
      encrypted = encryptString(apiKey)
    } catch (err: any) {
      console.error('Encryption error:', err)
      return res.status(500).json({ error: 'Failed to encrypt API key' })
    }

    // Get Supabase server client
    const supabase = supabaseServer()

    // Check if user record exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected for new users)
      console.error('Error fetching user:', fetchError)
      return res.status(500).json({ error: 'Database error' })
    }

    let result
    if (existingUser) {
      // Update existing user record
      result = await supabase
        .from('users')
        .update({
          api_key_encrypted: encrypted,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', userId)
        .select()
        .single()
    } else {
      // Create new user record
      result = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          api_key_encrypted: encrypted,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving API key:', result.error)
      return res.status(500).json({ error: 'Failed to save API key' })
    }

    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('API key endpoint error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

