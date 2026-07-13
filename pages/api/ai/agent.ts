import type { NextApiRequest, NextApiResponse } from 'next'
import { withAIAuth } from '../../../lib/clerk'
import { getAgentProvider } from '../../../lib/ai/agentProvider'
import { supabaseServer } from '../../../lib/supabase'

interface AgentRequest {
  action: 'generateIdeas' | 'generateResearch' | 'generateContent' | 'fullWorkflow'
  topic?: string
  idea?: any
  research?: string
  context?: string
  count?: number
  depth?: string
}

interface AgentResponse {
  success: boolean
  data?: any
  error?: string
}

const handler = async (req: NextApiRequest, res: NextApiResponse<AgentResponse>, userId: string, apiKey: string) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end('Method Not Allowed')
    return
  }

  try {
    const { action, topic, idea, research, context, count = 10, depth = 'medium' } = req.body as AgentRequest

    if (!action) {
      res.status(400).json({ success: false, error: 'action is required' })
      return
    }

    const agent = getAgentProvider(apiKey)

    switch (action) {
      case 'generateIdeas': {
        if (!topic) return res.status(400).json({ success: false, error: 'topic is required for generateIdeas' })
        const ideas = await agent.generateIdeas(topic, count, context)
        res.status(200).json({ success: true, data: ideas })
        return
      }

      case 'generateResearch': {
        if (!idea) return res.status(400).json({ success: false, error: 'idea is required for generateResearch' })
        const researchContent = await agent.generateResearch(idea, depth, context)
        res.status(200).json({ success: true, data: { research: researchContent } })
        return
      }

      case 'generateContent': {
        if (!idea || !research) return res.status(400).json({ success: false, error: 'idea and research are required for generateContent' })
        const content = await agent.generateContent(idea, research, context)
        res.status(200).json({ success: true, data: content })
        return
      }

      case 'fullWorkflow': {
        if (!topic) return res.status(400).json({ success: false, error: 'topic is required for fullWorkflow' })

        // Step 1: Generate ideas
        const ideas = await agent.generateIdeas(topic, count, context)
        if (!ideas || ideas.length === 0) {
          res.status(200).json({
            success: true,
            data: { step: 'generateIdeas', ideas: [], message: 'No ideas generated. Please try again.' },
          })
          return
        }

        // Step 2: Use first idea
        const selectedIdea = ideas[0]

        // Step 3: Generate research
        const researchContent = await agent.generateResearch(selectedIdea, depth, context)

        // Step 4: Generate all content formats
        const content = await agent.generateContent(selectedIdea, researchContent, context)

        // Step 5: Persist to Supabase (workflows table)
        try {
          const supabase = supabaseServer()
          const workflowEntry = {
            user_id: userId,
            topic,
            selected_idea: selectedIdea,
            research: researchContent,
            content,
            all_ideas: ideas,
            created_at: new Date().toISOString(),
          }
          const { data: inserted, error } = await supabase.from('workflows').insert([workflowEntry]).select().single()
          if (error) throw new Error(error.message)

          res.status(200).json({
            success: true,
            data: {
              step: 'fullWorkflow',
              topic,
              ideaCount: ideas.length,
              selectedIdea,
              research: (researchContent || '').substring(0, 200) + '...',
              content,
              savedTo: inserted?.id ?? inserted?.created_at ?? null,
            },
          })
          return
        } catch (e: any) {
          // If DB write fails, still return the generated content but surface error field
          res.status(200).json({
            success: true,
            data: {
              step: 'fullWorkflow',
              topic,
              ideaCount: ideas.length,
              selectedIdea,
              research: (researchContent || '').substring(0, 200) + '...',
              content,
            },
            error: String(e),
          })
          return
        }
      }

      default:
        res.status(400).json({ success: false, error: `Unknown action: ${action}` })
        return
    }
  } catch (err: any) {
    console.error('Agent error:', err)
    res.status(500).json({ success: false, error: String(err) })
    return
  }
}

export default withAIAuth(handler)

