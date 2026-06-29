# Ideas Content Engine

A minimal, Docker-first web app for generating, researching, and publishing content ideas using GitHub Copilot.

## Quick Start

```bash
# 1. Setup environment
cp .env.example .env.local

# 2. Start with Docker
docker compose up --build

# 3. Open browser
open http://localhost:3000
```

## Workflow

### Manual Mode (Default)
The app guides you through 4 simple steps:

1. **Generate Ideas** - Ask Copilot to generate content ideas (JSON format)
2. **Select & Research** - Pick an idea and generate research with Copilot
3. **Generate Content** - Create LinkedIn post, blog article, and newsletter using Copilot
4. **Publish** - Create a GitHub PR on your blog repository

**Total time: ~10-15 minutes per post**

### Automated Mode (AI Agent)
Or let the AI Agent handle everything automatically:

```bash
curl -X POST http://localhost:3000/api/ai/agent \
  -H "Content-Type: application/json" \
  -d '{"action": "fullWorkflow", "topic": "DevOps", "depth": "medium"}'
```

**Total time: ~30-80 seconds per post** (depending on AI provider)

See [AI Agent Guide](./AI_AGENT_GUIDE.md) for detailed documentation.

## Key Features

✅ **Minimal Setup** - Docker + file-based storage (no external DB needed)  
✅ **Copilot-Native** - Copy prompts to Copilot, paste results back  
✅ **GitHub Integration** - Publish directly to your blog repository as PRs  
✅ **Single User** - Perfect for personal blogs  
✅ **Dev-Friendly** - Mock mode for testing without creating real PRs  

## Documentation

- **[Usage Guide](./USAGE.md)** - Step-by-step workflow guide
- **[.env.example](./.env.example)** - Environment variables reference

## Tech Stack

- **Frontend:** Next.js 16+ (App Router) + TypeScript + Tailwind
- **Backend:** Next.js API routes
- **Storage:** File-based JSON (upgradeable to Supabase)
- **Deployment:** Docker + Docker Compose (local dev)

## Environment Setup

### Minimal (for testing):
```bash
DEV_AUTH_DISABLED=true  # Skip auth
GITHUB_MOCK=true        # Mock PRs (write to local files)
```

### For Production (GitHub integration):
```bash
GITHUB_TOKEN=your_token
GITHUB_TARGET_REPO=username/blog-repo
```

## Architecture

```
App Flow:
  Ideas Page → Research Page → Generate Page → Publish Page
        ↓            ↓               ↓              ↓
     Ideas API   Research API  Generated API  Publish API
        ↓            ↓               ↓              ↓
    ideas.json  research.json generated.json  GitHub PR
```

## Development

### Local Testing

```bash
# View logs
docker compose logs web -f

# Access container shell
docker compose exec web sh

# Restart services
docker compose restart
```

### File Locations

- Ideas: `data/ideas.json`
- Research: `data/research.json`
- Generated content: `data/generated.json`
- Knowledge base: `knowledge/cv.md`, `knowledge/experience.md`
- Published posts (mock): `content/posts/`

## FAQ

**Q: Do I need an API key?**  
A: No! Uses GitHub Copilot (copy-paste workflow). Optional: GITHUB_TOKEN for PR creation.

**Q: Can I use a different AI provider?**  
A: Yes, the system supports pluggable providers. Default is ManualProvider (copy-paste).

**Q: Where is my data stored?**  
A: Locally in JSON files (`data/` directory). Upgrade to Supabase in production.

**Q: Can I publish without creating a real PR?**  
A: Yes, set `GITHUB_MOCK=true` to write posts to `content/posts/` instead.

## Next Steps

1. Complete one full workflow end-to-end
2. Refine Copilot prompts based on your domain
3. Set up GitHub token for real PR creation
4. Migrate to Supabase for production deployment

## License

MIT
