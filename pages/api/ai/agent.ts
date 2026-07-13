import type { NextApiRequest, NextApiResponse } from 'next'
import { withAIAuth } from '../../../lib/clerk'
import { getAgentProvider } from '../../../lib/ai/agentProvider'
import fs from 'fs'
import path from 'path'

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

    // Create agent with user's decrypted API key
    const agent = getAgentProvider(apiKey)

    switch (action) {
      case 'generateIdeas': {
        if (!topic) {
          res.status(400).json({ success: false, error: 'topic is required for generateIdeas' })
          return
        }
        const ideas = await agent.generateIdeas(topic, count, context)
        res.status(200).json({ success: true, data: ideas })
        return
      }

      case 'generateResearch': {
        if (!idea) {
          res.status(400).json({ success: false, error: 'idea is required for generateResearch' })
          return
        }
        const researchContent = await agent.generateResearch(idea, depth, context)
        res.status(200).json({ success: true, data: { research: researchContent } })
        return
      }

      case 'generateContent': {
        if (!idea || !research) {
          res.status(400).json({ success: false, error: 'idea and research are required for generateContent' })
          return
        }
        const content = await agent.generateContent(idea, research, context)
        res.status(200).json({ success: true, data: content })
        return
      }

      case 'fullWorkflow': {
        if (!topic) {
          res.status(400).json({ success: false, error: 'topic is required for fullWorkflow' })
          return
        }

        // Step 1: Generate ideas
        const ideas = await agent.generateIdeas(topic, count, context)
        if (!ideas || ideas.length === 0) {
        res.status(200).json({
            success: true,
            data: {
              step: 'generateIdeas',
              ideas: [],
              message: 'No ideas generated. Please try again with a different topic.'
            }
          })
        return
        }

        // Step 2: Use first idea
        const selectedIdea = ideas[0]

        // Step 3: Generate research
        const researchContent = await agent.generateResearch(selectedIdea, depth, context)

        // Step 4: Generate all content formats
        const content = await agent.generateContent(selectedIdea, researchContent, context)

        // Step 5: Optionally save to files
        const dataDir = path.join(process.cwd(), 'data')
        fs.mkdirSync(dataDir, { recursive: true })

        // Save workflow result
        const workflowData = {
          timestamp: new Date().toISOString(),
          topic,
          selectedIdea,
          research: researchContent,
          content,
          allIdeas: ideas
        }

        const workflowFile = path.join(dataDir, `workflow-${Date.now()}.json`)
        fs.writeFileSync(workflowFile, JSON.stringify(workflowData, null, 2))

        res.status(200).json({
          success: true,
          data: {
            step: 'fullWorkflow',
            topic,
            ideaCount: ideas.length,
            selectedIdea,
            research: researchContent.substring(0, 200) + '...',
            content,
            savedTo: workflowFile
          }
        })
        return
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

