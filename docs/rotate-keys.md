# Quick Key Rotation Guide

## GitHub Token (gho_)
```bash
gh auth login
gh auth token
# Copy output → paste in .env.local GITHUB_TOKEN=
```

## Supabase Keys
1. https://app.supabase.com → Settings → API
2. Click **Rotate** for `anon` key → copy
3. Click **Rotate** for `service_role` key → copy
4. Update `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>
```

## Clerk API Key
1. https://dashboard.clerk.com → Settings → API Keys
2. Click **Create a new key** → copy
3. Update `.env.local`:
```bash
CLERK_SECRET_KEY=<new-api-key>
```

## (opt) Encryption Key
```bash
openssl rand -hex 32
# Copy output → paste in .env.local ENCRYPTION_KEY=
```

## Test
```bash
docker compose down
docker compose up --build
# Check for auth/database errors in logs
```

## Commit
```bash
# .env.local is gitignored - DO NOT COMMIT
git status  # Should NOT show .env.local
git log -1  # Verify last commit doesn't include secrets
```

**Last Rotated**: July 4, 2026  
**Next Due**: October 4, 2026 (90 days)
