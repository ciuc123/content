import { supabaseHelpers } from './supabase'

// Temporary user ID for unauthenticated users (stored in localStorage)
const TEMP_USER_ID_KEY = 'ideas_temp_user_id'

function getTempUserId(): string {
  if (typeof window === 'undefined') return 'server'

  let tempId = localStorage.getItem(TEMP_USER_ID_KEY)
  if (!tempId) {
    tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem(TEMP_USER_ID_KEY, tempId)
  }
  return tempId
}

export const hybridStorage = {
  // Ideas
  async getIdeas(userId: string | null) {
    if (userId) {
      // Use Supabase for authenticated users
      const { data, error } = await supabaseHelpers.getIdeas(userId)
      return { data: data || [], error, isLocal: false }
    } else {
      // Use localStorage for unauthenticated users
      const tempId = getTempUserId()
      const stored = localStorage.getItem(`ideas_${tempId}`)
      const data = stored ? JSON.parse(stored) : []
      return { data, error: null, isLocal: true }
    }
  },

  async createIdea(
    userId: string | null,
    idea: { title: string; why_it_matters?: string; virality_score?: number; business_score?: number }
  ) {
    const newIdea = {
      id: 'idea_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      user_id: userId || getTempUserId(),
      ...idea,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (userId) {
      // Save to Supabase
      const { data, error } = await supabaseHelpers.createIdea(userId, idea)
      return { data, error, isLocal: false }
    } else {
      // Save to localStorage
      const tempId = getTempUserId()
      const stored = localStorage.getItem(`ideas_${tempId}`)
      const ideas = stored ? JSON.parse(stored) : []
      ideas.push(newIdea)
      localStorage.setItem(`ideas_${tempId}`, JSON.stringify(ideas))
      return { data: newIdea, error: null, isLocal: true }
    }
  },

  async updateIdea(userId: string | null, ideaId: string, updates: any) {
    if (userId) {
      // Update in Supabase
      const { data, error } = await supabaseHelpers.updateIdea(ideaId, updates)
      return { data, error, isLocal: false }
    } else {
      // Update in localStorage
      const tempId = getTempUserId()
      const stored = localStorage.getItem(`ideas_${tempId}`)
      const ideas = stored ? JSON.parse(stored) : []
      const idx = ideas.findIndex((i: any) => i.id === ideaId)
      if (idx >= 0) {
        ideas[idx] = { ...ideas[idx], ...updates, updated_at: new Date().toISOString() }
        localStorage.setItem(`ideas_${tempId}`, JSON.stringify(ideas))
        return { data: ideas[idx], error: null, isLocal: true }
      }
      return { data: null, error: new Error('Idea not found'), isLocal: true }
    }
  },

  // Research
  async getResearch(userId: string | null, ideaId: string) {
    if (userId) {
      const { data, error } = await supabaseHelpers.getResearch(userId, ideaId)
      return { data: data || [], error, isLocal: false }
    } else {
      const tempId = getTempUserId()
      const stored = localStorage.getItem(`research_${tempId}`)
      const data = stored ? JSON.parse(stored).filter((r: any) => r.idea_id === ideaId) : []
      return { data, error: null, isLocal: true }
    }
  },

  async saveResearch(userId: string | null, ideaId: string, content: string) {
    const research = {
      id: 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      user_id: userId || getTempUserId(),
      idea_id: ideaId,
      content,
      created_at: new Date().toISOString(),
    }

    if (userId) {
      const { data, error } = await supabaseHelpers.saveResearch(userId, ideaId, content)
      return { data, error, isLocal: false }
    } else {
      const tempId = getTempUserId()
      const stored = localStorage.getItem(`research_${tempId}`)
      const research_list = stored ? JSON.parse(stored) : []
      research_list.push(research)
      localStorage.setItem(`research_${tempId}`, JSON.stringify(research_list))
      return { data: research, error: null, isLocal: true }
    }
  },

  // Generated Content
  async getGeneratedContent(userId: string | null, ideaId: string) {
    if (userId) {
      const { data, error } = await supabaseHelpers.getGeneratedContent(userId, ideaId)
      return { data: data || [], error, isLocal: false }
    } else {
      const tempId = getTempUserId()
      const stored = localStorage.getItem(`generated_${tempId}`)
      const data = stored ? JSON.parse(stored).filter((c: any) => c.idea_id === ideaId) : []
      return { data, error: null, isLocal: true }
    }
  },

  async saveGeneratedContent(
    userId: string | null,
    ideaId: string,
    content: any
  ) {
    const generated = {
      id: 'gen_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      user_id: userId || getTempUserId(),
      idea_id: ideaId,
      ...content,
      created_at: new Date().toISOString(),
    }

    if (userId) {
      const { data, error } = await supabaseHelpers.saveGeneratedContent(userId, ideaId, content)
      return { data, error, isLocal: false }
    } else {
      const tempId = getTempUserId()
      const stored = localStorage.getItem(`generated_${tempId}`)
      const content_list = stored ? JSON.parse(stored) : []
      content_list.push(generated)
      localStorage.setItem(`generated_${tempId}`, JSON.stringify(content_list))
      return { data: generated, error: null, isLocal: true }
    }
  },
}

