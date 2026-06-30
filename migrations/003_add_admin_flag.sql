-- Add admin flag to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;


-- Policy 1: Authenticated users can only read their own row
CREATE POLICY "Users can read their own data"
ON users
FOR SELECT
               USING (auth.uid()::text = clerk_id);

-- Policy 2: Authenticated users can only update their own row
CREATE POLICY "Users can update their own data"
ON users
FOR UPDATE
               USING (auth.uid()::text = clerk_id)
    WITH CHECK (auth.uid()::text = clerk_id);

-- Policy 3: Admins can read all rows
CREATE POLICY "Admins can read all users"
ON users
FOR SELECT
               USING (
                         EXISTS (
                         SELECT 1 FROM users WHERE clerk_id = auth.uid()::text AND is_admin = true
                         )
                     );