import type { NextApiRequest, NextApiResponse } from 'next'
import { getAgentProvider } from '../../lib/ai/agentProvider'
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<AgentResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { action, topic, idea, research, context, count = 10, depth = 'medium' } = req.body as AgentRequest

    if (!action) {
      return res.status(400).json({ success: false, error: 'action is required' })
    }

    const agent = getAgentProvider()

    switch (action) {
      case 'generateIdeas': {
        if (!topic) {
          return res.status(400).json({ success: false, error: 'topic is required for generateIdeas' })
        }
        const ideas = await agent.generateIdeas(topic, count, context)
        return res.status(200).json({ success: true, data: ideas })
      }

      case 'generateResearch': {
        if (!idea) {
          return res.status(400).json({ success: false, error: 'idea is required for generateResearch' })
        }
        const researchContent = await agent.generateResearch(idea, depth, context)
        return res.status(200).json({ success: true, data: { research: researchContent } })
      }

      case 'generateContent': {
        if (!idea || !research) {
          return res.status(400).json({ success: false, error: 'idea and research are required for generateContent' })
        }
        const content = await agent.generateContent(idea, research, context)
        return res.status(200).json({ success: true, data: content })
      }

      case 'fullWorkflow': {
        if (!topic) {
          return res.status(400).json({ success: false, error: 'topic is required for fullWorkflow' })
        }

        // Step 1: Generate ideas
        const ideas = await agent.generateIdeas(topic, count, context)
        if (!ideas || ideas.length === 0) {
          return res.status(200).json({
            success: true,
            data: {
              step: 'generateIdeas',
              ideas: [],
              message: 'No ideas generated. Please try again with a different topic.'
            }
          })
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

        return res.status(200).json({
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
      }

      default:
        return res.status(400).json({ success: false, error: `Unknown action: ${action}` })
    }
  } catch (err: any) {
    console.error('Agent error:', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
}

