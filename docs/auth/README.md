# AI Authentication & API Key Management

This folder contains documentation for the AI authentication and encrypted API key management implementation.

## Overview

The system implements a two-tier access model:

1. **Unauthenticated Users**: Can access all frontend features (manage ideas, view content) using browser-based localStorage
2. **Authenticated Users**: Can additionally use AI-powered generation features by providing their own API key

## Files

- **IMPLEMENTATION.md** - Detailed implementation guide covering all changes, endpoints, and security considerations

## Key Components

### Frontend Changes
- Disabled AI generation buttons when user is not signed in
- Display "🔒 Sign in to generate" message instead of button functionality
- Users can still view frontend and manage content locally

### Backend Changes

#### Protected Endpoints (`/api/ai/*`)
- Require Clerk authentication
- Return 401 Unauthorized if not signed in
- Require valid API key in user profile
- Decrypt and use user's API key for generation

#### Public Endpoints (`/api/*`)
- Work without authentication
- Use file-based storage for unauthenticated users
- Cloud sync available for authenticated users

### Database
- New `users` table in Supabase with `clerk_id` and encrypted `api_key_encrypted` fields
- Links Clerk user IDs with stored API keys
- Maintains created_at and updated_at timestamps

### Encryption
- Uses Node.js built-in `crypto` module
- AES-256-CBC encryption algorithm
- Keys stored with IV (initialization vector) for decryption
- `ENCRYPTION_KEY` environment variable required

### API Key Management
- New settings page at `/app/settings/api-key`
- Form to input and save API keys securely
- Keys encrypted before sending to backend
- Decrypted on-demand during AI API calls

## Workflow

### For Unauthenticated Users
1. Browse app, see all frontend
2. Input ideas/research using browser
3. Data stored in localStorage
4. AI buttons are disabled
5. Cannot use AI features without signing in

### For Authenticated Users
1. Sign in with Clerk
2. Navigate to settings to add API key
3. Enter their OpenAI (or other provider) API key
4. Key is encrypted and saved to Supabase
5. Can now use all AI generation features
6. Each request:
   - Auth verified via Clerk
   - Key retrieved from Supabase
   - Key decrypted in memory
   - Used for API call
   - Decrypted key never stored or logged

## Security Features

✅ **Encryption at Rest**
- API keys stored encrypted in database
- Uses AES-256-CBC with random IVs
- Encryption key only in environment variables

✅ **Encryption in Transit**
- HTTPS/TLS for all API communication
- Keys encrypted before sending to backend

✅ **Access Control**
- Clerk authentication required for AI endpoints
- User IDs linked to keys in database
- Keys isolated per user

✅ **No Plaintext Logging**
- Errors don't leak key information
- Decrypted keys only exist in memory during request

✅ **Error Handling**
- 401 responses for authentication failures
- Helpful error messages directing to settings

## Testing

Comprehensive unit tests included for:
- Encryption/decryption roundtrips
- Auth middleware behavior
- API endpoint access control
- Frontend button state management
- Error conditions

Run tests:
```bash
npm test -- __tests__/lib/encryption.test.ts
npm test -- __tests__/lib/clerk.test.ts
npm test -- __tests__/api/ai.test.ts
npm test -- __tests__/app/ideas.test.tsx
npm test -- __tests__/app/generate.test.tsx
```

## Environment Variables

Required for this feature:

```bash
# Encryption
ENCRYPTION_KEY=<32-byte hex from: openssl rand -hex 32>

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-key>
CLERK_SECRET_KEY=<your-secret>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## Troubleshooting

### "API key not configured" Error
- User is signed in but no API key saved
- Direct user to `/settings/api-key` to add one

### "Unauthorized - Sign in required" Error
- User not authenticated
- Redirect to `/sign-in`
- Unauthenticated users can still use frontend

### "Failed to decrypt API key" Error
- `ENCRYPTION_KEY` environment variable not set or invalid
- Verify `ENCRYPTION_KEY` in `.env.local`
- Key must be 32-byte hex string

### Buttons Still Showing as Enabled When Logged Out
- Check browser console for `useAuth` hook issues
- Verify Clerk configuration
- Clear browser cache and reload

## Future Improvements

- [ ] API key rotation / expiration
- [ ] Rate limiting per user
- [ ] Usage analytics
- [ ] Multiple API keys per user
- [ ] API key revocation
- [ ] Two-factor authentication for sensitive operations

