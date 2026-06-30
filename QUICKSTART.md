# ⚡ Quick Start: Get Running in 15 Minutes

Follow these exact steps to get Supabase, Clerk, and Copilot running.

---

## 🎯 Phase 1: Supabase Setup (5 min)

### 1. Create Supabase Project
```
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub or email
4. Click "New Project"
5. Fill in:
   - Name: ideas-content-engine
   - Password: (choose strong password, save it!)
   - Region: (pick closest to you)
6. Click "Create new project"
7. Wait 2-3 minutes...
```

### 2. Run Database Migrations
```
When your project loads:
1. Click "SQL Editor" in sidebar
2. Click "New Query"
3. Copy entire content from: /migrations/initial.sql
4. Paste into the SQL editor
5. Click "Run" (or Ctrl+Enter)
6. Should see green checkmark ✓
```

### 3. Copy Your Credentials
```
1. Click "Settings" → "API" in sidebar
2. Copy this URL:
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
3. Copy this key (Anon Key):
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJxxx...
4. Copy this key (Service Role Secret):
   SUPABASE_SERVICE_ROLE_KEY = eyJxxx...
5. Save these for next step
```

---

## 🔐 Phase 2: Clerk Setup (5 min)

### 1. Create Clerk Account
```
1. Go to https://clerk.com
2. Click "Sign Up"
3. Create account (use GitHub recommended)
4. Create new application
```

### 2. Get Your Credentials
```
After app creation:
1. Go to "API Keys" tab
2. Copy "Publishable Key":
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_xxxxx
3. Copy "Secret Key":
   CLERK_SECRET_KEY = sk_test_xxxxx
4. Save these for next step
```

### 3. Configure Redirect URLs
```
1. Still in Clerk dashboard
2. Click "Settings" → "URLs"
3. Set these values:
   - Sign-in URL: http://localhost:3000/sign-in
   - Sign-up URL: http://localhost:3000/sign-up
   - After sign-in URL: http://localhost:3000/ideas
   - After sign-up URL: http://localhost:3000/ideas
4. Save
```

---

## 🚀 Phase 3: Configure Your App (3 min)

### 1. Create `.env.local`
```
Create new file: .env.local
(If it exists, just add/update these lines)

Add these lines:

# Supabase (from Phase 1)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Clerk (from Phase 2)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Copilot (default - no setup needed!)
COPILOT_ENABLED=true

# Optional - GitHub (for publishing)
GITHUB_TOKEN=ghp_xxxxx
GITHUB_TARGET_REPO=your_username/your_repo
```

### 2. Enable Supabase in App
```
In .env.local, also add/change:

# Use Supabase for storage
USE_SUPABASE=true

# Load knowledge from Supabase
USE_LOCAL_KNOWLEDGE=false

# Use real Clerk authentication
DEV_AUTH_DISABLED=false
```

---

## ✅ Phase 4: Test Everything (2 min)

### 1. Start Dev Server
```bash
npm run dev
```

You should see:
```
✓ compiled successfully
ready - started server on 0.0.0.0:3000
```

### 2. Visit Your App
```
1. Go to http://localhost:3000
2. You should see home page
3. Click "Get Started"
4. Should redirect to sign-in page
```

### 3. Create Account
```
1. Click "Sign up"
2. Enter email and password
3. Click "Create account"
4. Should be redirected to /ideas
5. You're in! ✅
```

### 4. Test Creating Idea
```
On /ideas page:
1. See "Import Ideas" section
2. Paste this JSON:
   [{"title":"Test Idea","why_it_matters":"Testing"}]
3. Click "Import"
4. You should see idea appear in list
5. Idea should save to Supabase ✅
```

---

## 🎁 Bonus: Test GitHub Copilot

### Manual Mode (Works Out of the Box)
```
1. On /ideas page, click an idea
2. Click "Take Further"
3. Go to /ideas/generate
4. Click "Generate LinkedIn Post"
5. A prompt appears
6. Copy the prompt
7. Go to https://github.com/copilot (in new tab)
8. Paste prompt there
9. Copy Copilot's response
10. Come back to app and paste response
11. Click "Save"
12. Success! ✅
```

### Automatic Mode (Optional)
```
To enable automatic generation:
1. Get OpenAI API key from https://platform.openai.com/api/keys
2. Add to .env.local:
   OPENAI_API_KEY=sk-xxxxx
   COPILOT_USE_OPENAI=true
3. Restart: npm run dev
4. Now "Generate" buttons work automatically!
```

---

## 🔍 Verify Everything Works

### Checklist
- [ ] Dev server running without errors
- [ ] Can visit http://localhost:3000
- [ ] Can sign in with Clerk
- [ ] Can create idea (appears in list)
- [ ] Can see idea in /ideas/research
- [ ] Can generate content (manual or API)

### Test API Endpoint
```bash
# In terminal, run:
curl http://localhost:3000/api/ideas

# Should return JSON with your ideas
```

---

## 🆘 Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL is not set"
```
Solution:
1. Check .env.local exists in project root
2. Verify lines are not commented out
3. Verify URLs are exactly from Supabase
4. Restart: npm run dev
```

### "Sign-in page shows error"
```
Solution:
1. Verify NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is correct
2. Check Clerk Dashboard → Settings → URLs are correct
3. Restart: npm run dev
4. Clear browser cache (Cmd+Shift+R)
```

### "Can't generate ideas"
```
Solution:
1. For manual mode: Just copy/paste (always works)
2. For API mode: Verify OPENAI_API_KEY is valid
3. Try test endpoint:
   curl -X POST http://localhost:3000/api/ai/copilot \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Hello"}'
```

### "Data not saving to Supabase"
```
Solution:
1. Verify USE_SUPABASE=true in .env.local
2. Check tables exist in Supabase SQL Editor
3. Verify SUPABASE_SERVICE_ROLE_KEY is set
4. Check browser console for errors (F12)
```

---

## 📞 Still Stuck?

1. **Check logs:**
   - Look at terminal where you ran `npm run dev`
   - Check browser console (F12)
   - Look for error messages

2. **Re-read setup:**
   - Open INTEGRATION_SETUP.md
   - Find your issue in Troubleshooting section

3. **Compare credentials:**
   - Verify every credential is exactly from dashboard
   - No extra spaces, correct URLs format

4. **Reset if needed:**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules
   npm install
   npm run dev
   ```

---

## ✨ You're Done! 🎉

You now have:
- ✅ Supabase for data storage
- ✅ Clerk for authentication
- ✅ GitHub Copilot for AI generation
- ✅ Full workflow: Create idea → Research → Generate → Publish

**Next steps:**
1. Read DEVELOPER_REFERENCE.md to learn API patterns
2. Explore the app's features
3. Check INTEGRATION_SETUP.md for production setup
4. Start creating awesome content! 🚀

---

## 📚 Full Documentation

For more details, see:
- `INTEGRATION_SETUP.md` - Complete setup guide
- `DEVELOPER_REFERENCE.md` - Code examples
- `INTEGRATION_COMPLETE.md` - What was set up
- `README.md` - Project overview

Happy coding! 💻

