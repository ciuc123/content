# Integration Setup Guide: Supabase, Clerk & GitHub Copilot

This guide walks you through setting up all three integrations step-by-step.

---

## 1️⃣ SUPABASE SETUP

### A. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Project name**: ideas-content-engine
   - **Database password**: Save this securely
   - **Region**: Choose closest to you
5. Wait for project creation (2-3 minutes)

### B. Get Your Credentials
1. Go to **Settings → API** in your Supabase project
2. Copy these to your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  (from Service Role Secret)
   ```

### C. Run Database Migrations
1. In Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy entire content from `migrations/initial.sql`
4. Paste into SQL Editor
5. Click **Run** (or Ctrl+Enter)
6. Verify tables created under **Table Editor**

### D. Enable Row Level Security (RLS) - Optional but Recommended
```sql
-- Run in SQL Editor to enable RLS on all tables

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE research ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies for user isolation (RLS policies)
-- This ensures users only see their own data
```

### E. Test Connection
```bash
# Run this command from your project root
npm run test
```

---

## 2️⃣ CLERK SETUP

### A. Create Clerk Account & Project
1. Go to [clerk.com](https://clerk.com)
2. Sign in or create an account
3. Click **Create Application**
4. Choose your authentication methods (Email recommended)
5. Name it: "ideas-content-engine"

### B. Get Your Credentials
1. Go to **API Keys** in Clerk Dashboard
2. Copy these to your `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
   CLERK_SECRET_KEY=sk_test_xxxxx
   ```

### C. Configure Sign-In/Sign-Up URLs
1. In Clerk Dashboard, go to **Settings → URLs**
2. Set these:
   - **Sign-in URL**: `http://localhost:3000/sign-in`
   - **Sign-up URL**: `http://localhost:3000/sign-up`
   - **After sign-in URL**: `http://localhost:3000/ideas`
   - **After sign-up URL**: `http://localhost:3000/ideas`

### D. Create Sign-In and Sign-Up Pages
The pages are already set up at:
- `/app/sign-in/[[...sign-in]]/page.tsx`
- `/app/sign-up/[[...sign-up]]/page.tsx`

If they don't exist, create them with:
```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignIn />;
}
```

### E. Test Authentication
1. Run the dev server: `npm run dev`
2. Go to http://localhost:3000/sign-in
3. Create a test account
4. You should be redirected to /ideas

---

## 3️⃣ GITHUB COPILOT SETUP

You have two options:

### Option A: Manual Copy-Paste Mode (Easiest - Default)
No setup required! This is already configured.

**How it works:**
1. Click "Generate" button
2. Copy the prompt
3. Paste into GitHub Copilot (VS Code or github.com/copilot_chat)
4. Copy Copilot's response
5. Paste back into the UI

**Environment variables needed:**
```
COPILOT_ENABLED=true
```

### Option B: Automated API Mode (Advanced)

This allows automatic generation without manual copy-paste.

