# Using Copilot to Generate Ideas Automatically

This guide explains how to use the automated idea generation feature with GitHub Copilot CLI.

## Overview

The `/ideas` page now has a **Generate Ideas with AI** button that automatically calls GitHub Copilot CLI to generate content ideas based on a topic you provide.

## Prerequisites

1. **Docker Setup**: Ensure Docker Compose is properly configured
   - The `copilot_boot` service will automatically download the Copilot CLI binary
   - It will be available at `/usr/local/bin/copilot` inside the container

2. **Environment Configuration**: The `.env.local` should have:
   ```
   AI_PROVIDER=github
   COPILOT_CLI_BIN=copilot
   ```

3. **GitHub Authentication**: You need to be authenticated with GitHub to use Copilot CLI
   - First time running: `copilot auth` (in the container)
   - Or: Set up GitHub token for CLI authentication

## How to Use

### Step 1: Start the Application

```bash
docker compose up
```

This will:
- Start the database
- Download the Copilot CLI binary (via `copilot_boot` service)
- Start the web server on http://localhost:3000

### Step 2: Navigate to Ideas Page

1. Go to http://localhost:3000
2. Click on "Ideas" or navigate to `/ideas`

### Step 3: Generate Ideas

1. In the **🤖 Generate Ideas with AI** section:
   - Enter a topic (e.g., "DevOps best practices", "AI in content creation")
   - Set the number of ideas (default: 10, max: 50)
   - Click **✨ Generate Ideas**

2. Wait for the generation to complete:
   - Loading state shows "⏳ Generating..."
   - On success: Ideas appear in the textarea below
   - On error: Message explains the issue

### Step 4: Review and Import

1. The generated ideas JSON appears in the **Paste JSON Array of Ideas** textarea
2. Review the ideas format:
   ```json
   [
     {
       "title": "Idea title",
       "why_it_matters": "Why this matters",
       "virality_score": 8,
       "business_score": 7
     },
     ...
   ]
   ```
3. Click **Import Ideas** to save them
   - If signed in: Saves to Supabase cloud
   - If not signed in: Saves to browser localStorage

### Step 5: Proceed with Workflow

1. Click **Take Further** on an idea to select it
2. Navigate through:
   - `/ideas/research` - Research the idea
   - `/ideas/generate` - Generate content (blog, LinkedIn, newsletter)
   - `/publish` - Publish to GitHub

## Architecture

```
User Input (Topic) → /ideas page form
                   ↓
            [Generate Ideas button]
                   ↓
         POST /api/ai/agent
    {action: 'generateIdeas', topic, count}
                   ↓
       AgentProvider.generateIdeas()
                   ↓
        GitHubModelsProvider.generate()
                   ↓
         executes: copilot "prompt"
                   ↓
        Returns JSON array of ideas
                   ↓
      Populated in textarea for review
                   ↓
        User clicks "Import Ideas"
                   ↓
    Saved to Supabase or localStorage
```

## Troubleshooting

### Error: "Copilot CLI invocation failed"

**Cause**: Copilot binary not found or not authenticated

**Solutions**:
1. **In Docker container**:
   ```bash
   docker compose exec web which copilot
   # Check if it exists and is executable
   ```

2. **Authenticate Copilot**:
   ```bash
   docker compose exec web copilot auth login
   ```

3. **Fallback to manual mode**:
   - Change `.env.local` to: `AI_PROVIDER=manual`
   - Use the "Manual Alternative" section to paste ideas manually

### Error: "Invalid response format from AI"

**Cause**: Copilot returned non-JSON or malformed JSON

**Solution**:
- Try a different topic
- Check that the topic is clear and specific
- Use the manual alternative method

### Network/Timeout Errors

**Cause**: Copilot CLI might be slow or blocked

**Solution**:
- Increase Docker resource limits
- Try again with a simpler topic
- Check internet connection

## Advanced Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `github` | Set to `manual` to disable auto-generation |
| `COPILOT_CLI_BIN` | `copilot` | Path or command to Copilot CLI |
| `COPILOT_ENABLED` | `true` | Enable/disable Copilot features |

### Customizing Idea Format

Edit `/lib/ai/agentProvider.ts` in the `generateIdeas()` method to change:
- Number of fields per idea
- Scoring ranges
- Prompt instructions

Example:
```typescript
const prompt = `Generate ${count} unique content ideas for: ${topic}

For each idea provide:
- title: Brief, catchy title
- description: Detailed description
- difficulty: easy/medium/hard
- effort_hours: estimated hours

Output ONLY valid JSON array, no extra text.`
```

## Performance Notes

- First idea generation: ~5-10 seconds (Copilot CLI startup)
- Subsequent generations: ~2-5 seconds
- Faster with simpler topics
- Ideas are generated server-side, not client-side

## Security & Privacy

- Ideas are generated via Copilot CLI (uses GitHub's servers)
- Topic text is sent to Copilot CLI
- Generated ideas are stored locally or in Supabase based on authentication
- No personal data is sent unless included in the topic

## Fallback Strategy

If Copilot generation fails:
1. Error message is displayed to user
2. Textarea remains available for manual paste
3. User can manually generate ideas using web interface
4. No data is lost

## Next Steps

After generating ideas:
1. **Select an idea** → Click "Take Further"
2. **Research** → Add research content on `/ideas/research`
3. **Generate content** → Create blog, LinkedIn, newsletter posts
4. **Publish** → Create GitHub PR or save locally

---

For more details, see:
- [USAGE.md](./USAGE.md) - Complete workflow guide
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Architecture and setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design

