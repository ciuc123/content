# Database Migrations

## Overview

All database schema changes are managed through versioned SQL migrations in `/migrations`. This ensures consistency between local development, testing, and production (Supabase) environments.

## Current Migrations

| # | Name | Description | Status | Date |
|---|------|-------------|--------|------|
| 001 | initial.sql | Ideas, research, generated_content tables | ✅ Applied | 2026-06-15 |
| 002 | 002_users_table.sql | Users table with Clerk integration | ✅ Applied | 2026-06-28 |
| 003 | 003_add_admin_flag.sql | Admin flag for user management | ⏳ Ready | 2026-06-30 |

## Quick Start

### For You (Admin Setup)

1. **Apply migration 003 to Supabase:**
   - Go to https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new
   - Paste this SQL:
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
   CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
   ```
   - Click **Run**

2. **Find your Clerk User ID:**
   - Go to Supabase SQL Editor
   - Run this:
   ```sql
   SELECT clerk_id, created_at FROM users ORDER BY created_at DESC LIMIT 1;
   ```
   - Copy your `clerk_id` (looks like `user_XXXXX`)

3. **Make yourself admin:**
   - In Supabase SQL Editor, run:
   ```sql
   UPDATE users SET is_admin = true WHERE clerk_id = 'user_YOUR_ID_HERE';
   ```

4. **Access admin panel:**
   - Visit `/admin` in your app
   - You should see stats and setup instructions

## Migration Details

### 001_initial.sql
Creates core content tables.

**Tables:**
- `ideas` - Content ideas with scores
- `research` - Research data
- `generated_content` - AI-generated variants

**Indexes:**
- `idx_research_idea` - Fast idea lookups
- `idx_gen_content_idea` - Fast content lookups

### 002_users_table.sql
Links Clerk authentication to user profiles.

**Table:**
- `users` - Stores clerk_id, encrypted API keys, timestamps

**Columns:**
- `id` - UUID primary key
- `clerk_id` - Link to Clerk (unique)
- `api_key_encrypted` - AES-256-CBC encrypted OpenAI key
- `created_at` / `updated_at` - Timestamps

**Index:**
- `idx_users_clerk_id` - Fast lookup by clerk_id

### 003_add_admin_flag.sql
Enables admin features and role-based access control.

**Changes:**
- Adds `is_admin` boolean column (default: false)
- Creates index on `is_admin`

**Usage:**
```sql
UPDATE users SET is_admin = true WHERE clerk_id = 'user_ID';
```

## How to Apply Migrations

### Step 1: Test Locally (Optional)

```bash
# Apply to Docker PostgreSQL
docker-compose exec db psql -U ideas -d ideas_dev < migrations/003_add_admin_flag.sql

# Verify
docker-compose exec db psql -U ideas -d ideas_dev -c "SELECT column_name FROM information_schema.columns WHERE table_name='users';"
```

### Step 2: Apply to Supabase

1. Open https://app.supabase.com/project/YOUR_PROJECT_ID
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy & paste the migration SQL
5. Click **Run**

### Step 3: Verify

Run in Supabase SQL Editor:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' ORDER BY ordinal_position;
```

## Creating New Migrations

### Naming Convention

```
NNN_description.sql

NNN = Sequential number (001, 002, 003, etc.)
description = What changed
```

Examples:
- `004_add_user_indexes.sql`
- `005_add_rls_policies.sql`

### Template

```sql
-- Migration: NNN_description.sql
-- Description: What this migration does
-- Created: 2026-06-30

-- Your SQL changes here
ALTER TABLE ...
CREATE INDEX ...

-- Verification query (optional)
-- SELECT ... FROM ...
```

## Rollback Strategy

**IMPORTANT:** Never modify existing migration files!

If you need to revert changes:
1. Create a NEW migration file
2. Write SQL to undo the previous changes
3. Apply the new migration

Example:
```sql
-- migrations/004_rollback_admin_flag.sql
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;
DROP INDEX IF EXISTS idx_users_is_admin;
```

## Best Practices

✅ **DO:**
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Keep migrations focused and small
- Test locally before applying to Supabase
- Document each migration clearly
- Commit migrations to git
- Use descriptive names

❌ **DON'T:**
- Modify existing migration files
- Create large migrations with unrelated changes
- Apply directly without testing
- Delete migration files
- Run migrations outside of the migration system

## Troubleshooting

### Column already exists error
Use `ADD COLUMN IF NOT EXISTS` to make migrations re-runnable

### Index already exists error
Use `CREATE INDEX IF NOT EXISTS` 

### Migration fails on Supabase
1. Check the error message in SQL Editor
2. Verify column names and types
3. Check for conflicts with existing schema
4. Rollback if needed (create new migration)

## Common Admin Tasks

### List all users with admin status
```sql
SELECT clerk_id, is_admin, created_at FROM users ORDER BY created_at DESC;
```

### Give admin to a user
```sql
UPDATE users SET is_admin = true WHERE clerk_id = 'user_ID';
```

### Remove admin from a user
```sql
UPDATE users SET is_admin = false WHERE clerk_id = 'user_ID';
```

### Check if admin column exists
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'is_admin';
```

---

**Last Updated:** 2026-06-30  
**Next Steps:** Plan migration 004 for additional features

