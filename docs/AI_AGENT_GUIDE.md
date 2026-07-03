# AI Agent Guide

The **AI Agent** is an automated orchestration layer that can handle the entire content generation workflow without manual intervention.

## Overview

Instead of manually going through each step (Generate Ideas → Select → Research → Generate Content → Publish), you can use the AI Agent to:

1. **Automatically generate** multiple content ideas
2. **Automatically research** selected ideas
3. **Automatically create** LinkedIn posts, blog articles, and newsletters
4. **Optionally publish** to GitHub automatically

## How It Works

### Architecture

```
AI Agent
  ├── generateIdeas(topic, count)
  │   └── Uses AI provider to create 10 ideas with virality/business scores
  ├── generateResearch(idea, depth)
  │   └── Generates detailed research in 3 depth levels
  ├── generateContent(idea, research)
  │   ├── generateLinkedInPost() - 150-250 words, hashtags, CTA
  │   ├── generateBlogPost() - 800-1200 words, structured
  │   └── generateNewsletterPost() - 300-500 words, conversational
  └── fullWorkflow(topic) - Orchestrates all steps end-to-end
```

### AI Providers

The agent works with any AI provider configured:

- **manual** (default): For quick testing with `MANUAL_AI_RESPONSE` env var
- **openai**: Uses OpenAI API (requires `OPENAI_API_KEY`)
- **github**: Uses GitHub Copilot CLI (via `@githubnext/copilot-cli`)

Set your provider in `.env.local`:
```bash
AI_PROVIDER=openai  # or 'github' or 'manual'
OPENAI_API_KEY=sk_...
```

## API Endpoint: `/api/ai/agent`

All requests are POST requests with an `action` parameter.

### Request Format

```json
{
  "action": "generateIdeas|generateResearch|generateContent|fullWorkflow",
  "topic": "DevOps and Kubernetes",
  "count": 10,
  "depth": "medium",
  "context": "Optional knowledge context",
  "idea": { "title": "...", "why_it_matters": "..." },
  "research": "Detailed research text..."
}
```

## Usage Examples

### 1. Generate Ideas

```bash
curl -X POST http://localhost:3000/api/ai/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generateIdeas",
    "topic": "Machine Learning in Production",
    "count": 5
  }'
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "title": "ML Model Monitoring Best Practices",
      "why_it_matters": "Production models degrade over time...",
      "virality_score": 8,
      "business_score": 9
    },
    ...
  ]
}
```

### 2. Generate Research

```bash
curl -X POST http://localhost:3000/api/ai/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generateResearch",
    "idea": {
      "title": "ML Model Monitoring",
      "why_it_matters": "Production models degrade..."
    },
    "depth": "medium"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "research": "Model monitoring is critical because..."
  }
}
```

### 3. Generate Content

```bash
curl -X POST http://localhost:3000/api/ai/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generateContent",
    "idea": {
      "title": "ML Model Monitoring",
      "why_it_matters": "..."
    },
    "research": "Detailed research about monitoring..."
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "linkedin_post": "Check out my post about ML monitoring...",
    "blog_post": "In this comprehensive guide...",
    "newsletter_post": "Here's what you need to know..."
  }
}
```

### 4. Full Workflow (End-to-End)

This is the most powerful - does everything in one request:

```bash
curl -X POST http://localhost:3000/api/ai/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "fullWorkflow",
    "topic": "DevOps Automation",
    "count": 10,
    "depth": "medium"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "step": "fullWorkflow",
    "topic": "DevOps Automation",
    "ideaCount": 10,
    "selectedIdea": {
      "title": "GitHub Actions Best Practices",
      "why_it_matters": "...",
      "virality_score": 8,
      "business_score": 8
    },
    "research": "GitHub Actions has become essential...",
    "content": {
      "linkedin_post": "LinkedIn content here...",
      "blog_post": "Comprehensive blog post...",
      "newsletter_post": "Newsletter content..."
    },
    "savedTo": "data/workflow-1719686400000.json"
  }
}
```

## Using the Agent in Your App

### Method 1: Direct API Calls

