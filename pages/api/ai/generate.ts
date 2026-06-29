import type { NextApiRequest, NextApiResponse } from 'next'
import { getAIProvider } from '../../../lib/ai/providerFactory'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { prompt, context } = req.body
    if (!prompt) return res.status(400).json({ error: 'prompt is required' })
    const provider = getAIProvider()
    const text = await provider.generate(prompt, context)
    return res.status(200).json({ text })
  } catch (err: any) {
    return res.status(500).json({ error: String(err) })
  }
}

