import type { NextApiRequest, NextApiResponse } from 'next'
import { withAdminAuth } from '../../../lib/clerk'
import { supabaseServer } from '../../../lib/supabase'

interface AdminCheckResponse {
  isAdmin: boolean
  stats?: {
    totalUsers: number
    admins: number
    activeApiKeys: number
  }
  error?: string
}

const handler = async (req: NextApiRequest, res: NextApiResponse<AdminCheckResponse>, userId: string) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ isAdmin: false, error: 'Method Not Allowed' })
  }

  try {
    const supabase = supabaseServer()

    // Get stats for admin dashboard
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: admins } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', true)

    const { count: activeApiKeys } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('api_key_encrypted', 'is', null)

    return res.status(200).json({
      isAdmin: true,
      stats: {
        totalUsers: totalUsers || 0,
        admins: admins || 0,
        activeApiKeys: activeApiKeys || 0
      }
    })
  } catch (err: any) {
    console.error('Admin check error:', err)
    return res.status(500).json({ isAdmin: false, error: 'Internal server error' })
  }
}

export default withAdminAuth(handler)

