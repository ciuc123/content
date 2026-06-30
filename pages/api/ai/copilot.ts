import { NextApiRequest, NextApiResponse } from 'next'

interface CopilotRequest {
  prompt: string
  temperature?: number
  max_tokens?: number
}

interface CopilotResponse {
  success: boolean
  content?: string
  error?: string
}

/**
 * GitHub Copilot API Integration
 *
 * This provider can:
 * 1. Send prompts to GitHub Copilot via OpenAI API (if GITHUB_TOKEN available)
 * 2. Fall back to manual mode (user copy-pastes)
 *
 * Usage:
 * POST /api/ai/copilot
 * Body: { prompt: "...", temperature?: 0.7, max_tokens?: 2000 }
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CopilotResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  try {
    const { prompt, temperature = 0.7, max_tokens = 2000 } = req.body as CopilotRequest

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'prompt is required' })
    }

    const copilotEnabled = process.env.COPILOT_ENABLED === 'true'
    const useOpenAI = process.env.COPILOT_USE_OPENAI === 'true'
    const openaiKey = process.env.OPENAI_API_KEY
    const githubToken = process.env.GITHUB_TOKEN

    // Option 1: Use OpenAI API (via GitHub Copilot backend)
    if (copilotEnabled && useOpenAI && openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: 'You are a content creation expert helping with blog posts, LinkedIn articles, and newsletters. Provide high-quality, engaging content.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature,
            max_tokens,
          }),
        })

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`)
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content

        if (!content) {
          throw new Error('No content generated from OpenAI')
        }

        return res.status(200).json({
          success: true,
          content,
        })
      } catch (error) {
        console.error('OpenAI API error:', error)
        // Fall back to manual mode
      }
    }

    // Option 2: Use GitHub Copilot CLI (if available)
    if (copilotEnabled && githubToken && !useOpenAI) {
      try {
        // This would require the GitHub Copilot CLI to be installed
        // For now, we'll return a hint to use manual mode
        return res.status(200).json({
          success: true,
          content: `[Copilot CLI Mode]\nTo use this feature, please copy this prompt and paste it into GitHub Copilot:\n\n${prompt}\n\nThen paste the response back into the UI.`,
        })
      } catch (error) {
        console.error('Copilot CLI error:', error)
      }
    }

    // Option 3: Manual mode (default fallback)
    return res.status(200).json({
      success: true,
      content: `[Manual Mode]\nPlease copy this prompt and paste it into GitHub Copilot:\n\n${prompt}\n\nThen paste the response back into the UI.`,
    })
  } catch (err: any) {
    console.error('Copilot API error:', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
}

