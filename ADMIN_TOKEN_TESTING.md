# Quick Testing Guide - Admin GitHub Token

## Pre-requisites
1. Ensure you have `GITHUB_TOKEN` set in `.env.local` (already done)
2. Ensure you're marked as admin in database:
   ```sql
   UPDATE users SET is_admin = true WHERE clerk_id = 'your_clerk_id';
   ```

## Test Sequence

### Test 1: Admin Generation Without API Key (Happy Path)
```
1. docker compose up -d
2. Open http://localhost:3000
3. Sign in as admin user (one with is_admin = true)
4. Navigate to /ideas
5. Enter topic: "AI trends 2024"
6. Click "✨ Generate Ideas"
   
Expected:
- ✅ Ideas generated successfully
- ✅ Uses GITHUB_TOKEN from environment (check container logs for: "Admin user ... using GITHUB_TOKEN")
- ✅ No "API key not configured" error
```

### Test 2: Research Generation
```
1. After generating ideas, click "Take Further" on an idea
2. Go to research page (/ideas/research)
3. Click "✨ Generate Research via AI"
   
Expected:
- ✅ Research generated successfully
- ✅ Same admin token flow works
```

### Test 3: Regular User Cannot Use Admin Token
```
1. Create a new account (not marked as admin)
2. Sign in as this user
3. Go to /ideas
4. Click "✨ Generate Ideas"
   
Expected:
- ❌ Error: "API key not configured - please add one in settings"
- ❌ Regular users cannot access GITHUB_TOKEN
```

### Test 4: Admin with Custom API Key (Override)
```
1. Sign in as admin
2. Go to /settings/api-key
3. Add an OpenAI API key
4. Go to /ideas
5. Click "✨ Generate Ideas"
   
Expected:
- ✅ Ideas generated using OpenAI key (not GITHUB_TOKEN)
- ✅ Custom key takes priority over environment token
```

## Checking Logs

### During Admin Generation
```bash
# Terminal 1: Watch app logs
docker compose logs -f web

# Look for:
# "Admin user user_... using GITHUB_TOKEN from environment"
```

### If Generation Fails
```bash
# Check if Copilot CLI is working
docker compose exec web which copilot
docker compose exec web copilot --version

# Check Copilot boot logs
docker compose logs copilot_boot
```

## Database Check

### Verify Admin Status
```bash
docker compose exec db psql -U ideas -d ideas_dev -c "SELECT id, clerk_id, is_admin FROM users LIMIT 10;"
```

### Mark User as Admin (if needed)
```bash
# Get your clerk_id from the app (in network tab or browser console)
docker compose exec db psql -U ideas -d ideas_dev -c "UPDATE users SET is_admin = true WHERE clerk_id = 'user_...';"

# Verify
docker compose exec db psql -U ideas -d ideas_dev -c "SELECT id, clerk_id, is_admin FROM users WHERE is_admin = true;"
```

## Troubleshooting

### "API key not configured" for admin user
1. Check Supabase connection:
   ```bash
   docker compose logs web | grep -i supabase
   ```
2. Verify admin flag is set:
   ```bash
   docker compose exec db psql -U ideas -d ideas_dev -c "SELECT clerk_id, is_admin FROM users WHERE clerk_id = 'your_id';"
   ```
3. Restart web service:
   ```bash
   docker compose restart web
   ```

### "Copilot CLI failed"
1. Check Copilot CLI is installed:
   ```bash
   docker compose exec web which copilot
   docker compose exec web ls -la /usr/local/bin/copilot
   ```
2. Check Copilot boot logs for authentication issues:
   ```bash
   docker compose logs copilot_boot | tail -50
   ```

### Empty response from Copilot
1. Try simpler prompt: "Generate 3 ideas about pizza"
2. Check container memory: `docker stats`
3. Check Copilot stderr in logs: `docker compose logs web | grep copilot-stderr`

## Success Indicators

After successful generation, you should see:
- ✅ Ideas/research displayed on page
- ✅ "Admin user ... using GITHUB_TOKEN" in logs
- ✅ No error messages
- ✅ Generation completed in 2-10 seconds

## Files Modified
- `lib/clerk.ts` - Admin token fallback
- `lib/ai/providerFactory.ts` - Token detection
- `lib/ai/githubProvider.ts` - Token passing
- `lib/ai/agentProvider.ts` - Token routing

## Rollback (if needed)
```bash
git checkout lib/clerk.ts lib/ai/providerFactory.ts lib/ai/githubProvider.ts lib/ai/agentProvider.ts
docker compose up -d
```

---

Ready to test! 🚀

