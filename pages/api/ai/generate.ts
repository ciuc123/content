import type { NextApiRequest, NextApiResponse } from 'next'
import { withAIAuth } from '../../../lib/clerk'
import { getAIProvider } from '../../../lib/ai/providerFactory'

export default withAIAuth(async (req: NextApiRequest, res: NextApiResponse, userId: string, apiKey: string) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { prompt, context } = req.body
    if (!prompt) return res.status(400).json({ error: 'prompt is required' })
    // Pass the user's decrypted API key to the provider
    const provider = getAIProvider(apiKey)
    const text = await provider.generate(prompt, context)
    return res.status(200).json({ text })
  } catch (err: any) {
    return res.status(500).json({ error: String(err) })
  }
})

