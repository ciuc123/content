  import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Client-side Supabase client (use this in browser/API routes)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'ideas-content-engine',
    },
  },
})

// Server-side Supabase client with service role (use this for server-only operations)
export const supabaseServer = () => {
  if (!supabaseServiceKey) {
    console.warn('⚠️  Supabase service role key not configured. Set SUPABASE_SERVICE_ROLE_KEY for server operations.')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'ideas-content-engine-server',
      },
    },
  })
}

// Type definitions for database tables
export interface Idea {
  id?: string
  user_id: string
  title: string
  why_it_matters?: string
  virality_score?: number
  business_score?: number
  status?: 'new' | 'selected' | 'research-imported' | 'research-generated' | 'published' | 'archived'
  created_at?: string
  updated_at?: string
}

export interface Research {
  id?: string
  user_id: string
  idea_id?: string | null  // Can be null if idea hasn't been saved yet
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

// Helper functions for common operations
export const supabaseHelpers = {
  // Ideas
  async getIdeas(userId: string) {
    return supabase
      .from('ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  },

   async createIdea(userId: string, idea: Omit<Idea, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
     return supabase
       .from('ideas')
       .insert({ status: 'new', ...idea, user_id: userId })
       .select()
       .single()
   },

  async updateIdea(ideaId: string, updates: Partial<Idea>) {
    return supabase
      .from('ideas')
      .update(updates)
      .eq('id', ideaId)
      .select()
      .single()
  },

  // Research
  async getResearch(userId: string, ideaId: string) {
    return supabase
      .from('research')
      .select('*')
      .eq('user_id', userId)
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false })
  },

  async saveResearch(userId: string, ideaId: string, content: string) {
    return supabase
      .from('research')
      .insert({
        user_id: userId,
        idea_id: ideaId,
        content,
      })
      .select()
      .single()
  },

  // Generated Content
  async getGeneratedContent(userId: string, ideaId: string) {
    return supabase
      .from('generated_content')
      .select('*')
      .eq('user_id', userId)
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false })
  },

  async saveGeneratedContent(userId: string, ideaId: string, content: Partial<GeneratedContent>) {
    return supabase
      .from('generated_content')
      .insert({
        ...content,
        user_id: userId,
        idea_id: ideaId,
      })
      .select()
      .single()
  },

  // User Knowledge
  async getUserKnowledge(userId: string) {
    return supabase
      .from('user_knowledge')
      .select('*')
      .eq('user_id', userId)
      .single()
  },

  async saveUserKnowledge(userId: string, knowledge: Partial<UserKnowledge>) {
    const existing = await this.getUserKnowledge(userId)
    
    if (existing.data) {
      return supabase
        .from('user_knowledge')
        .update(knowledge)
        .eq('user_id', userId)
        .select()
        .single()
    } else {
      return supabase
        .from('user_knowledge')
        .insert({ ...knowledge, user_id: userId })
        .select()
        .single()
    }
  },
}


