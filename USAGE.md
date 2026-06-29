# Ideas Content Engine - User Guide

## Overview

The Ideas Content Engine helps you generate, research, and publish content ideas using GitHub Copilot. The entire workflow from idea generation to publishing takes ~10-15 minutes.

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- GitHub Copilot access (for AI generation)
- Git configured

### Setup

1. **Clone and setup environment:**
   ```bash
   cp .env.example .env.local
   ```

2. **Start the application:**
   ```bash
   docker compose up --build
   ```

3. **Open in browser:**
   - Navigate to http://localhost:3000

## Workflow

The app guides you through a 4-step process:

### Step 1: Generate Ideas 📚

**Page:** `/ideas`

1. **Get the Copilot prompt from the app** - it shows a ready-to-use prompt template
2. **Open GitHub Copilot** and paste the prompt:
   ```
   Generate 10 unique content ideas for a software engineer's blog. For each idea, provide: 
   title, why_it_matters, virality_score (1-10), business_score (1-10). Output as JSON array.
   ```
3. **Copy Copilot's response** (should be a JSON array)
4. **Paste into the app** and click "Import Ideas"
5. **Review the table** of imported ideas

### Step 2: Select & Research 🔍

**Page:** `/ideas` → click "Take Further" on an idea

After clicking "Take Further":

1. **Navigate to `/ideas/research`** (you'll be redirected)
2. **The app shows the selected idea** with a guided prompt
3. **Ask GitHub Copilot** to research the topic:
   ```
   Research this topic: [IDEA_TITLE]. Why it matters: [WHY_IT_MATTERS]
   ```
4. **Paste the research response** into the textarea
5. **Click "Save Research"** to proceed

### Step 3: Generate Content 📝

**Page:** `/ideas/generate`

The app shows your selected idea and research. For each content format:

1. **Click "Copy Prompt"** for the content type you want to generate (LinkedIn, Blog, or Newsletter)
2. **Paste the prompt into GitHub Copilot**
3. **Copy Copilot's response**
4. **Paste into the corresponding textarea** in the app
5. **Repeat for each content type** you want to generate
6. **Click "Save Generated"** when done

#### Content Formats:

- **LinkedIn Post** (150-300 words) - Great for professional engagement
- **Blog Post** (1200-2000 words, Markdown) - Long-form article for your blog
- **Newsletter** (300-500 words) - Digest-style summary

### Step 4: Publish 🚀

**Page:** `/publish`

1. **Navigate to `/publish`** or click "Next: Publish" from the generate page
2. **Fill in:**
   - **Title** - the blog post title
   - **Slug** - URL-friendly identifier (e.g., `my-great-idea`)
   - **Body** - your blog post content (Markdown)
3. **Click "Publish"**
   - **Dev mode** (`GITHUB_MOCK=true`): Writes to `content/posts/` locally
   - **Production**: Creates a PR on your target GitHub blog repo

## Tips & Tricks

### Working with Copilot

- **Be specific**: The prompts in the app are pre-tuned for good results
- **Iterate**: If Copilot's output isn't perfect, ask follow-ups in Copilot
- **Format**: Paste the raw output - the app will handle it

### Local Development

- **Skip Auth**: Set `DEV_AUTH_DISABLED=true` (default in dev)
- **Mock Publishing**: Set `GITHUB_MOCK=true` (default in dev) to test without PRs
- **File Storage**: All data is stored in JSON files in `data/` directory

### Customizing Knowledge

**Page:** `/settings/knowledge`

Store your professional info that can be used in prompts:
- CV/Resume
- Experience summary

These can be included in Copilot prompts for more personalized content.

## Environment Variables

### Critical (for publishing)

```bash
GITHUB_TOKEN=your_github_token
GITHUB_TARGET_REPO=your_username/your_blog_repo
```

### AI Provider

```bash
# Default is 'manual' (recommended for copy-paste workflow)
AI_PROVIDER=manual

# If you want to set test values locally:
MANUAL_AI_RESPONSE=your_test_response
```

### Local Development Flags

```bash
DEV_AUTH_DISABLED=true        # Bypass auth in dev
GITHUB_MOCK=true              # Don't create real PRs
USE_LOCAL_KNOWLEDGE=true      # Read knowledge from files
```

## File Structure

- `/data/ideas.json` - Stored ideas
- `/data/research.json` - Stored research
- `/data/generated.json` - Generated content
- `/knowledge/` - Your CV and experience docs
- `/content/posts/` - Mock-published posts (dev mode)

## Troubleshooting

### "No ideas yet" after import
- Ensure the JSON is valid (test at https://jsonlint.com)
- Check that all required fields are present: `title`, `why_it_matters`, `virality_score`, `business_score`

### Navigation not working after "Take Further"
- Wait 1-2 seconds, the page will redirect automatically
- If stuck, manually navigate to `/ideas/research`

### Generate button returns error
- This is normal! Click "Copy Prompt" to copy the prompt, paste into Copilot, then paste the result back

### Docker won't start
- Check: `docker compose up --build` output
- Ensure you have Node.js support (postgres container may need cleanup: `docker compose down -v`)

## Next Steps

### After first successful publish:

1. **Refine prompts** - The app shows what prompts it's using
2. **Batch process** - Generate multiple posts per day by repeating the workflow
3. **Setup CI/CD** - Configure GitHub Actions to auto-merge your PRs
4. **Database migration** - Move from file storage to Supabase (future enhancement)

## Support

For issues or feature requests:
1. Check `/` home page for workflow overview
2. Review the helpful hints on each page
3. Check the browser console for error messages

---

**Happy creating! 🎉**

