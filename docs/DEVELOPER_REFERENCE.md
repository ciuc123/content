# Developer Quick Reference: Supabase, Clerk & Copilot

Quick code examples for integrating Supabase, Clerk, and GitHub Copilot in your components.

---

## 🔐 CLERK - Authentication

### In Server Components (app/ directory)
```tsx
import { auth } from '@clerk/nextjs'

export default async function MyPage() {
  const { userId, sessionId } = auth()
  
  if (!userId) {
    return <p>Please sign in</p>
  }

  return <p>Welcome, {userId}</p>
}
```

### In Client Components
```tsx
'use client'
import { useAuth, useUser } from '@clerk/nextjs'

export default function MyComponent() {
  const { userId, isSignedIn } = useAuth()
  const { user } = useUser()

  if (!isSignedIn) {
    return <p>Please sign in</p>
  }

  return (
    <div>
      <p>Signed in as: {user?.primaryEmailAddress?.emailAddress}</p>
    </div>
  )
}
```

### In API Routes
```ts
import { auth } from '@clerk/nextjs'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = auth()
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Your protected endpoint code here
  return res.status(200).json({ message: 'Success', userId })
}
```

### Add Sign Out Button
```tsx
'use client'
import { UserButton } from '@clerk/nextjs'

export default function Header() {
  return (
    <div>
      <h1>My App</h1>
      <UserButton afterSignOutUrl="/" />
    </div>
  )
}
```

---

## 💾 SUPABASE - Database

### Query Ideas
```ts
import { supabaseHelpers } from '@/lib/supabase'

const userId = 'user-123'

// Get all ideas
const { data: ideas, error } = await supabaseHelpers.getIdeas(userId)

// Get specific idea
const { data: idea } = await supabase
  .from('ideas')
  .select('*')
  .eq('id', 'idea-123')
  .single()
```

### Create Idea
```ts
import { supabaseHelpers } from '@/lib/supabase'

const { data: newIdea, error } = await supabaseHelpers.createIdea(
  userId,
  {
    title: 'My Great Idea',
    why_it_matters: 'This idea is important because...',
    virality_score: 8,
    business_score: 7,
  }
)
```

### Save Research
```ts
import { supabaseHelpers } from '@/lib/supabase'

const { data: research, error } = await supabaseHelpers.saveResearch(
  userId,
  ideaId,
  'Research content here...'
)
```

### Get Generated Content
```ts
import { supabaseHelpers } from '@/lib/supabase'

const { data: content, error } = await supabaseHelpers.getGeneratedContent(
  userId,
  ideaId
)
```

### Save Generated Content
```ts
import { supabaseHelpers } from '@/lib/supabase'

const { data: generated, error } = await supabaseHelpers.saveGeneratedContent(
  userId,
  ideaId,
  {
    linkedin_post: '...',
    blog_post: '...',
    newsletter_post: '...',
    slug: 'my-idea-slug',
    seo_title: 'My Idea Title',
    seo_description: 'Description for SEO',
  }
)
```

### Update Idea Status
```ts
import { supabaseHelpers } from '@/lib/supabase'

const { data: updated, error } = await supabaseHelpers.updateIdea(
  ideaId,
  { status: 'published' }
)
```

### Real-Time Subscriptions
```ts
import { supabase } from '@/lib/supabase'

// Subscribe to changes
const subscription = supabase
  .from('ideas')
  .on('*', payload => {
    console.log('Idea changed:', payload)
  })
  .subscribe()

// Cleanup on unmount
return () => subscription.unsubscribe()
```

---

## 🤖 GITHUB COPILOT - AI Generation

### Manual Mode (Default)
```tsx
'use client'
import { useState } from 'react'

export default function GenerateComponent() {
  const handleGenerateClick = async () => {
    const prompt = 'Generate 5 blog post ideas about AI'
    
    // Copy prompt to clipboard
    await navigator.clipboard.writeText(prompt)
    
    // Redirect to GitHub Copilot
    window.open('https://github.com/copilot', '_blank')
  }

  return <button onClick={handleGenerateClick}>Generate with Copilot</button>
}
```

