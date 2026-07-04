import { AIProvider } from './ai'

export class OpenAIProvider implements AIProvider {
  apiKey: string
  model: string

  constructor(apiKey?: string, model = 'gpt-4o-mini') {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''
    this.model = model
  }

  async generate(prompt: string, context?: string, options?: Record<string, any>) {
    if (!this.apiKey) throw new Error('OPENAI_API_KEY not set')

    const maxTokens = options?.maxTokens || 1500

    const body = {
      model: this.model,
      messages: [{ role: 'user', content: context ? `${prompt}\n\n${context}` : prompt }],
      max_tokens: maxTokens,
      temperature: 0.6
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    })

    const json = await res.json()
    if (!res.ok) {
      throw new Error(JSON.stringify(json))
    }

    const text = json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text ?? ''
    return text
  }
}