#### B1. Using OpenAI API
1. Get OpenAI API key from [openai.com/api](https://platform.openai.com/api/keys)
2. Add to `.env.local`:
   ```
   OPENAI_API_KEY=sk-xxxxx
   COPILOT_ENABLED=true
   COPILOT_USE_OPENAI=true
   ```

#### B2. Using GitHub Copilot CLI (Experimental)
1. GitHub Copilot CLI is not reliably available via npm yet
2. For now, use OpenAI API mode or manual mode

### Test Copilot Integration
```bash
# Test the copilot API endpoint
curl -X POST http://localhost:3000/api/ai/copilot \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Generate 3 blog post ideas about AI"}'
```

---

## 4️⃣ ENVIRONMENT VARIABLES SUMMARY

Create `.env.local` with these values:

```env
# Supabase (Required for production)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Clerk (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# GitHub Copilot (Choose one mode)
COPILOT_ENABLED=true
COPILOT_USE_OPENAI=true              # Set to true for automatic mode
OPENAI_API_KEY=sk-xxxxx             # Only needed if COPILOT_USE_OPENAI=true

# GitHub (Optional - for publishing to GitHub)
GITHUB_TOKEN=ghp_xxxxx
GITHUB_TARGET_REPO=your_username/your_blog_repo

# Development flags
AI_PROVIDER=manual                   # Options: manual, github, openai
DEV_AUTH_DISABLED=false              # Set false to use real Clerk auth
USE_SUPABASE=true                    # Set true to use Supabase instead of local files
USE_LOCAL_KNOWLEDGE=false            # Set false to load knowledge from Supabase
GITHUB_MOCK=false                    # Set false to create real GitHub PRs
```

---

## 5️⃣ VERIFY EVERYTHING WORKS

### Check 1: Start Dev Server
```bash
npm run dev
```

Expected output:
```
> next dev
✓ compiled successfully
```

### Check 2: Visit Pages
- http://localhost:3000 → Home page
- http://localhost:3000/sign-in → Clerk sign-in
- After signing in:
  - http://localhost:3000/ideas → Ideas list
  - http://localhost:3000/ideas/research → Research
  - http://localhost:3000/ideas/generate → Generate
  - http://localhost:3000/publish → Publish

### Check 3: Test API Endpoints
```bash
# Get ideas (after signing in)
curl http://localhost:3000/api/ideas

# Test Copilot integration
curl -X POST http://localhost:3000/api/ai/copilot \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Generate 5 ideas for a blog about web development"}'
```

### Check 4: Run Tests
```bash
npm run test
```

---

## 6️⃣ TROUBLESHOOTING

### Issue: "Supabase credentials not configured"
**Solution:** Make sure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### Issue: "Clerk sign-in not working"
**Solution:**
1. Check `.env.local` has Clerk keys
2. Verify URLs in Clerk Dashboard match http://localhost:3000
3. Restart dev server: `npm run dev`

### Issue: "Can't generate ideas"
**Solution:**
1. If using manual mode: Copy prompt, paste in Copilot, paste response back
2. If using API mode: Check OPENAI_API_KEY is valid
3. Check API endpoint: `curl http://localhost:3000/api/ai/copilot`

### Issue: "Ideas not saving to Supabase"
**Solution:**
1. Check if USE_SUPABASE=true in `.env.local`
2. Verify tables exist in Supabase SQL Editor
3. Check Supabase credentials are correct
4. Run migrations if tables missing: Copy `migrations/initial.sql` and run in Supabase SQL Editor

---

## 7️⃣ NEXT STEPS

### Immediate Actions
- [ ] Set up Supabase project
- [ ] Set up Clerk account
- [ ] Copy credentials to `.env.local`
- [ ] Run migrations
- [ ] Test sign-in flow
- [ ] Test idea generation

### Optional Enhancements
- [ ] Set up GitHub token for PR creation
- [ ] Enable Row Level Security in Supabase
- [ ] Configure OpenAI API for automatic generation
- [ ] Add analytics tracking
- [ ] Set up database backups in Supabase

### Production Deployment
When deploying to production:
1. Add all `.env.local` variables to your hosting platform (Vercel, etc.)
2. Set `DEV_AUTH_DISABLED=false`
3. Set `USE_SUPABASE=true`
4. Set `GITHUB_MOCK=false` if using GitHub
5. Use SUPABASE_SERVICE_ROLE_KEY only on server-side operations

---

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Clerk Docs](https://clerk.com/docs)
- [GitHub Copilot](https://github.com/features/copilot)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

## ✅ Integration Checklist

- [ ] Supabase project created
- [ ] Supabase credentials in `.env.local`
- [ ] Database migrations run
- [ ] Clerk account created
- [ ] Clerk credentials in `.env.local`
- [ ] Sign-in/Sign-up pages working
- [ ] Dev server running without errors
- [ ] Can sign in successfully
- [ ] Can generate ideas
- [ ] Can save research and generated content
- [ ] Can publish to GitHub (optional)

---

Once you complete these steps, your Ideas Content Engine will be fully integrated with Supabase for data storage, Clerk for authentication, and GitHub Copilot for AI-powered generation!

