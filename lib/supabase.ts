import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Type definitions for database tables
export interface Idea {
  id?: string
  user_id: string
  title: string
  why_it_matters?: string
  virality_score?: number
  business_score?: number
  status?: 'new' | 'selected' | 'researched' | 'generated' | 'published' | 'archived'
  created_at?: string
  updated_at?: string
}

export interface Research {
  id?: string
  user_id: string
  idea_id: string
  content: string
  created_at?: string
}

export interface GeneratedContent {
  id?: string
  user_id: string
  idea_id: string
  linkedin_post?: string
  blog_post?: string
  newsletter_post?: string
  slug?: string
  seo_title?: string
  seo_description?: string
  created_at?: string
}

export interface UserKnowledge {
  id?: string
  user_id: string
  cv_content?: string
  experience_content?: string
  created_at?: string
  updated_at?: string
}

