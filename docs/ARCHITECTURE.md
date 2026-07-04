# 🎨 Integration Architecture Overview

Visual guide to how Supabase, Clerk, and GitHub Copilot fit together in your app.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser / Client                         │
│  User Interface (React Components, Next.js App Router)          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────────┐
        │   Clerk Authentication Layer            │
        │   (Sign In / Sign Up / User Context)    │
        └─────────────────────┬───────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js App Router                            │
│  (with middleware.ts protecting routes)                         │
├─────────────────────────────────────────────────────────────────┤
│                    API Routes Layer                              │
│  ├── /api/ideas → Supabase (Ideas table)                        │
│  ├── /api/research → Supabase (Research table)                  │
│  ├── /api/generated → Supabase (Generated_content table)        │
│  ├── /api/ai/copilot → OpenAI or Manual Mode                    │
│  └── /api/ai/generate → Manual Provider                         │
└─────────┬──────────────────┬────────────────────────────┬───────┘
          │                  │                            │
          ↓                  ↓                            ↓
    ┌──────────┐      ┌────────────┐          ┌────────────────┐
    │ Supabase │      │  OpenAI    │          │ GitHub Copilot │
    │ Database │      │   API      │          │   (Manual)     │
    │   (RLS)  │      │ (Optional) │          │  (Copy-Paste)  │
    └──────────┘      └────────────┘          └────────────────┘
```

---

## 🔄 User Flow: Complete Workflow

```
START (Home Page)
    │
    ├─→ [Not Signed In?]
    │   └─→ Redirect to /sign-in (Clerk)
    │       └─→ User signs in
    │
    ├─→ [Signed In] ✓
    │
    ├─→ GO TO IDEAS PAGE
    │   └─→ middleware.ts verifies auth ✓
    │   └─→ Fetch from /api/ideas
    │       └─→ Check Clerk auth
    │       └─→ Query Supabase for user's ideas
    │
    ├─→ CREATE NEW IDEA
    │   ├─→ Form submission
    │   ├─→ POST /api/ideas
    │   │   ├─→ Verify user with Clerk
    │   │   ├─→ Save to Supabase (with user_id)
    │   │   └─→ Return idea to UI
    │   └─→ Refresh ideas list
    │
    ├─→ SELECT IDEA & RESEARCH
    │   ├─→ Click idea
    │   ├─→ Go to /ideas/research
    │   ├─→ Enter research notes
    │   ├─→ POST /api/research
    │   │   ├─→ Verify Clerk auth
    │   │   ├─→ Save to Supabase
    │   │   └─→ Success ✓
    │
    ├─→ GENERATE CONTENT
    │   ├─→ Go to /ideas/generate
    │   ├─→ Choose generation method:
    │   │
    │   ├─→ [Manual Mode]
    │   │   ├─→ GET /api/ai/copilot (with prompt)
    │   │   ├─→ Returns: "Copy this prompt..."
    │   │   ├─→ User copies prompt
    │   │   ├─→ Pastes in GitHub Copilot web
    │   │   ├─→ Pastes response back
    │   │   └─→ POST to save generated content
    │   │
    │   ├─→ [Automatic Mode - with OPENAI_API_KEY]
    │   │   ├─→ POST /api/ai/copilot
    │   │   ├─→ Calls OpenAI API
    │   │   ├─→ Returns generated content directly
    │   │   └─→ Auto-saves to Supabase
    │   │
    │   └─→ POST /api/generated
    │       ├─→ Verify Clerk auth
    │       ├─→ Save to Supabase
    │       └─→ Success ✓
    │
    ├─→ PUBLISH CONTENT
    │   ├─→ Go to /publish
    │   ├─→ Choose publish method:
    │   │   ├─→ Create GitHub PR (if GITHUB_TOKEN set)
    │   │   └─→ Mock publish (default)
    │   └─→ Mark as published in Supabase
    │
    └─→ END (Content Published)
```

---

## 📊 Data Flow for Each Service

### 1️⃣ CLERK Authentication Flow
```
User Input
    ↓
   Sign In Form
    ↓
   Clerk.SignIn() Component
    ↓
   Clerk API (clerk.com)
    ↓
   Session Created
    ↓
   auth() function returns { userId, sessionId }
    ↓
   Used in middleware.ts & API routes
    ↓
   Protects routes & data