### Automatic Mode (API)
```tsx
'use client'
import { useState } from 'react'

export default function GenerateComponent() {
  const [generated, setGenerated] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerateAuto = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Generate 5 blog post ideas about AI',
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      const data = await response.json()
      setGenerated(data.content)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleGenerateAuto} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {generated && <p>{generated}</p>}
    </div>
  )
}
```

---

## 🔗 COMBINED: Clerk + Supabase Example

### Full Workflow in API Route
```ts
import { auth } from '@clerk/nextjs'
import { supabaseHelpers } from '@/lib/supabase'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Authenticate user with Clerk
  const { userId } = auth()
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // 2. Create idea in Supabase
  const { data: idea, error: createError } = await supabaseHelpers.createIdea(
    userId,
    {
      title: req.body.title,
      why_it_matters: req.body.why_it_matters,
    }
  )

  if (createError) {
    return res.status(500).json({ error: createError.message })
  }

  // 3. Save research to Supabase
  const { data: research, error: researchError } = await supabaseHelpers.saveResearch(
    userId,
    idea.id,
    'Research data here'
  )

  // 4. Return combined result
  return res.status(200).json({
    idea,
    research,
  })
}
```

---

## 🛠️ Common Patterns

### Protect a Page (Server Component)
```tsx
import { auth, redirect } from '@clerk/nextjs'

export default async function ProtectedPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return <p>This page is protected</p>
}
```

### Fetch User's Data (Client Component)
```tsx
'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

export default function UserDataComponent() {
  const { userId } = useAuth()
  const [ideas, setIdeas] = useState([])

  useEffect(() => {
    if (userId) {
      fetch('/api/ideas')
        .then(r => r.json())
        .then(d => setIdeas(d.data))
    }
  }, [userId])

  return (
    <ul>
      {ideas.map(idea => (
        <li key={idea.id}>{idea.title}</li>
      ))}
    </ul>
  )
}
```

### Handle Errors Gracefully
```ts
try {
  const { data, error } = await supabaseHelpers.getIdeas(userId)
  
  if (error) {
    console.error('Database error:', error.message)
    return res.status(500).json({ error: 'Failed to fetch ideas' })
  }

  return res.status(200).json({ success: true, data })
} catch (err) {
  console.error('Unexpected error:', err)
  return res.status(500).json({ error: 'Internal server error' })
}
```

---

## 📋 Testing

### Test API with cURL
```bash
# Create idea
curl -X POST http://localhost:3000/api/ideas \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Idea","why_it_matters":"Testing"}'

# Get ideas
curl http://localhost:3000/api/ideas

# Test Copilot
curl -X POST http://localhost:3000/api/ai/copilot \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Generate ideas"}'
```

### Test with TypeScript/Jest
```ts
describe('Ideas API', () => {
  it('should get ideas for authenticated user', async () => {
    const response = await fetch('/api/ideas')
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })
})
```

---

## 🔍 Environment Variables Check

Verify your `.env.local` has:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Copilot/OpenAI
OPENAI_API_KEY=sk-xxxxx
COPILOT_ENABLED=true
COPILOT_USE_OPENAI=true
```

Then restart: `npm run dev`

---

## 🐛 Debugging

### Enable Supabase Debug Logging
```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key, {
  auth: { persistSession: true },
  global: {
    headers: { 'X-Debug': 'true' },
    fetch: (url, options = {}) => {
      console.log('Supabase request:', url, options)
      return fetch(url, options)
    },
  },
})
```

### Check Clerk Status
```tsx
'use client'
import { useAuth } from '@clerk/nextjs'

export default function DebugComponent() {
  const auth = useAuth()
  console.log('Clerk auth state:', auth)
  return <pre>{JSON.stringify(auth, null, 2)}</pre>
}
```

---

## 📚 Useful Links

- [Supabase Helpers API](./lib/supabase.ts)
- [Clerk Auth Utilities](./lib/clerk.ts)
- [Copilot API Example](./pages/api/ai/copilot.ts)
- [Integration Setup Guide](./INTEGRATION_SETUP.md)

