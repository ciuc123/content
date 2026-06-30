import type { NextApiRequest, NextApiResponse } from 'next'
import { auth } from '@clerk/nextjs'
import { supabaseHelpers, supabase } from '../../../lib/supabase'

interface IdeasResponse {
  success: boolean
  data?: any[]
  error?: string
}

/**
 * API Route: /api/ideas
 *
 * GET: Fetch all ideas for the authenticated user from Supabase
 * POST: Create a new idea for the authenticated user in Supabase
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IdeasResponse>
) {
  try {
    // Get authenticated user from Clerk
    const { userId } = auth()

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }

    switch (req.method) {
      case 'GET':
        return handleGetIdeas(userId, res)

      case 'POST':
        return handleCreateIdea(userId, req, res)

      default:
        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).json({ success: false, error: 'Method Not Allowed' })
    }
  } catch (error: any) {
    console.error('Ideas API error:', error)
    return res.status(500).json({ success: false, error: String(error) })
  }
}

async function handleGetIdeas(userId: string, res: NextApiResponse<IdeasResponse>) {
  try {
    const { data, error } = await supabaseHelpers.getIdeas(userId)

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('Error fetching ideas:', error)
    return res.status(500).json({ success: false, error: String(error) })
  }
}

async function handleCreateIdea(
  userId: string,
  req: NextApiRequest,
  res: NextApiResponse<IdeasResponse>
) {
  try {
    const { title, why_it_matters, virality_score, business_score } = req.body

    if (!title) {
      return res.status(400).json({ success: false, error: 'title is required' })
    }

    const { data, error } = await supabaseHelpers.createIdea(userId, {
      title,
      why_it_matters: why_it_matters || '',
      virality_score: virality_score || 0,
      business_score: business_score || 0,
      status: 'new',
    })

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(201).json({ success: true, data: [data] })
  } catch (error: any) {
    console.error('Error creating idea:', error)
    return res.status(500).json({ success: false, error: String(error) })
  }
}

