-- Migration: 003_add_admin_flag.sql
-- Description: Add admin flag to users table for admin access control
-- Created: 2026-06-30
-- Purpose: Enable admin dashboard and admin-only endpoints
-- Add admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
-- Create index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
-- Verification query (run after to confirm the change)
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