```typescript
// Get 10 ideas
const ideas = await fetch('/api/ai/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'generateIdeas',
    topic: 'Your topic here'
  })
}).then(r => r.json())

// Run full workflow
const result = await fetch('/api/ai/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'fullWorkflow',
    topic: 'Your topic',
    depth: 'medium'
  })
}).then(r => r.json())
```

### Method 2: Use AgentProvider in Server Code

```typescript
import { getAgentProvider } from '@/lib/ai/agentProvider'

const agent = getAgentProvider()

// Generate ideas
const ideas = await agent.generateIdeas('DevOps', 10, context)

// Generate research
const research = await agent.generateResearch(selectedIdea, 'medium', context)

// Generate all content
const { linkedin_post, blog_post, newsletter_post } = 
  await agent.generateContent(selectedIdea, research, context)
```

## Research Depth Levels

The `depth` parameter controls research detail:

- **brief**: 2-3 key points in 100-150 words
- **medium**: 4-5 insights with examples in 300-400 words (default)
- **deep**: Comprehensive research with citations in 600-800 words

## Content Output Specifications

### LinkedIn Post
- 150-250 words
- Conversational, professional tone
- 2-3 relevant hashtags
- Call-to-action
- Starts with a hook

### Blog Post
- 800-1200 words
- Structure: Introduction, 3-4 sections, conclusion
- Practical examples
- Subheadings for each section
- Call-to-action in conclusion

### Newsletter
- 300-500 words
- Friendly, approachable tone
- Starts with personal hook or story
- 1-2 key takeaways
- Ends with reader engagement question

## Configuration

### Environment Variables

```bash
# AI Provider
AI_PROVIDER=openai

# For OpenAI
OPENAI_API_KEY=sk_...

# For GitHub Copilot CLI
COPILOT_CLI_BIN=/usr/local/bin/copilot

# For Manual Testing
MANUAL_AI_RESPONSE='Generated response here...'
```

### Context Injection

Pass domain-specific knowledge to personalize content:

```bash
curl -X POST http://localhost:3000/api/ai/agent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generateIdeas",
    "topic": "Cloud Architecture",
    "context": "Focus on cost optimization and serverless patterns. Target audience: startups."
  }'
```

## Error Handling

If an error occurs:

```json
{
  "success": false,
  "error": "OPENAI_API_KEY not set"
}
```

Common errors:
- Missing AI provider configuration
- Invalid idea/research format
- Rate limits from AI service
- Network errors

## Testing

The AI Agent has comprehensive tests:

```bash
npm test -- __tests__/agent.test.ts
```

Tests cover:
- ✅ Idea generation with validation
- ✅ Research generation with depth levels
- ✅ Content generation (3 formats)
- ✅ Complete workflow integration
- ✅ Error handling
- ✅ Content quality

## Performance

- **Generate Ideas**: ~10-30 seconds (depends on AI provider)
- **Generate Research**: ~5-15 seconds
- **Generate Content**: ~15-40 seconds (3 parallel requests)
- **Full Workflow**: ~30-80 seconds total

## Next Steps

1. **Set AI_PROVIDER=openai** and add your OpenAI key for production quality
2. **Integrate agent calls** into your UI for one-click content generation
3. **Add auto-publish** to GitHub after content generation
4. **Create feedback loop** to improve idea selection based on performance
5. **Schedule automatic runs** to generate content on a schedule

## Troubleshooting

### Agent returns no ideas
- Check AI provider is correctly configured
- Verify API keys are valid
- Try with a simpler, more specific topic

### Content quality is poor
- Use `depth: "deep"` for better research
- Provide better context information
- Try a different AI provider (OpenAI usually better quality)

### Workflow is slow
- Switch to a faster AI provider
- Reduce `count` for faster idea generation
- Use `depth: "brief"` for faster research

## Architecture Decisions

- **Parallel content generation**: LinkedIn, blog, and newsletter are generated in parallel for speed
- **Idea selection**: Currently uses first (highest quality) idea - can be customized
- **Workflow persistence**: Results saved with timestamp for audit trail
- **Modular design**: Can call individual methods or use fullWorkflow orchestration

