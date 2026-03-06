-- schema/users.sql

-- Enum type for user roles to ensure data consistency
CREATE TYPE user_role AS ENUM ('Admin', 'Reviewer', 'User', 'AI Adopter');

-- Main table for storing user information
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Store hashed passwords, never plaintext
    role user_role NOT NULL DEFAULT 'User',
    avatar_url VARCHAR(1024),
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Inactive', 'Suspended'
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Indexes for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Table for user-specific settings or preferences
CREATE TABLE user_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    monthly_summary_enabled BOOLEAN DEFAULT TRUE
);

-- Table for managing user report quotas
CREATE TABLE report_quotas (
    quota_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    triage_reports_limit INTEGER, -- NULL for unlimited
    dd_reports_limit INTEGER, -- NULL for unlimited
    triage_reports_used INTEGER DEFAULT 0,
    dd_reports_used INTEGER DEFAULT 0,
    cycle_start_date DATE DEFAULT CURRENT_DATE
);

COMMENT ON TABLE users IS 'Stores core user account information, including authentication and roles.';
COMMENT ON COLUMN users.password_hash IS 'Should store a securely hashed password, e.g., using bcrypt or Argon2.';
COMMENT ON TABLE user_settings IS 'Manages individual user preferences like theme and notification settings.';
COMMENT ON TABLE report_quotas IS 'Tracks report usage and limits for non-admin users.';
