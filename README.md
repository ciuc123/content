# Ideas Content Engine

## Goal

Build a private authenticated application hosted at:

ideas.ciuculescu.com

The purpose of the application is to help generate content that attracts CTOs, Engineering Managers, founders, and potential consulting clients.

The workflow should optimize for:

* Generating many content ideas
* Selecting exactly one idea
* Generating research
* Generating a LinkedIn post
* Generating a long-form blog article
* Opening a GitHub Pull Request against my public blog repository

The entire workflow should take less than 10 minutes.

The application is for a single user only.

---

## MVP Quick Start (minimal, Docker dev)

This README contains the full specification. To get a working MVP quickly (few hours), follow the minimal "Quick Start" below.

Prerequisites: Docker & Docker Compose (or WSL with Docker), Git

1) Copy `.env.example` and fill the minimal vars (or rely on defaults):

```bash
cp .env.example .env.local
# edit .env.local and set GITHUB_TARGET_REPO and GITHUB_TOKEN if you want to test PR creation
```

2) Start services (Postgres + web dev container):

```bash
docker compose up --build
```

3) Open http://localhost:3000 and use the simple UI.

Dev tips:

- To bypass auth during early development set `DEV_AUTH_DISABLED=true` (already default in `.env.example`).
- For local testing of publishing without touching GitHub set `GITHUB_MOCK=true` (writes to `content/posts/` locally).
- Use Copilot manually: paste Copilot output into the input textareas in the app (no external AI key needed).

---

# Tech Stack

## Frontend

* Next.js latest App Router
* TypeScript
* TailwindCSS
* Clerk Authentication
* Vercel deployment

## Storage

Use Supabase free tier.

The application is expected to have very low traffic.

---

# Authentication

Only authenticated users can access the application.

Use Clerk.

No multi-user support is needed.

No roles are needed.

---

# AI Provider

Do NOT use a dedicated Claude API integration.

The system should support an interchangeable AI provider layer.

Create:

```typescript
interface AIProvider {
    generate(prompt: string): Promise<string>;
}
```

Initial implementation:

```typescript
class OpenAIProvider
```

The rest of the application must depend only on the interface.

This allows future replacement with:

* OpenAI
* Claude
* Gemini
* OpenRouter

without changing business logic.

---

# Data Model

## ideas

```sql
id uuid
title text
why_it_matters text
virality_score integer
business_score integer

status text

created_at timestamp
updated_at timestamp
```

Allowed statuses:

```text
new
selected
researched
generated
published
archived
```

---

## research

```sql
id uuid
idea_id uuid

content text

created_at timestamp
```

---

## generated_content

```sql
id uuid

idea_id uuid

linkedin_post text

blog_post text

newsletter_post text

seo_title text

seo_description text

slug text

created_at timestamp
```

---

# Content Knowledge Base

The application should contain a local knowledge base.

Purpose:

Inject real experience into generated content.

Avoid generic AI-generated writing.

---

## knowledge/

Create a folder:

```text
knowledge/
```

---

## knowledge/cv.md

Contains my professional background.

Examples:

* 14 years PHP
* Laravel specialist
* Freelance work
* Redis experience
* AWS experience
* Laravel Vapor
* SaaS development
* Team leadership
* Architecture decisions
* Hotel management software

This file should be editable inside the application.

---

## knowledge/experience.md

Contains real stories and observations.

Examples:

* Difficult production incidents
* Scaling problems
* Caching issues
* Client lessons
* Freelancing lessons
* Hiring observations
* Mistakes made
* Architecture wins
* Architecture failures

This file should be editable inside the application.

---

# Main Workflow

## Step 1

Generate Ideas

Input:

```text
How many ideas?
```

Default:

```text
30
```

Prompt:

Generate content ideas targeting:

* CTOs
* Engineering Managers
* SaaS Founders

Requirements:

* Must come from real-world engineering experience
* Must avoid beginner tutorials
* Must create discussion
* Must create business opportunities
* Must be relevant to backend engineering

Return:

* title
* why it matters
* virality score
* business score

Store all generated ideas.

Display them in a sortable table.

Sort by:

business_score descending

by default.

---

## Step 2

Select Idea

The user selects exactly one idea.

Button:

```text
Take Further
```

Update status:

```text
selected
```

---

## Step 3

Research

Generate a structured research brief.

Prompt:

You are helping a senior Laravel consultant create content.

Audience:

* CTOs
* Engineering Managers
* Technical Founders

Topic:

{{topic}}

Use the following context:

{{cv.md}}

{{experience.md}}

Generate:

* Contrarian viewpoints
* Common mistakes
* Real-world examples
* Supporting arguments
* Actionable recommendations

Return structured markdown.

Store result.

Update status:

```text
researched
```

---

## Step 4

Generate Content

Generate:

### LinkedIn Post

Requirements:

* 150-300 words
* Strong first sentence
* Practical
* Experience-driven
* End with a discussion question

---

### Blog Post

Requirements:

* 1200-2000 words
* Markdown
* SEO-friendly
* Multiple headings
* Practical examples
* Actionable takeaways
* Written for technical decision makers

---

### Newsletter Version

Requirements:

* Shorter than blog
* More personal
* Email-friendly

Store all generated assets.

Update status:

```text
generated
```

---

# Content Review Screen

Display:

## LinkedIn Post

Large textarea

Copy button

---

## Blog Post

Markdown editor

Live preview

---

## Newsletter

Textarea

Copy button

---

# GitHub Publishing

The application should publish blog content via Pull Request.

Never commit directly to main.

Workflow:

1. Create branch
2. Create markdown file
3. Commit
4. Open Pull Request

---

# Blog File Format

Generate:

```text
content/posts/YYYY-MM-DD-slug.md
```

Frontmatter:

```yaml
title:
description:
date:
slug:
tags:
```

Then markdown body.

---

# Pull Request Title

```text
Add blog post: {title}
```

---

# Pull Request Body

```text
Generated from Ideas Content Engine
```

---

# Dashboard

Show:

## Metrics

* Total ideas
* Ideas selected
* Articles generated
* Articles published

---

## Recent Content

Latest generated assets.

---

# Non-Goals

Do NOT build:

* Social scheduling
* LinkedIn automation
* Multi-user support
* Team collaboration
* Analytics integrations
* Email sending
* Comment generation
* Complex SEO tools

Keep the product intentionally simple.

The core workflow is:

Generate Ideas
→ Select One
→ Research
→ Generate Content
→ Review
→ Open Pull Request

Everything else is secondary.

---

# Success Criteria

A typical session should look like:

1. Generate 30 ideas
2. Select 1 idea
3. Generate research
4. Generate LinkedIn post
5. Generate blog article
6. Edit if necessary
7. Open GitHub PR

Total time:

Less than 10 minutes.

The application should feel like a focused content production tool rather than a generic AI writing platform.
