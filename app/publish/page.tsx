"use client"

import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

export default function PublishPage() {
  const { isSignedIn } = useAuth()
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null)
  const [research, setResearch] = useState<string>('')
  const [generatedContent, setGeneratedContent] = useState<any | null>(null)

  // Blog section state
  const [blogContent, setBlogContent] = useState('')
  const [blogSlug, setBlogSlug] = useState('')
  const [blogLoading, setBlogLoading] = useState(false)
  const [blogMessage, setBlogMessage] = useState<string | null>(null)

  // LinkedIn section state
  const [linkedinContent, setLinkedinContent] = useState('')
  const [linkedinLoading, setLinkedinLoading] = useState(false)
  const [linkedinMessage, setLinkedinMessage] = useState<string | null>(null)

  // Newsletter section state
  const [newsletterContent, setNewsletterContent] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null)

  useEffect(() => {
    // Load selected idea from sessionStorage
    const stored = sessionStorage.getItem('selected_idea')
    if (stored) {
      try {
        const idea = JSON.parse(stored)
        setSelectedIdea(idea)
        setBlogSlug(idea.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '')
      } catch (e) {
        console.error('Failed to parse stored idea:', e)
      }
    }
  }, [])

  useEffect(() => {
    // Load research and generated content if we have an idea
    if (selectedIdea?.id) {
      fetch('/api/research')
        .then((r) => r.json())
        .then((d) => {
          const entry = (d.research || []).find((r: any) => r.idea_id === selectedIdea.id)
          if (entry) setResearch(entry.content || '')
        })
        .catch(() => {})

      fetch('/api/generated')
        .then((r) => r.json())
        .then((d) => {
          const entry = (d.generated || []).find((g: any) => g.idea_id === selectedIdea.id)
          if (entry) {
            setGeneratedContent(entry)
            setBlogContent(entry.blog_post || '')
            setLinkedinContent(entry.linkedin_post || '')
            setNewsletterContent(entry.newsletter_post || '')
          }
        })
        .catch(() => {})
    }
  }, [selectedIdea?.id])

  async function generateViaAI(medium: 'blog' | 'linkedin' | 'newsletter') {
    if (!isSignedIn) {
      alert('Please sign in to use AI features')
      return
    }

    const mediumLabels = {
      blog: 'Blog Post',
      linkedin: 'LinkedIn Post',
      newsletter: 'Newsletter'
    }

    const prompts = {
      blog: `You are a professional content writer. Write ONLY a blog post. No explanations, no metadata, no introduction text. Just the post content.

Title: ${selectedIdea.title}
Why it matters: ${selectedIdea.why_it_matters}
Research: ${research}

Requirements: 1200-2000 words, Markdown format, SEO-friendly, multiple headings, practical examples, actionable takeaways, written for technical decision makers.

Start writing the blog post now:`,
      linkedin: `You are a professional content writer. Write ONLY a LinkedIn post. No explanations, no metadata, no introduction text. Just the post content.

Title: ${selectedIdea.title}
Why it matters: ${selectedIdea.why_it_matters}
Research: ${research}

Requirements: 150-300 words, professional tone, engaging, strong first sentence, experience-driven, ends with discussion question.

Start writing the LinkedIn post now:`,
      newsletter: `You are a professional content writer. Write ONLY a newsletter version. No explanations, no metadata, no introduction text. Just the post content.

Title: ${selectedIdea.title}
Why it matters: ${selectedIdea.why_it_matters}
Research: ${research}

Requirements: 300-500 words, email-friendly, more personal than blog, conversational tone, actionable insights.

Start writing the newsletter now:`
    }

    const setters = { blog: setBlogContent, linkedin: setLinkedinContent, newsletter: setNewsletterContent }
    const setLoading = {
      blog: setBlogLoading,
      linkedin: setLinkedinLoading,
      newsletter: setNewsletterLoading
    }
    const setMessage = {
      blog: setBlogMessage,
      linkedin: setLinkedinMessage,
      newsletter: setNewsletterMessage
    }

    setLoading[medium](true)
    setMessage[medium](null)

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompts[medium as keyof typeof prompts] })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'AI generate failed')

      let text = json.text || ''
      // Extract clean content by removing common AI preambles
      // Remove "Done!", "Here's", "I've", etc. prefixes
      text = text.replace(/^(Done!|Complete!|Created!|Here's|I've).{0,200}?\n\n/i, '')
      // Remove common ending markers
      text = text.trim()

      const setter = setters[medium as keyof typeof setters]
      const msgSetter = setMessage[medium as keyof typeof setMessage]
      const label = mediumLabels[medium as keyof typeof mediumLabels]

      setter(text)
      msgSetter(`✓ ${label} generated by AI`)
    } catch (err: any) {
      const msgSetter = setMessage[medium as keyof typeof setMessage]
      msgSetter(`Error: ${String(err)}`)
    }

    const loader = setLoading[medium as keyof typeof setLoading]
    loader(false)
  }

  async function handlePublish(medium: 'blog' | 'linkedin' | 'newsletter') {
    if (!selectedIdea?.id) {
      alert('No idea selected')
      return
    }

    let content = ''
    if (medium === 'blog') {
      content = blogContent
    } else if (medium === 'linkedin') {
      content = linkedinContent
    } else {
      content = newsletterContent
    }

    if (!content.trim()) {
      alert(`Please provide ${medium} content`)
      return
    }

    const setLoading = {
      blog: setBlogLoading,
      linkedin: setLinkedinLoading,
      newsletter: setNewsletterLoading
    }
    const setMessage = {
      blog: setBlogMessage,
      linkedin: setLinkedinMessage,
      newsletter: setNewsletterMessage
    }

    const loader = setLoading[medium as keyof typeof setLoading]
    const msgSetter = setMessage[medium as keyof typeof setMessage]

    loader(true)
    msgSetter(null)

    try {
      const body: any = {
        medium,
        ideaId: selectedIdea.id,
        content
      }

      if (medium === 'blog') {
        body.title = selectedIdea.title
        body.slug = blogSlug
        body.description = selectedIdea.why_it_matters
      }

      const res = await fetch('/api/publish-medium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Publish failed')

      const action = medium === 'blog' ? 'Published to GitHub' : 'Saved'
      msgSetter(`✓ ${action}!`)
    } catch (err: any) {
      msgSetter(`Error: ${String(err)}`)
    }

    loader(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">📤 Prepare Content for Publishing</h1>
      <p className="mt-2 text-sm text-gray-600">Choose your target medium, prepare the content (via AI or manually), then publish.</p>

      {selectedIdea && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h2 className="font-bold">📋 Idea Summary</h2>
          <p className="mt-2 text-sm"><strong>Title:</strong> {selectedIdea.title}</p>
          <p className="mt-1 text-sm"><strong>Why it matters:</strong> {selectedIdea.why_it_matters}</p>

          {research && (
            <>
              <p className="mt-3 text-sm font-medium">📚 Research Preview:</p>
              <div className="mt-1 p-2 bg-white border rounded text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                {research.slice(0, 300)}...
              </div>
            </>
          )}
        </div>
      )}

      {/* Blog Section */}
      <div className="mt-8 p-6 bg-white border-2 border-blue-300 rounded-lg">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>📝</span> Section 1: Prepare Blog Post
        </h2>
        <p className="mt-2 text-sm text-gray-600">1200-2000 words for your technical blog. Will create a GitHub PR.</p>

        <div className="mt-4">
          <label className="block text-sm font-medium">Blog Slug (kebab-case)</label>
          <input
            value={blogSlug}
            onChange={(e) => setBlogSlug(e.target.value)}
            className="w-full mt-1 border p-2 rounded"
            placeholder="my-great-idea"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium">Blog Content (Markdown)</label>
          <textarea
            value={blogContent}
            onChange={(e) => setBlogContent(e.target.value)}
            rows={10}
            className="w-full mt-1 border p-2 rounded font-mono text-sm"
            placeholder="Your blog post content here..."
          />
        </div>

        <div className="mt-4 flex gap-2 flex-wrap">
          {isSignedIn ? (
            <button
              onClick={() => generateViaAI('blog')}
              disabled={blogLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {blogLoading ? '⏳ Generating...' : '🤖 Prepare via AI'}
            </button>
          ) : (
            <div className="text-sm text-blue-600">🔒 Sign in to use AI features</div>
          )}
          <button
            onClick={() => handlePublish('blog')}
            disabled={blogLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {blogLoading ? '⏳ Publishing...' : '🚀 Publish to GitHub'}
          </button>
        </div>

        {blogMessage && (
          <div className={`mt-3 text-sm p-2 rounded ${blogMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {blogMessage}
          </div>
        )}
      </div>

      {/* LinkedIn Section */}
      <div className="mt-8 p-6 bg-white border-2 border-blue-300 rounded-lg">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>💼</span> Section 2: Prepare LinkedIn Post
        </h2>
        <p className="mt-2 text-sm text-gray-600">150-300 words for professional engagement. Saves to your content library.</p>

        <div className="mt-4">
          <label className="block text-sm font-medium">LinkedIn Content</label>
          <textarea
            value={linkedinContent}
            onChange={(e) => setLinkedinContent(e.target.value)}
            rows={6}
            className="w-full mt-1 border p-2 rounded font-mono text-sm"
            placeholder="Your LinkedIn post here..."
          />
        </div>

        <div className="mt-4 flex gap-2 flex-wrap">
          {isSignedIn ? (
            <button
              onClick={() => generateViaAI('linkedin')}
              disabled={linkedinLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {linkedinLoading ? '⏳ Generating...' : '🤖 Prepare via AI'}
            </button>
          ) : (
            <div className="text-sm text-blue-600">🔒 Sign in to use AI features</div>
          )}
          <button
            onClick={() => handlePublish('linkedin')}
            disabled={linkedinLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {linkedinLoading ? '⏳ Saving...' : '💾 Save'}
          </button>
        </div>

        {linkedinMessage && (
          <div className={`mt-3 text-sm p-2 rounded ${linkedinMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {linkedinMessage}
          </div>
        )}
      </div>

      {/* Newsletter Section */}
      <div className="mt-8 p-6 bg-white border-2 border-blue-300 rounded-lg">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>📧</span> Section 3: Prepare Newsletter
        </h2>
        <p className="mt-2 text-sm text-gray-600">300-500 words for email subscribers. Saves to your content library.</p>

        <div className="mt-4">
          <label className="block text-sm font-medium">Newsletter Content</label>
          <textarea
            value={newsletterContent}
            onChange={(e) => setNewsletterContent(e.target.value)}
            rows={6}
            className="w-full mt-1 border p-2 rounded font-mono text-sm"
            placeholder="Your newsletter here..."
          />
        </div>

        <div className="mt-4 flex gap-2 flex-wrap">
          {isSignedIn ? (
            <button
              onClick={() => generateViaAI('newsletter')}
              disabled={newsletterLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {newsletterLoading ? '⏳ Generating...' : '🤖 Prepare via AI'}
            </button>
          ) : (
            <div className="text-sm text-blue-600">🔒 Sign in to use AI features</div>
          )}
          <button
            onClick={() => handlePublish('newsletter')}
            disabled={newsletterLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {newsletterLoading ? '⏳ Saving...' : '💾 Save'}
          </button>
        </div>

        {newsletterMessage && (
          <div className={`mt-3 text-sm p-2 rounded ${newsletterMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {newsletterMessage}
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-2">
        <a href="/ideas/generate" className="px-4 py-2 border rounded hover:bg-gray-50">← Back to Generate</a>
        <a href="/ideas" className="px-4 py-2 border rounded hover:bg-gray-50">← Back to Ideas</a>
      </div>
    </div>
  )
}
