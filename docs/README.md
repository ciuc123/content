# Documentation

Comprehensive documentation for the Ideas Content Engine and its features.

## Folders

### `/auth`
**AI Authentication & API Key Management**

Documentation for the authentication and encryption implementation that restricts AI features to authenticated users with valid API keys.

- `README.md` - Overview and troubleshooting guide
- `IMPLEMENTATION.md` - Detailed technical implementation

### `/architecture`
**System Architecture** (for future consolidation)

### `/features`
**Feature Documentation** (for future consolidation)

## Quick Links

### Getting Started
- See root `/README.md` for quick start guide

### Implementation Details
- See `/docs/auth/IMPLEMENTATION.md` for technical details on auth changes

### Development
- See `DEVELOPMENT.md` in root directory

## Testing

All features have comprehensive unit tests:

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- __tests__/lib/encryption.test.ts
npm test -- __tests__/lib/clerk.test.ts
npm test -- __tests__/api/ai.test.ts
npm test -- __tests__/app/ideas.test.tsx
npm test -- __tests__/app/generate.test.tsx
```

## API Endpoints

### Protected AI Endpoints (Requires Auth)
- `POST /api/ai/generate` - Generate content (LinkedIn, blog, newsletter)
- `POST /api/ai/agent` - Run AI agent (generateIdeas, generateResearch, generateContent, fullWorkflow)
- `POST /api/ai/copilot` - Direct Copilot API integration

### Public Data Endpoints (No Auth Required)
- `GET /api/ideas` - List ideas (empty for unauthenticated users)
- `POST /api/ideas` - Save ideas (requires sign in for cloud sync)
- `GET /api/research` - List research
- `POST /api/research` - Save research
- `GET /api/generated` - List generated content
- `POST /api/generated` - Save generated content

### Settings Endpoints
- `POST /api/settings/api-key` - Save encrypted API key (requires auth)

## Frontend Components

### Pages
- `/ideas` - Idea management (AI button disabled when unsigned)
- `/ideas/research` - Research addition
- `/ideas/generate` - Content generation (AI buttons disabled when unsigned)
- `/publish` - Publishing to GitHub
- `/settings/api-key` - API key management (requires auth)

### Auth Flow
1. User visits app → can use frontend without signing in
2. AI button click → disabled, shows "🔒 Sign in to generate"
3. User signs in → navigates to `/settings/api-key`
4. Enters API key → encrypted and saved
5. Can now use all AI features

## Security

- Clerk authentication for user identity
- Encrypted API keys in Supabase database
- AES-256-CBC encryption with per-key IVs
- `ENCRYPTION_KEY` environment variable protection
- No plaintext keys in logs or storage
- 401 responses for unauthorized AI requests

## Performance

- Encryption/decryption happens only during AI requests
- Cached provider instances for better performance
- File-based storage for unauthenticated users
- Cloud sync optional for authenticated users

## Troubleshooting

For issues related to authentication and API keys, see `/docs/auth/README.md#Troubleshooting`

## Contributing

When adding new AI features:
1. Protect endpoints with `withAIAuth` middleware
2. Add unit tests in `__tests__` folder
3. Update documentation in relevant `/docs` subfolder
4. Ensure frontend buttons are disabled when not signed in

