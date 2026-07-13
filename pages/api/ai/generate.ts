import type { NextApiRequest, NextApiResponse } from 'next'
import { withAIAuth } from '../../../lib/clerk'
import { getAIProvider } from '../../../lib/ai/providerFactory'

export default withAIAuth(async (req: NextApiRequest, res: NextApiResponse, userId: string, apiKey: string) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end('Method Not Allowed')
    return
  }

  try {
    const { prompt, context, options } = req.body
    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' })
      return
    }
    // Pass the user's decrypted API key to the provider
    const provider = getAIProvider(apiKey)
    const text = await provider.generate(prompt, context, options)
    res.status(200).json({ text })
    return
  } catch (err: any) {
    res.status(500).json({ error: String(err) })
    return
  }
})

