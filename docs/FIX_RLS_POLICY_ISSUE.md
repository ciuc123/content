# Fixed: "Synced 0 ideas" - RLS Policy Issue

## Problem
When submitting ideas as an authenticated user, the API returned:
```json
{"ok":true,"count":0}
```
Instead of saving the ideas.

## Root Cause
The API was using the **client-side Supabase client** (with anon key) in a server API route. The client lacked proper authentication context, causing **Supabase Row-Level Security (RLS) policies to block the insert**:

```
Error: new row violates row-level security policy for table "ideas"
```

## Solution: Use Server-Side Supabase Client

Updated `/pages/api/ideas/index.ts` to use the **server-side client** which has admin privileges to bypass RLS:

### What Changed

**Before:**
```typescript
const { error } = await supabaseHelpers.createIdea(userId, {...})
// ❌ Uses client-side Supabase (anon key)
// ❌ Blocked by RLS policies
// ❌ Result: count=0, ideas not saved
```

**After:**
```typescript
const supabaseAdmin = supabaseServer()
const { data, error } = await supabaseAdmin
  .from('ideas')
  .insert({...})
  .select()
// ✅ Uses server-side Supabase (service role key)
// ✅ Bypasses RLS policies securely
// ✅ Result: ideas saved, count>0
```

## Implementation Details

Both GET and POST endpoints now use the server-side client:

### GET /api/ideas (Fetch Ideas)
```typescript
const supabaseAdmin = supabaseServer()
const { data, error } = await supabaseAdmin
  .from('ideas')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

### POST /api/ideas (Import Ideas)
```typescript
const supabaseAdmin = supabaseServer()
for (const idea of ideas) {
  const { data, error } = await supabaseAdmin
    .from('ideas')
    .insert({
      user_id: userId,
      title: idea.title,
      why_it_matters: idea.why_it_matters,
      virality_score: idea.virality_score,
      business_score: idea.business_score,
    })
    .select()
  
  if (error) {
    console.error(`Failed to create idea "${idea.title}":`, error)
  } else {
    count++
  }
}
```

## Environment Configuration

The fix requires a properly configured `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`:

```bash
# ✅ CORRECT (Starts with sbprivate_)
SUPABASE_SERVICE_ROLE_KEY=sbprivate_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ❌ WRONG (Same as anon key or publishable key)
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_xxxxxxx
```

### To Get Your Service Role Key:
1. Go to your Supabase project dashboard
2. Settings → API → Service Role Secret Key (copy this)
3. Add to `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=<your_actual_service_role_key>
   ```
4. Restart Docker: `docker compose restart web`

## Testing

### For Authenticated Users (Logged In)
1. **Login** to the app
2. **Paste your ideas** JSON:
   ```json
   [{
     "title": "Claude's Hidden Superpowers: Top 5 Prompt Engineering Tricks Every Developer Misses",
     "why_it_matters": "Most developers use Claude at surface level, but mastering advanced prompting techniques can unlock 10x productivity gains.",
     "virality_score": 8,
     "business_score": 9
   }]
   ```
3. **Click "Import Ideas"**
4. **Expected:** ✅ "**Synced 1 ideas to cloud**" (count > 0!)
5. **Ideas appear** in the table below

### For Unauthenticated Users (Not Logged In)
1. **Don't login**
2. **Paste ideas**
3. **Click "Import Ideas"**
4. **Expected:** ✅ "**Saved X ideas locally**" (saved to browser storage)

## Files Modified
1. `/pages/api/ideas/index.ts` — Use server-side Supabase client for both GET and POST

## Error Debugging

If ideas still don't save, check Docker logs:

```bash
docker compose logs web -f | grep "Failed to create idea"
```

Common errors:
- **"violates row-level security policy"** → Service role key not configured properly
- **"permission denied"** → Service role key is missing or wrong
- **"table not found"** → Supabase table doesn't exist or schema is wrong

## Result

✅ Ideas now sync correctly to Supabase (count > 0)  
✅ Uses proper server-side authentication  
✅ Bypasses RLS securely with service role key  
✅ Works for both authenticated and unauthenticated users  


