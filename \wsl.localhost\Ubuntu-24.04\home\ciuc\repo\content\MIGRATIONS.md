# Database Migrations
## Overview
All database schema changes are managed through versioned SQL migrations in `/migrations`. This ensures consistency between local development, testing, and production (Supabase) environments.
## Current Migrations
| # | Name | Description | Status | Date |
|---|------|-------------|--------|------|
| 001 | initial.sql | Ideas, research, generated_content tables | ✅ Applied | 2026-06-15 |
| 002 | 002_users_table.sql | Users table with Clerk integration | ✅ Applied | 2026-06-28 |
| 003 | 003_add_admin_flag.sql | Admin flag for user management | ⏳ Ready | 2026-06-30 |
## Migration Details
### 001_initial.sql
**Tables:**
- `ideas` - Content ideas with virality/business scores
- `research` - Research data linked to ideas
- `generated_content` - AI-generated content variants
**Indexes:**
- `idx_research_idea` - Fast lookups by idea_id
- `idx_gen_content_idea` - Fast lookups by idea_id
### 002_users_table.sql
**Purpose:** Store user profiles linked to Clerk authentication
**Table:**
- `users` - Stores clerk_id, encrypted API keys, timestamps
**Columns:**
- `id` - UUID primary key
- `clerk_id` - Link to Clerk user (unique)
- `api_key_encrypted` - AES-256-CBC encrypted OpenAI API key
- `created_at` / `updated_at` - Timestamps
**Indexes:**
- `idx_users_clerk_id` - Fast lookup by clerk_id
**Security:**
- API keys are stored encrypted
- Only decrypted in memory when needed
### 003_add_admin_flag.sql
**Purpose:** Enable admin features and role-based access control
**Changes:**
- Adds `is_admin` boolean column (default: false)
- Creates index on `is_admin` for efficient queries
- No existing data is modified
**Usage:**
```sql
-- Make a user admin
UPDATE users SET is_admin = true WHERE clerk_id = 'user_YOUR_ID';
-- Check admin status
SELECT clerk_id, is_admin FROM users WHERE is_admin = true;
```
## How to Apply Migrations
### Step 1: Create Migration File
```bash
# Create new migration following the naming convention
# Format: NNN_description.sql (e.g., 004_add_rls_policies.sql)
```
### Step 2: Test Locally
```bash
# Apply to Docker PostgreSQL
docker-compose exec db psql -U ideas -d ideas_dev < migrations/003_add_admin_flag.sql
# Verify the change
docker-compose exec db psql -U ideas -d ideas_dev << 'EOF'
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
