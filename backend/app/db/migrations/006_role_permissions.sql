-- Role Permissions and Configurations Migration
-- Stores editable role settings instead of hardcoded values

-- Role Configurations Table
CREATE TABLE IF NOT EXISTS role_configurations (
    id SERIAL PRIMARY KEY,
    role_key VARCHAR(50) NOT NULL UNIQUE,  -- 'admin', 'analyst', 'user'
    label VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'User',
    color VARCHAR(50) NOT NULL DEFAULT 'text-gray-600',
    bg_color VARCHAR(50) NOT NULL DEFAULT 'bg-gray-100',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role Permissions Table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_key VARCHAR(50) NOT NULL REFERENCES role_configurations(role_key) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_key, permission_name)
);

-- Role Limits Table
CREATE TABLE IF NOT EXISTS role_limits (
    id SERIAL PRIMARY KEY,
    role_key VARCHAR(50) NOT NULL UNIQUE REFERENCES role_configurations(role_key) ON DELETE CASCADE,
    triage_reports INTEGER,          -- NULL means unlimited
    dd_reports INTEGER,              -- NULL means unlimited
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_configurations_role_key ON role_configurations(role_key);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_key ON role_permissions(role_key);
CREATE INDEX IF NOT EXISTS idx_role_limits_role_key ON role_limits(role_key);

-- Insert default role configurations
INSERT INTO role_configurations (role_key, label, icon, color, bg_color) VALUES
    ('admin', 'Administrator', 'Shield', 'text-red-600', 'bg-red-50'),
    ('analyst', 'Analyst', 'LineChart', 'text-blue-600', 'bg-blue-50'),
    ('user', 'Standard User', 'User', 'text-gray-600', 'bg-gray-50')
ON CONFLICT (role_key) DO NOTHING;

-- Insert default permissions for Admin
INSERT INTO role_permissions (role_key, permission_name, description, is_enabled) VALUES
    ('admin', 'Full System Access', 'Complete access to all features', TRUE),
    ('admin', 'User Management', 'Can create, edit, and delete users', TRUE),
    ('admin', 'Module Configuration', 'Can modify analysis modules', TRUE),
    ('admin', 'Export Data', 'Can export reports and data', TRUE),
    ('admin', 'View Reports', 'Can view all reports', TRUE),
    ('admin', 'Run Analysis', 'Can execute triage and DD analysis', TRUE)
ON CONFLICT (role_key, permission_name) DO NOTHING;

-- Insert default permissions for Analyst
INSERT INTO role_permissions (role_key, permission_name, description, is_enabled) VALUES
    ('analyst', 'Run DD Analysis', 'Can execute deep dive analysis', TRUE),
    ('analyst', 'Run Triage Analysis', 'Can execute triage analysis', TRUE),
    ('analyst', 'View Reports', 'Can view assigned reports', TRUE),
    ('analyst', 'Export Data', 'Can export own reports', TRUE),
    ('analyst', 'User Management', 'Can manage users', FALSE),
    ('analyst', 'Module Configuration', 'Can modify analysis modules', FALSE)
ON CONFLICT (role_key, permission_name) DO NOTHING;

-- Insert default permissions for User
INSERT INTO role_permissions (role_key, permission_name, description, is_enabled) VALUES
    ('user', 'Run Triage Analysis', 'Can execute triage analysis', TRUE),
    ('user', 'View Reports', 'Can view own reports only', TRUE),
    ('user', 'Run DD Analysis', 'Can execute deep dive analysis', FALSE),
    ('user', 'Export Data', 'Can export data', FALSE),
    ('user', 'User Management', 'Can manage users', FALSE),
    ('user', 'Module Configuration', 'Can modify analysis modules', FALSE)
ON CONFLICT (role_key, permission_name) DO NOTHING;

-- Insert default limits
INSERT INTO role_limits (role_key, triage_reports, dd_reports) VALUES
    ('admin', NULL, NULL),       -- Unlimited (NULL = Unlimited)
    ('analyst', 50, 10),
    ('user', 10, NULL)           -- 10 triage, No DD access (NULL for limits = 0 when dd not enabled)
ON CONFLICT (role_key) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_role_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS role_configurations_updated_at ON role_configurations;
CREATE TRIGGER role_configurations_updated_at
    BEFORE UPDATE ON role_configurations
    FOR EACH ROW EXECUTE FUNCTION update_role_updated_at();

DROP TRIGGER IF EXISTS role_permissions_updated_at ON role_permissions;
CREATE TRIGGER role_permissions_updated_at
    BEFORE UPDATE ON role_permissions
    FOR EACH ROW EXECUTE FUNCTION update_role_updated_at();

DROP TRIGGER IF EXISTS role_limits_updated_at ON role_limits;
CREATE TRIGGER role_limits_updated_at
    BEFORE UPDATE ON role_limits
    FOR EACH ROW EXECUTE FUNCTION update_role_updated_at();
