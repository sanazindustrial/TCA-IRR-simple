# Security, Authentication, RBAC, and Governance Implementation

## Overview

This document summarizes the security enhancements made to the TCA-IRR platform, covering authentication, role-based access control (RBAC), permission rules, and governance features.

---

## 1. Authentication Security

### 1.1 Account Lockout Protection

**Location:** `backend/app/core/enhanced_security.py`

- **Max Failed Attempts:** 5 attempts before lockout
- **Lockout Duration:** 15 minutes
- **Auto-Reset:** Failed attempt count resets after 30 minutes of inactivity
- **IP Tracking:** Failed attempts track IP addresses for security monitoring

### 1.2 Token Blacklisting (Secure Logout)

**Location:** `backend/app/core/enhanced_security.py`

- Tokens are hashed and stored in blacklist on logout
- Blacklisted tokens are rejected on subsequent requests
- Automatic cleanup of expired tokens

### 1.3 Password Policy Enforcement

**Location:** `backend/app/core/enhanced_security.py`

Requirements:

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (!@#$%^&*()_+-=[]{}|;':\",./<>?)
- Cannot contain username
- Cannot contain email address
- Cannot be a common password (password, 123456, etc.)

### 1.4 Session Management

**Location:** `backend/app/core/enhanced_security.py`

- Maximum 3 concurrent sessions per user
- 30-minute session timeout
- IP and user agent tracking per session
- Oldest session removed when limit exceeded

---

## 2. Role-Based Access Control (RBAC)

### 2.1 User Roles

**Location:** `backend/app/models/schemas.py`

| Role | Description |
|------|-------------|
| `admin` | Full system access |
| `analyst` | Create and edit analyses |
| `reviewer` | Review and approve analyses |
| `user` | Basic read access |

### 2.2 Role Dependencies

**Location:** `backend/app/core/dependencies.py`

```python
require_admin              # Admin only
require_analyst_or_admin   # Analyst or Admin
require_reviewer_or_higher # Reviewer, Analyst, or Admin
require_roles([...])       # Custom role list
```

---

## 3. Permission-Based Access Control

### 3.1 Granular Permissions

**Location:** `backend/app/core/permissions.py`

#### Permission Categories

**User Management:**

- `user:read` - View user profiles
- `user:create` - Create new users
- `user:update` - Update user information
- `user:delete` - Delete users
- `user:manage_roles` - Assign roles

**Company/Evaluation:**

- `company:read` - View companies
- `company:create` - Create companies
- `company:update` - Update companies
- `company:delete` - Delete companies
- `company:export` - Export company data

**Analysis:**

- `analysis:read` - View analyses
- `analysis:create` - Create analyses
- `analysis:update` - Edit analyses
- `analysis:delete` - Delete analyses
- `analysis:approve` - Approve analyses
- `analysis:export` - Export analyses

**Investment:**

- `investment:read/create/update/delete`

**TCA Module:**

- `tca:view` - View TCA module
- `tca:edit` - Edit TCA data
- `tca:configure` - Configure modules

**Admin:**

- `admin:dashboard` - Access admin dashboard
- `admin:logs` - View system logs
- `admin:settings` - Modify settings
- `admin:maintenance` - Maintenance mode
- `admin:audit` - View audit logs

### 3.2 Role-Permission Mapping

| Role | Permissions |
|------|-------------|
| `admin` | All permissions (32 total) |
| `analyst` | 17 permissions (CRUD + export) |
| `reviewer` | 10 permissions (read + approve) |
| `user` | 6 permissions (read only) |

### 3.3 Usage Example

```python
from app.core import require_permission, Permission

@router.get("/companies")
async def list_companies(
    current_user: dict = Depends(require_permission(Permission.COMPANY_READ))
):
    pass
```

---

## 4. Audit Logging

### 4.1 Audit Event Types

**Location:** `backend/app/core/audit.py`

**Authentication Events:**

- `login_success`, `login_failed`, `logout`
- `token_refresh`, `password_change`
- `account_locked`, `account_unlocked`

**User Management:**

- `user_created`, `user_updated`, `user_deleted`
- `user_activated`, `user_deactivated`, `role_changed`

**Data Access:**

- `data_accessed`, `data_created`, `data_updated`
- `data_deleted`, `data_exported`

**Admin/Security:**

- `admin_action`, `system_config_changed`, `maintenance_mode`
- `permission_denied`, `suspicious_activity`, `rate_limit_exceeded`

### 4.2 Audit Log Fields

- Timestamp
- Event type
- User ID & username
- Resource type & ID
- Action details (JSON)
- IP address
- User agent
- Success/failure flag

### 4.3 Audit Retention

- Audit logs: 365 days
- User activity logs: 90 days
- Login attempts: 90 days

---

## 5. Governance Policies

### 5.1 Configuration

**Location:** `backend/app/core/permissions.py`

| Policy | Value |
|--------|-------|
| Audit Log Retention | 365 days |
| User Activity Retention | 90 days |
| Max Concurrent Sessions | 3 |
| Session Timeout | 30 minutes |
| Max Upload Size | 50 MB |
| Analysis Approval Threshold | $1,000,000 |

### 5.2 File Upload Restrictions

Allowed file types:

- `.pdf`, `.xlsx`, `.xls`, `.csv`, `.docx`, `.doc`

### 5.3 MFA Requirements

- Required for: `admin` role
- Future expansion: configurable per role

---

## 6. Database Security Tables

### 6.1 New Tables (Migration Required)

**Location:** `backend/app/db/migrations/002_security_tables.sql`

```sql
-- Run this migration to enable security features
audit_logs          -- Audit trail
token_blacklist     -- Revoked tokens
login_attempts      -- Failed login tracking
user_sessions       -- Active sessions
api_keys            -- Service authentication
```

### 6.2 Added User Columns

```sql
failed_login_attempts  -- Failed attempt counter
locked_until           -- Lockout expiry
password_changed_at    -- Password age tracking
mfa_enabled            -- MFA status
mfa_secret             -- MFA configuration
```

---

## 7. API Security Headers

### 7.1 Backend Headers

**Location:** `backend/app/middleware/error_handling.py`

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

### 7.2 Azure SWA Headers

**Location:** `staticwebapp.config.json`

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Content-Security-Policy": "default-src 'self'; ..."
}
```

---

## 8. Admin Endpoints

### 8.1 New Admin APIs

**Location:** `backend/app/api/v1/endpoints/admin.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/audit-logs` | GET | View audit logs with filters |
| `/admin/security-events` | GET | Security event monitoring |
| `/admin/unlock-account` | POST | Unlock locked accounts |
| `/admin/user-permissions/{role}` | GET | View role permissions |
| `/admin/governance-policies` | GET | View governance config |
| `/admin/system-status` | GET | System health + stats |
| `/admin/maintenance` | POST | Toggle maintenance mode |

---

## 9. Rate Limiting

### 9.1 Current Implementation

**Location:** `backend/app/middleware/error_handling.py`

- Default: 100 requests per minute per IP
- Production: 1000 requests per minute

### 9.2 Role-Based Limits

**Location:** `backend/app/core/dependencies.py`

| Role | Requests/Minute |
|------|-----------------|
| Admin | 1000 |
| Analyst | 500 |
| Reviewer | 200 |
| User | 100 |

---

## 10. Deployment Checklist

### Required Actions

- [ ] Run database migration: `002_security_tables.sql`
- [ ] Configure Azure Key Vault URL
- [ ] Set CORS origins for production
- [ ] Configure admin IP whitelist (optional)
- [ ] Enable MFA for admin users
- [ ] Set up log aggregation for audit logs
- [ ] Configure backup for audit_logs table
- [ ] Test account lockout functionality
- [ ] Verify password policy works on registration

---

## 11. Security Testing

Run the comprehensive test suite:

```bash
python test_auth_stress.py
```

Test coverage:

- ✅ Authentication: Login, logout, token validation
- ✅ Authorization: Role-based access
- ✅ Security: SQL injection, XSS prevention
- ✅ Rate limiting: Request throttling
- ✅ Account lockout: Brute force protection
- ✅ Password policy: Complexity requirements

---

## File Summary

| File | Purpose |
|------|---------|
| `backend/app/core/audit.py` | Audit logging service |
| `backend/app/core/permissions.py` | Permission system + governance |
| `backend/app/core/enhanced_security.py` | Lockout, blacklist, password, sessions |
| `backend/app/db/migrations/002_security_tables.sql` | Security database tables |
| `backend/app/api/v1/endpoints/auth.py` | Enhanced auth endpoints |
| `backend/app/api/v1/endpoints/admin.py` | Admin management APIs |
| `staticwebapp.config.json` | Azure SWA auth + headers |

---

*Generated: February 13, 2026*
