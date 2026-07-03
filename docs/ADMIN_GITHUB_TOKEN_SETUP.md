# Admin GitHub Token Setup - Implementation Complete ✅

## Overview
Admin users can now use GitHub Copilot with the `GITHUB_TOKEN` from `.env.local` **without needing to configure an API key in Settings**.

## How It Works

### Authentication Flow
1. **Admin signs in** → Authentication via Clerk
2. **Clicks "Generate Ideas" or "Generate Research"** → Request hits `withAIAuth` middleware
3. **Middleware checks for API key**:
   - Priority 1: User's encrypted API key from Supabase (if configured in Settings)
   - Priority 2: If admin AND `GITHUB_TOKEN` exists in `.env.local` → Use it automatically
   - Priority 3: Return 401 error "API key not configured"
4. **Generation works** → Uses GitHub Copilot CLI with the token

### For Regular Users
- Still need to configure API key in Settings → API Key page
- Can be OpenAI key, GitHub token, or any supported provider

### For Admin Users
- **Option A (Recommended)**: Do nothing - automatically use project `GITHUB_TOKEN`
- **Option B**: Configure personal API key in Settings (takes priority over project token)

## Files Changed

### 1. `/lib/clerk.ts` - Enhanced `withAIAuth` middleware
**Changes:**
- Query includes `is_admin` field from Supabase
- Added fallback logic: if user is admin and `process.env.GITHUB_TOKEN` exists, use it
- Logs when admin uses environment token

**Key Code:**
```typescript
// Priority 1: Check for user's encrypted API key
if (userRecord.api_key_encrypted) {
  apiKey = decryptString(userRecord.api_key_encrypted)
}

// Priority 2: If no user key and user is admin, use environment GITHUB_TOKEN
if (!apiKey && userRecord.is_admin && process.env.GITHUB_TOKEN) {
  apiKey = process.env.GITHUB_TOKEN
  console.log(`Admin user ${userId} using GITHUB_TOKEN from environment`)
}
```

### 2. `/lib/ai/providerFactory.ts` - Detect GitHub tokens
**Changes:**
- Added GitHub token detection (starts with `gh` or `gho`)
- Route GitHub tokens to GitHubModelsProvider instead of OpenAI
- Allows admins to use Copilot CLI with the token

**Key Code:**
```typescript
const isGitHubToken = apiKey && (apiKey.startsWith('gh') || apiKey.startsWith('gho'))
const useOpenAI = (apiKey || process.env.OPENAI_API_KEY) && !isGitHubToken
```

### 3. `/lib/ai/githubProvider.ts` - Pass token to CLI
**Changes:**
- Added constructor to accept `githubToken` parameter
- Pass token via environment variable to Copilot CLI process

**Key Code:**
```typescript
constructor(githubToken?: string) {
  this.githubToken = githubToken
}

// In spawn() call:
const env = { ...process.env }
if (this.githubToken) {
  env.GITHUB_TOKEN = this.githubToken
}

const child = spawn(cmd, ['-p', fullPrompt], { env })
```

### 4. `/lib/ai/agentProvider.ts` - Route GitHub tokens
**Changes:**
- Added GitHub token detection in constructor
- Direct instantiation of GitHubModelsProvider with token if detected

**Key Code:**
```typescript
const isGitHubToken = apiKey && (apiKey.startsWith('gh') || apiKey.startsWith('gho'))

if (isGitHubToken) {
  this.baseProvider = new GitHubModelsProvider(apiKey)
} else {
  this.baseProvider = getBaseProvider(apiKey)
}
```

## Testing

### Test 1: Admin user with no API key configured
```
1. Sign in as admin user (must have is_admin = true in database)
2. Go to /ideas
3. Click "✨ Generate Ideas"
4. Enter a topic (e.g., "AI trends in 2024")
5. Should generate ideas using GITHUB_TOKEN from environment
```

### Test 2: Admin user with custom API key
```
1. Sign in as admin
2. Go to /settings/api-key
3. Add custom OpenAI API key
4. Go to /ideas
5. Click "✨ Generate Ideas"
6. Should generate using custom key (not GITHUB_TOKEN)
```

### Test 3: Regular user (not admin)
```
1. Sign in as non-admin user
2. Go to /ideas
3. Click "✨ Generate Ideas"
4. Should see error: "API key not configured - please add one in settings"
5. Regular users cannot access environment token
```

## Deployment

### Local Development
Already configured in `.env.local`:
```
GITHUB_TOKEN=gho_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Vercel/Production
1. Set admin flag for your user:
   ```sql
   UPDATE users SET is_admin = true WHERE clerk_id = 'your_clerk_id';
   ```

2. Add to Vercel environment variables:
   ```
   GITHUB_TOKEN=your_github_token
   ```

3. Optional: Add to GitHub environment (if using GitHub deployments):
   - Settings → Environments → Add secret `GITHUB_TOKEN`

## Security Notes

- ✅ Admin token is **only available to admin users** (checked via `is_admin` flag)
- ✅ Token is never stored in Supabase (loaded from environment on each request)
- ✅ Regular users cannot access environment token
- ✅ Users can override with personal keys (takes priority)
- ✅ Token is not exposed to client-side code

## Troubleshooting

### Error: "API key not configured"
**As admin user?**
- ✅ Yes → Check that `GITHUB_TOKEN` is set in `.env.local` or Vercel
- ✅ Yes → Restart Docker: `docker compose restart web`
- ❌ No → This is expected. Go to Settings → API Key to add one

### Error: "Copilot CLI failed"
- Check that Copilot is installed in container: `docker compose exec web which copilot`
- Check Copilot logs: `docker compose logs copilot_boot`
- The Copilot CLI may need authentication (happens in copilot_boot container on startup)

### Generation is slow
- First call: 5-10 seconds (CLI startup)
- Subsequent calls: 2-5 seconds
- This is normal for CLI-based generation

## Next Steps

1. **Mark yourself as admin** (if not already):
   ```sql
   UPDATE users SET is_admin = true WHERE clerk_id = 'your_clerk_id';
   ```

2. **Test generation**:
   - Go to `/ideas` and click "Generate Ideas"
   - Should work without API key configuration

3. **Deploy to Vercel** (when ready):
   - Add `GITHUB_TOKEN` to Vercel environment variables
   - Mark admin users in production database

---

**Status**: ✅ Implementation complete and ready for testing
**Date**: 2026-06-30

