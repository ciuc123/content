-- Add admin flag to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

