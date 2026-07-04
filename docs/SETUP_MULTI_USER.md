# Multi-User Setup Guide: Supabase + Clerk

This guide helps you set up the Ideas Content Engine for **multi-user production use** with Supabase database and Clerk authentication.

## Prerequisites

- Supabase account (https://supabase.com)
- Clerk account (https://clerk.com)
- Git and Docker

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to https://supabase.com and create an account
2. Create a new project (select your preferred region)
3. Wait for the project to initialize
4. Go to **Project Settings** → **API Keys**
5. Copy:
   - `NEXT_PUBLIC_SUPABASE_URL` (Supabase URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key - keep secret)

### 1.2 Create Database Tables

1. In Supabase, go to **SQL Editor** → **New Query**
2. Run this SQL to create the required tables:

```sql
-- Ideas table
CREATE TABLE ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL,
  why_it_matters text,
  virality_score integer CHECK (virality_score >= 1 AND virality_score <= 10),
  business_score integer CHECK (business_score >= 1 AND business_score <= 10),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'selected', 'researched', 'generated', 'published', 'archived')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Research table
CREATE TABLE research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Generated content table
CREATE TABLE generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  linkedin_post text,
  blog_post text,
  newsletter_post text,
  slug text,
  seo_title text,
  seo_description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User knowledge table
CREATE TABLE user_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  cv_content text,
  experience_content text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) to protect user data
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE research ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_knowledge ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only see their own data
CREATE POLICY "Users can view their own ideas" ON ideas
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own ideas" ON ideas
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own ideas" ON ideas
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own ideas" ON ideas
  FOR DELETE USING (auth.uid()::text = user_id);

-- Similar policies for research
CREATE POLICY "Users can view their own research" ON research
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own research" ON research
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Similar policies for generated_content
CREATE POLICY "Users can view their own generated content" ON generated_content
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own generated content" ON generated_content
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Similar policies for user_knowledge
CREATE POLICY "Users can view their own knowledge" ON user_knowledge
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their own knowledge" ON user_knowledge
  FOR ALL USING (auth.uid()::text = user_id);
```

3. Click **Run** to execute the SQL

### 1.3 Set Up Clerk Connection (Optional Advanced)

For automatic Supabase Auth with Clerk:
1. Go to **Authentication** → **Providers** in Supabase
2. Enable relevant providers
3. Or use Clerk's built-in auth (simpler)

---

## Step 2: Set Up Clerk

### 2.1 Create Clerk Application

1. Go to https://clerk.com and create an account
2. Create a new application (choose Next.js as framework)
3. Complete the setup wizard
4. Go to **API Keys** (left sidebar)
5. Copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY` (keep secret)

### 2.2 Configure Redirect URIs

1. In Clerk dashboard, go to **Settings** → **Paths**
2. Make sure these paths are configured:
   - Sign in: `/sign-in`
   - Sign up: `/sign-up`
   - After sign in: `/ideas`
   - After sign up: `/ideas`

---

## Step 3: Update Environment Variables

Copy the credentials to your `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:

```dotenv
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# Enable Supabase
USE_SUPABASE=true

# Disable dev auth
DEV_AUTH_DISABLED=false
```

---

## Step 4: Create Clerk Pages

The app needs sign-in and sign-up pages. Create them:

```bash
mkdir -p app/(auth)/sign-in
mkdir -p app/(auth)/sign-up
```

### `app/(auth)/sign-in/[[...index]]/page.tsx`:

```typescript
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignIn />;
}
```

### `app/(auth)/sign-up/[[...index]]/page.tsx`:

```typescript
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <SignUp />;
}
```

---

## Step 5: Test the Setup

1. Restart the Docker containers:
   ```bash
   docker compose restart
   ```

2. Visit http://localhost:3000
3. You should see a sign-in/sign-up prompt
4. Create an account
5. You should be redirected to `/ideas`
6. Verify that you can only see your own content

---

## Verification Checklist

- [ ] Supabase project created
- [ ] Database tables created with RLS
- [ ] Clerk application created
- [ ] Environment variables configured
- [ ] Docker containers restarted
- [ ] Can sign in/sign up
- [ ] Can create ideas
- [ ] Can see only own ideas
- [ ] Other users cannot see your content

---

## Development Mode (File-Based Storage)

To continue using file-based storage during development:

1. Keep `USE_SUPABASE=false` in `.env.local`
2. Keep `DEV_AUTH_DISABLED=true`
3. The app will use JSON files instead of database

When you're ready for production, set `USE_SUPABASE=true` and `DEV_AUTH_DISABLED=false`.

---

## Troubleshooting

### "Unauthorized" errors
- Check `USE_SUPABASE=true` is set
- Verify Clerk is properly configured
- Check `CLERK_SECRET_KEY` is set

### "Database connection failed"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- Ensure database tables were created

### User data leaking
- Verify RLS policies are enabled
- Check `Row Level Security` is ON for each table
- Run the RLS policy setup SQL again

### Clerk sign-in not working
- Verify sign-in/sign-up pages are created
- Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Verify redirect URIs in Clerk settings

---

## Next Steps

1. Test workflow with multiple users
2. Configure GitHub PRs for publishing
3. Set up production deployment (Vercel)
4. Monitor logs for errors
5. Back up Supabase database regularly

---

For more information:
- Supabase Docs: https://supabase.com/docs
- Clerk Docs: https://clerk.com/docs
- Next.js Docs: https://nextjs.org/docs

