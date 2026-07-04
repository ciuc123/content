# Research Workflow Fixes - Complete Implementation

## Changes Summary

### 1. **Non-blocking "Take Further" Selection** ✅
**File:** `app/ideas/page.tsx` (line 165-174)

**What changed:**
- Removed `setTimeout` delay that was causing modal to flash before navigation
- Immediately store selected idea in `sessionStorage` 
- Navigate immediately to `/ideas/research`
- Async background call to PATCH API (fire-and-forget, doesn't block page load)

**Before:**
```typescript
setMessage('✓ Idea selected')
setTimeout(() => router.push('/ideas/research'), 300)
```

**After:**
```typescript
sessionStorage.setItem('selected_idea', JSON.stringify(idea))

// Async background call (fire-and-forget for authenticated users)
if (isSignedIn && idea.id) {
  fetch('/api/ideas', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea_id: idea.id })
  }).catch(() => {})
}

setMessage('✓ Idea selected')
router.push('/ideas/research')
```

**Benefits:**
- ✅ Instant navigation (no delay)
- ✅ Unblocked UI (API calls don't block page load)
- ✅ Non-authenticated users work via localStorage
- ✅ Authenticated users sync to database asynchronously

---

### 2. **Database Status Tracking** ✅
**File:** `pages/api/ideas/index.ts` (line 92-128)

**New PATCH endpoint:**
- Accepts `idea_id` parameter
- Resets all user's ideas to `status: 'new'`
- Sets selected idea to `status: 'researched'`
- Only available to authenticated users
- Returns updated idea object

**Workflow:**
```
Take Further → sessionStorage + background PATCH
                      ↓
            status: 'new' → 'researched'
```

**Response:**
```json
{
  "ok": true,
  "idea": { 
    "id": "uuid",
    "status": "researched",
    ...
  }
}
```

---

### 3. **Research Page - Immediate Display** ✅
**File:** `app/ideas/research/page.tsx` (line 16-43)

**What changed:**
- **First useEffect:** Checks `sessionStorage` first for immediate display (non-blocking)
- **Second useEffect:** Loads all ideas from API for authenticated users
- **Sync logic:** If API loads idea with `status: 'researched'`, use that

**Display Priority:**
```
1. Check sessionStorage → Display immediately (no wait)
2. Load ideas from API → Find researched status → Sync
3. Fall back to localStorage (if available)
```

**Before:**
```typescript
useEffect(() => {
  fetch('/api/ideas')
    .then((r) => r.json())
    .then((d) => setIdeas(d.ideas || []))
    .catch(() => setIdeas([]))
}, [])

useEffect(() => {
  const sel = ideas.find((i) => i.status === 'selected')
  if (sel) setSelected(sel)
}, [ideas])
```

**After:**
```typescript
useEffect(() => {
  // Check sessionStorage first for immediate display (non-blocking)
  const stored = sessionStorage.getItem('selected_idea')
  if (stored) {
    try {
      const idea = JSON.parse(stored)
      setSelected(idea)
    } catch (e) {
      console.error('Failed to parse stored idea:', e)
    }
  }

  // Load all ideas from API (for signed-in users)
  if (isSignedIn) {
    fetch('/api/ideas')
      .then((r) => r.json())
      .then((d) => setIdeas(d.ideas || []))
      .catch(() => setIdeas([]))
  }
}, [isSignedIn])

useEffect(() => {
  // If we loaded ideas from API and have one with 'researched' status, sync it
  if (ideas.length > 0 && !selected?.id) {
    const researched = ideas.find((i) => i.status === 'researched')
    if (researched) setSelected(researched)
  }
}, [ideas, selected?.id])
```

**Benefits:**
- ✅ No "No selected idea yet" flash
- ✅ Instant idea display from sessionStorage
- ✅ Background sync with database
- ✅ Works offline (sessionStorage fallback)

---

### 4. **AI Research Generation (Authenticated Only)** ✅
**File:** `app/ideas/research/page.tsx` (line 79-112)

**New Feature:**
- Button only visible to authenticated users
- Calls `/api/ai/agent` with action `generateResearch`
- Passes full idea object to AI
- Extracts research from response structure
- Shows loading state ("⏳ Generating research...")

**UI:**
```
[For Authenticated Users]
✨ Generate Research via AI
  ↓ (click)
[Generating research...]
  ↓ (success)
[✓ Research generated!]
```

**AI Integration:**
```typescript
const res = await fetch('/api/ai/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'generateResearch',
    idea: selected
  })
})
```

---

### 5. **Research Import (Unauthenticated Users)** ✅
**File:** `app/ideas/research/page.tsx` (line 114-143)

**New Feature:**
- Import section only visible to unauthenticated users
- Accept plain text or JSON formatted research
- Auto-parse JSON with `.content` field
- Fall back to plain text if not JSON
- Clear button to reset

**UI:**
```
[For Unauthenticated Users]
📋 Import Pre-Made Research:
[textarea with placeholder]
[Import Research] [Clear]
```

**Supported Formats:**
```json
// Option 1: JSON with content field
{ "content": "# Research\n\n..." }

// Option 2: Plain text
Research content here...
```

---

### 6. **Save Research - Status Update** ✅
**File:** `app/ideas/research/page.tsx` (line 45-77)

**What changed:**
- Added validation: `content.trim()` required
- After successful save, background PATCH to update status to `'generated'`
- Still non-blocking (fire-and-forget for authenticated)
- Clear textarea after save

**Updated Logic:**
```typescript
// Save to research API
const res = await fetch('/api/research', {
  method: 'POST',
  body: JSON.stringify({ index: idx, idea: selected, content })
})

// Update status in background (fire-and-forget)
if (isSignedIn && selected?.id) {
  fetch('/api/ideas', {
    method: 'PATCH',
    body: JSON.stringify({ idea_id: selected.id, status: 'generated' })
  }).catch(() => {})
}
```

**Workflow Timeline:**
```
1. User clicks "Save Research"
2. POST to /api/research (await, show feedback)
3. Fire PATCH to /api/ideas (background, no wait)
4. Show "✓ Research saved. Ready to generate content!"
5. Clear textarea for next use
```

---

## Idea Status Workflow

### Before (Broken)
```
"Take Further" (no status update) 
    ↓
Research page looks for status: 'selected'
    ↓
Not found in DB (was stored in sessionStorage)
    ↓
"No selected idea yet" message
```

### After (Fixed)
```
"Take Further" (sessionStorage + async PATCH)
    ↓
Research page reads from sessionStorage immediately
    ↓
Shows idea while database updates in background
    ↓
status: 'new' → 'researched' → 'generated'
```

---

## User Authentication Scenarios

### Scenario A: Authenticated User
```
1. Generate Ideas (AI)
   ↓
2. Take Further (sessionStorage + PATCH status→researched)
   ↓
3. Generate Research via AI (button visible)
   ↓
4. Save Research (PATCH status→generated)
   ↓
5. Generate Content
```

**Status Progression:**
- New ideas: `status: 'new'`
- Selected for research: `status: 'researched'`
- Research saved: `status: 'generated'`
- Content published: `status: 'published'`

### Scenario B: Unauthenticated User
```
1. Import Ideas (manual paste)
   ↓
2. Take Further (sessionStorage only, no PATCH)
   ↓
3. Import Pre-Made Research (button visible)
   ↓
4. Save Research (no PATCH, localStorage only)
   ↓
5. Generate Content (manual paste)
```

**All data stored in browser's localStorage**

---

## Testing Checklist

### ✅ Non-blocking Selection
- [ ] Click "Take Further" on an idea
- [ ] Modal shows green (idea selected)
- [ ] Navigates immediately to research page
- [ ] Selected idea displays (no flash of "No selected idea yet")
- [ ] Research page loads idea from sessionStorage

### ✅ Authenticated AI Generation
- [ ] Sign in to app
- [ ] Generate ideas with AI
- [ ] Click "Take Further"
- [ ] Navigate to research page
- [ ] Click "✨ Generate Research via AI"
- [ ] Research textarea auto-populates
- [ ] Click "Save Research"
- [ ] Message shows "✓ Research saved. Ready to generate content!"

### ✅ Unauthenticated Import
- [ ] Don't sign in (or use private window)
- [ ] Import ideas manually (paste JSON)
- [ ] Click "Take Further"
- [ ] Research page shows "📋 Import Pre-Made Research" section
- [ ] Paste research content
- [ ] Click "Import Research"
- [ ] Research textarea auto-populates
- [ ] Click "Save Research"

### ✅ Background Status Updates
- [ ] Open browser DevTools → Network tab
- [ ] Click "Take Further"
- [ ] Observe PATCH request to `/api/ideas` (should complete quickly)
- [ ] Request should be background (doesn't block page load)

### ✅ Session Persistence
- [ ] Go to Ideas page
- [ ] Click "Take Further"
- [ ] Refresh page or open `/ideas/research` directly
- [ ] Idea should still be selected (from sessionStorage)

---

## Technical Details

### Files Modified
1. `app/ideas/page.tsx` - Non-blocking selection
2. `pages/api/ideas/index.ts` - PATCH endpoint for status updates
3. `app/ideas/research/page.tsx` - Immediate display, AI generation, import

### New Endpoints
- `PATCH /api/ideas` - Update idea status to 'researched' or 'generated'

### Behavior Changes
- **No more delays** on "Take Further" button
- **Instant display** on research page (sessionStorage)
- **Background sync** to database (fire-and-forget)
- **Auth-aware UI** (AI button for authenticated, import for unauthenticated)
- **Non-blocking** architecture (page loads while API calls execute)

### Browser Storage Strategy
- **sessionStorage** - Immediate display of selected idea
- **localStorage** - Fallback for unauthenticated users
- **Supabase** - Source of truth for authenticated users (async updates)

---

## Next Steps

1. **Test authenticated workflow** (sign in, generate ideas, take further, generate research)
2. **Test unauthenticated workflow** (don't sign in, import ideas, take further, import research)
3. **Verify background PATCH calls** (DevTools Network tab)
4. **Check Supabase for status updates** (after completing workflow)
5. **Test content generation page** (should find selected research from generate page)

