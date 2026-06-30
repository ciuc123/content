# Quick Reference - AI Authentication Implementation

## For Developers

### Key Files Changed

**Frontend (UI)**
```
app/ideas/page.tsx               # "Generate Ideas" button disabled when unsigned
app/ideas/generate/page.tsx      # AI buttons (LinkedIn/Blog/Newsletter) disabled when unsigned
app/settings/api-key/page.tsx    # NEW - Settings page for API key input
```

**Backend (Auth & Encryption)**
```
lib/encryption.ts                # NEW - AES-256-CBC encryption library
lib/clerk.ts                      # NEW withAIAuth() middleware
lib/ai/providerFactory.ts        # Updated - accepts apiKey parameter
lib/ai/agentProvider.ts          # Updated - accepts apiKey parameter
```

**API Endpoints**
```
pages/api/ai/generate.ts         # Protected with withAIAuth
pages/api/ai/agent.ts            # Protected with withAIAuth
pages/api/ai/copilot.ts          # Protected with withAIAuth (uses user's key)
pages/api/settings/api-key.ts    # NEW - Save encrypted API key
pages/api/ideas/index.ts         # Modified - allow public read
pages/api/research/index.ts      # Modified - allow public read
pages/api/generated/index.ts     # Modified - allow public read
```

**Database**
```
migrations/002_users_table.sql   # NEW - stores encrypted API keys
```

**Tests**
```
__tests__/lib/encryption.test.ts    # NEW
__tests__/lib/clerk.test.ts         # NEW
__tests__/api/ai.test.ts            # NEW
__tests__/app/ideas.test.tsx        # NEW
__tests__/app/generate.test.tsx     # NEW
```

## How It Works

### Unauthenticated User Flow
```
User → Browse App → See AI Buttons Disabled
                  → Input Content → Save to localStorage
                  → No AI Access
```

### Authenticated User Flow
```
User → Sign In → Go to /settings/api-key
             → Enter OpenAI Key → Encrypted & Saved to Supabase
             → Browse App → AI Buttons Enabled
             → Use AI Features → Key Retrieved & Decrypted per Request
```

## Environment Variables

```bash
# Required
ENCRYPTION_KEY=<from: openssl rand -hex 32>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-key>
CLERK_SECRET_KEY=<your-secret>
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- __tests__/lib/encryption.test.ts
npm test -- __tests__/lib/clerk.test.ts
npm test -- __tests__/api/ai.test.ts
npm test -- __tests__/app/ideas.test.tsx
npm test -- __tests__/app/generate.test.tsx

# Test endpoints manually
curl http://localhost:3000/api/ideas                    # 200 ✅
curl -X POST http://localhost:3000/api/ai/generate \
  -d '{"prompt":"test"}'                               # 401 ✅
```

## Common Tasks

### Add New AI Endpoint
1. Create handler function
2. Wrap with `withAIAuth(handler)` in export
3. Add `withAIAuth` import from `/lib/clerk`
4. Endpoint automatically validates auth + retrieves/decrypts key
5. Handler receives `userId` and `apiKey` parameters

Example:
```typescript
import { withAIAuth } from '../../../lib/clerk'

const handler = async (req, res, userId, apiKey) => {
  // apiKey is decrypted and ready to use
  // userId is the Clerk user ID
}

export default withAIAuth(handler)
```

### Test Auth Flow Locally
1. Docker running: `docker-compose up -d`
2. Open http://localhost:3000
3. Sign in with Clerk (test credentials)
4. Go to `/settings/api-key`
5. Enter test API key: `sk-test-12345`
6. Go to `/ideas/generate`
7. AI buttons should now be enabled
8. Tests should show decrypted key working

### Debug Encryption Issues
```typescript
// Manual test
import { encryptString, decryptString } from './lib/encryption'

const key = 'sk-proj-test'
const encrypted = encryptString(key)        // sk_hash:data
const decrypted = decryptString(encrypted)  // sk-proj-test
console.log(key === decrypted)              // true ✅
```

### Add Protected Endpoint
```typescript
// pages/api/ai/new-feature.ts
import { withAIAuth } from '../../../lib/clerk'

const handler = async (req, res, userId, apiKey) => {
  if (req.method !== 'POST') return res.status(405).end()
  
  // Call AI provider with user's apiKey
  // Always returns 401 if:
  // - User not signed in
  // - User has no API key configured
}

export default withAIAuth(handler)
```

## Troubleshooting

### Button Still Enabled When Logged Out?
- Clear browser cache: `Cmd+Shift+R` or `Ctrl+Shift+R`
- Check Clerk config in env
- Verify `useAuth()` hook is called

### "Unauthorized - Sign in required" Error?
- User needs to sign in first
- Redirect to `/sign-in` if not authenticated

### "API key not configured" Error?
- User is signed in but hasn't added API key
- Direct to `/settings/api-key`

### Encryption Errors?
- Check `ENCRYPTION_KEY` is 32-byte hex: `openssl rand -hex 32`
- Verify it's in `.env.local`
- Restart Docker: `docker-compose restart web`

## Documentation Links

- Overview: `/docs/README.md`
- Auth Features: `/docs/auth/README.md`
- Implementation Details: `/docs/auth/IMPLEMENTATION.md`
- Completion Status: `/docs/auth/COMPLETION_SUMMARY.md`
- Full Checklist: `/docs/auth/CHECKLIST.md`

## Key Concepts

**withAIAuth Middleware**
- Validates user via Clerk
- Fetches encrypted key from Supabase
- Decrypts in memory (never stored)
- Passes both `userId` and `apiKey` to handler
- Returns 401 if any step fails

**Encryption Strategy**
- AES-256-CBC (Node.js built-in crypto)
- Random IV per encryption
- IV stored with data (IV:DATA format)
- Key only in environment
- Decryption on-demand only

**Two-Tier Model**
- **No Auth**: Frontend features only (localStorage)
- **Auth**: All features including AI (cloud + AI)

## Performance Notes

- Provider instances cached when no apiKey
- New instances per request when apiKey provided
- Encryption/decryption minimal overhead
- Database queries cached via Supabase
- No external dependencies for crypto

## Security Checklist

- [x] Keys encrypted at rest
- [x] Keys decrypted in memory only
- [x] No plaintext in logs
- [x] Per-user key isolation
- [x] Proper error responses (no leaks)
- [x] HTTPS required for deployment
- [x] Environment-based config
- [x] Clerk auth integration

