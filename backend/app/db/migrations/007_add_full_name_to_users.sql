-- Migration: 007_add_full_name_to_users
-- Description: Add full_name column to users table for display name support

ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