```

### 2️⃣ SUPABASE Database Flow
```
User Action (Create/Read/Update/Delete)
    ↓
   API Route (/api/*)
    ↓
   Get Clerk userId
    ↓
   Call supabaseHelpers.* function
    ↓
   Create client instance
    ↓
   Query Supabase with user_id filter
    ↓
   Get Response
    ↓
   Return to Frontend
    ↓
   Update UI
```

### 3️⃣ COPILOT Generation Flow
```
[Manual Mode]
Generate Button Click
    ↓
GET /api/ai/copilot?prompt=...
    ↓
Format Prompt
    ↓
Return: "Copy this prompt to Copilot"
    ↓
User copies & opens github.com/copilot
    ↓
Pastes prompt
    ↓
Copilot generates response
    ↓
User copies response
    ↓
Pastes back into app
    ↓
POST /api/generated (save to Supabase)

[Automatic Mode] (with OPENAI_API_KEY)
Generate Button Click
    ↓
POST /api/ai/copilot
    ↓
Call OpenAI API directly
    ↓
OpenAI processes prompt
    ↓
Returns generated content
    ↓
Auto-save to Supabase
    ↓
Display in UI
```

---

## 🔐 Security Layers

```
Layer 1: Route Protection (middleware.ts)
┌────────────────────────────────┐
│ Public Routes                  │
│ - /                            │
│ - /sign-in                     │
│ - /sign-up                     │
└────────────────────────────────┘
        ↓
┌────────────────────────────────┐
│ Protected Routes               │
│ - /ideas                       │
│ - /ideas/research              │
│ - /ideas/generate              │
│ - /publish                     │
│ - /settings/*                  │
│ (Require Clerk authentication) │
└────────────────────────────────┘

Layer 2: API Authentication (lib/clerk.ts)
┌────────────────────────────────┐
│ Every API route:               │
│ 1. Get userId from auth()      │
│ 2. Verify userId exists        │
│ 3. Use userId for data filters │
│ 4. No userId? → 401 error      │
└────────────────────────────────┘

Layer 3: Database Isolation (Supabase RLS - Optional)
┌────────────────────────────────┐
│ Row Level Security Policies    │
│ Ideas table:                   │
│   SELECT: WHERE user_id = ?    │
│   INSERT: Must set user_id     │
│   UPDATE: WHERE user_id = ?    │
│   DELETE: WHERE user_id = ?    │
└────────────────────────────────┘
```

---

## 📦 Component Dependencies

```
app/layout.tsx
    ├── ClerkProvider
    │   └── Wraps entire app
    │
    └── Middleware.ts
        └── Protects all routes
            └── Calls Clerk API


API Routes
    ├── auth() from @clerk/nextjs
    │   └── Gets current user
    │
    ├── supabaseHelpers
    │   └── Queries Supabase
    │       └── Filters by user_id
    │
    └── OpenAI API (optional)
        └── Generates content


Pages/Components
    ├── useAuth() from @clerk/nextjs
    │   └── Client-side user info
    │
    ├── fetch() to API routes
    │   └── Gets user data
    │
    └── Display & Edit


Database (Supabase)
    ├── ideas (user_id indexed)
    ├── research (user_id + idea_id indexed)
    ├── generated_content (user_id + idea_id indexed)
    └── user_knowledge (user_id indexed)
```

---

## 🎯 Environment Variable Flow

```
.env.local (Local Development)
    │
    ├─→ NEXT_PUBLIC_* (Exposed to Browser)
    │   ├── NEXT_PUBLIC_SUPABASE_URL
    │   ├── NEXT_PUBLIC_SUPABASE_ANON_KEY
    │   └── NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    │
    ├─→ Secret Keys (Server-side only)
    │   ├── CLERK_SECRET_KEY
    │   ├── SUPABASE_SERVICE_ROLE_KEY
    │   └── OPENAI_API_KEY
    │
    └─→ Feature Flags (Control Behavior)
        ├── COPILOT_ENABLED
        ├── COPILOT_USE_OPENAI
        ├── USE_SUPABASE
        ├── USE_LOCAL_KNOWLEDGE
        ├── DEV_AUTH_DISABLED
        └── GITHUB_MOCK


Production Deployment
    │
    └─→ Set same variables in deployment platform:
        ├── Vercel Dashboard → Environment Variables
        ├── Heroku Dashboard → Config Vars
        └── Or your hosting provider's equivalent
```

---

## 🔗 Integration Points

### Clerk → Supabase
```
When user signs in:
1. Clerk creates session
2. userId available in app
3. Pass userId to Supabase queries
4. Supabase filters data by userId
5. User sees only their data
```

### Supabase → Copilot API
```
When generating content:
1. Get userId from Clerk
2. Get idea/research from Supabase
3. Build prompt with that data
4. Send to Copilot API
5. Save generated content to Supabase
```

### Clerk → Middleware → API Routes
```
Request Flow:
1. Browser sends request
2. middleware.ts checks Clerk session
3. If valid: Pass through
4. If invalid: Redirect to sign-in
5. API route gets userId
6. API queries Supabase with userId
```

---

## 💡 How They Work Together

### Example: Creating an Idea

```
1️⃣  User at /ideas page
   - Middleware verified auth ✓
   - ClerkProvider available ✓

2️⃣  User clicks "Create Idea"
   - Form appears (client component)
   - useAuth() hook shows user signed in

3️⃣  User submits form
   - POST /api/ideas
   - Payload: { title: "...", ... }

4️⃣  API Route Handler
   - const { userId } = auth()     ← Get from Clerk
   - supabaseHelpers.createIdea(
       userId,
       { title: "..." }
     )
   - Creates in Supabase with userId

5️⃣  Supabase Stores
   - ideas table:
     {
       id: "uuid",
       user_id: "clerk_user_id",  ← Links to Clerk
       title: "...",
       created_at: now()
     }

6️⃣  Response Returns
   - API returns new idea
   - Frontend updates UI
   - Idea appears in list

7️⃣  Security Maintained
   - Next request for /ideas:
   - auth() still verifies user
   - Supabase queries same user_id
   - Only their ideas shown
```

---

## 🎬 State Flow Diagram

```
┌─────────────┐
│  No Session │
└──────┬──────┘
       │
       ├─→ [User visits app]
       │
       ├─→ middleware.ts checks auth
       │
       └─→ [Not authenticated]
           └─→ Redirect to /sign-in
               │
               ├─→ Clerk Sign In Form
               │   (From @clerk/nextjs)
               │
               ├─→ User enters credentials
               │
               ├─→ Clerk API validates
               │
               └─→ [Authenticated!]
                   ├─→ Session created
                   ├─→ Redirect to /ideas
                   ├─→ middleware.ts: ✓ Authorized
                   ├─→ app/layout ClerkProvider: ✓ Active
                   ├─→ useAuth() hook: ✓ Has userId
                   └─→ API routes: ✓ Can use auth()

                   ├─→ User creates idea
                   │   └─→ POST /api/ideas
                   │       ├─→ auth() → userId
                   │       ├─→ supabase.insert()
                   │       └─→ Saved with user_id
                   │
                   └─→ [User stays signed in]
                       ├─→ session persists
                       ├─→ Can create/read/update data
                       └─→ All queries filtered by userId
```

---

## ✨ Benefits of This Architecture

| Feature | Benefit |
|---------|---------|
| **Clerk** | Secure, modern auth without passwords at scale |
| **Supabase** | Real-time database with RLS for security |
| **Copilot** | AI-powered generation, manual fallback |
| **Combined** | Multi-user safe, scalable, maintainable |

---

## 🚀 Ready to Deploy?

This architecture is production-ready:
- ✅ Secure authentication (Clerk)
- ✅ Row-level security (Supabase RLS)
- ✅ Scalable database (PostgreSQL)
- ✅ Multiple API options (Manual + OpenAI)
- ✅ Type-safe (TypeScript)
- ✅ Middleware protected routes

**See INTEGRATION_SETUP.md for deployment notes.**

---

## 🎓 Next Steps

1. **Understand the Flow**: Re-read this document
2. **Follow QUICKSTART.md**: Get it running locally
3. **Read DEVELOPER_REFERENCE.md**: Learn code patterns
4. **Explore the Code**: Check implementation examples
5. **Build Your Features**: Use the architecture as your foundation

---

## 📞 Questions?

Refer to these files:
- Setup issues? → `INTEGRATION_SETUP.md`
- Code questions? → `DEVELOPER_REFERENCE.md`
- Architecture questions? → This file
- File locations? → `INTEGRATION_FILES.md`

Happy building! 🎉

