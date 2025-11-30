-- Add email and name fields to users table for authentication
-- Migration: 003_add_user_auth_fields
-- Created: 2025-11-23

-- Add email column (unique for login)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Add name column
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Add gender column
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Comments
COMMENT ON COLUMN users.email IS 'User email for authentication';
COMMENT ON COLUMN users.name IS 'User display name';
COMMENT ON COLUMN users.gender IS 'User gender (male/female/other)';

