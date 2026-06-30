# Implementation Summary: AI Auth & Encrypted API Keys

## Changes Implemented

### 1. Frontend Changes
**Disabled AI buttons for unauthenticated users:**
- `/app/ideas/page.tsx` - "Generate Ideas" button disabled when not signed in
- `/app/ideas/generate/page.tsx` - All three "Generate via AI" buttons disabled when not signed in

### 2. Database
**Created new Supabase migration:**
- `/migrations/002_users_table.sql` - Added `users` table with:
  - `clerk_id` (unique, links to Clerk user)
  - `api_key_encrypted` (stores encrypted API key)
  - `created_at`, `updated_at` timestamps

### 3. Encryption Library
**Created `/lib/encryption.ts`:**
- Uses Node.js `crypto` module (no external dependencies needed)
- AES-256-CBC encryption/decryption
- Requires `ENCRYPTION_KEY` environment variable (generate with `openssl rand -hex 32`)

### 4. API Key Settings Page
**Created `/app/settings/api-key/page.tsx`:**
- Form for authenticated users to input and save API keys
- Toggle to show/hide API key
- Encrypted before sending to backend

### 5. API Key Endpoint
**Created `/pages/api/settings/api-key.ts`:**
- POST endpoint to save encrypted API key to Supabase
- Creates or updates user record with clerk_id linking
- Returns 401 if not authenticated

### 6. Authentication Middleware
**Updated `/lib/clerk.ts`:**
- Added `withAIAuth()` middleware function
- Validates user is signed in (returns 401 if not)
- Retrieves and decrypts user's API key from Supabase
- Passes decrypted key to handler
- Falls back to helpful error message if no key configured

### 7. Protected AI Endpoints
**Updated to use `withAIAuth` wrapper:**
- `/pages/api/ai/generate.ts` - Protected, uses user's API key
- `/pages/api/ai/agent.ts` - Protected, uses user's API key
- `/pages/api/ai/copilot.ts` - Protected, uses user's API key (not env vars)

### 8. Provider Factory Updates
**Updated `/lib/ai/providerFactory.ts`:**
- Now accepts optional `apiKey` parameter
- Passes user's API key to OpenAI provider
- Removed singleton caching for per-user keys

**Updated `/lib/ai/agentProvider.ts`:**
- Constructor accepts optional `apiKey` parameter
- `getAgentProvider()` creates new instance when apiKey provided (no caching)
- Uses cached instance when apiKey not provided

### 9. Frontend API Endpoints (Unauthenticated Access)
**Updated to allow unauthenticated reads:**
- `/pages/api/ideas/index.ts` - Returns empty array for unauthenticated users
- `/pages/api/research/index.ts` - Returns file-based data for unauthenticated users
- `/pages/api/generated/index.ts` - Returns file-based data for unauthenticated users
- POST operations still require authentication for cloud sync

## Flow

### Unauthenticated User
1. Views frontend, inputs content
2. Uses browser localStorage for data persistence
3. Can see all frontend pages and content
4. AI generation buttons are disabled with "🔒 Sign in to generate" label
5. If they click the button, nothing happens (disabled)

### Authenticated User
1. Signs in with Clerk
2. Navigates to `/settings/api-key`
3. Inputs their OpenAI API key
4. Key is encrypted and stored in Supabase `users` table
5. Can now use AI generation features
6. Each AI request:
   - Authenticates user via Clerk
   - Retrieves encrypted key from Supabase
   - Decrypts key in memory
   - Uses key for API call
   - Key is never logged or stored in plaintext

## Environment Variables Required

```bash
ENCRYPTION_KEY=<32-byte hex string from openssl rand -hex 32>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
CLERK_SECRET_KEY=<your-clerk-secret>
```

## Security Notes

- API keys are encrypted with AES-256-CBC before storage
- Encryption key is stored in environment variables only
- Keys are decrypted on-demand during request handling
- Decrypted keys only exist in memory during request duration
- No plaintext API keys in database or logs
- 401 responses for unauthorized AI requests
- Each user's key is isolated and user_id-scoped

## Testing

```bash
# Test unauthenticated AI endpoint (should return 401)
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'

# Response: {"error":"Unauthorized - Sign in required"}

# Test unauthenticated frontend endpoint (should return success)
curl http://localhost:3000/api/ideas

# Response: {"ideas":[]}
```

