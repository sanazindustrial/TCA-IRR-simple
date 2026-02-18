# TCA-IRR Bug List — QA Sprint Week 1
## Version 1.0 — February 18, 2026

---

## Summary

| Severity | Found | Fixed | Open |
|----------|-------|-------|------|
| Critical | 3 | 3 | 0 |
| High | 4 | 3 | 1 |
| Medium | 4 | 2 | 2 |
| Low | 1 | 0 | 1 |
| **Total** | **12** | **8** | **4** |

---

## Fixed Bugs

### BUG-AUTH-001 — Register endpoint 500 error [CRITICAL] ✅ FIXED
- **Area:** Authentication
- **Found in:** QA Run 1
- **Root Cause:** Backend used non-existent DB columns (`user_id`, `full_name`, `status` varchar) instead of actual schema (`id` integer auto-increment, `username`, `is_active` boolean)
- **Fix:** Rewrote register to use `INSERT INTO users (username, email, password_hash, role, is_active)`, added `UserResponse.from_db_row()` classmethod
- **File:** main.py (lines ~130–275)

### BUG-AUTH-002 — Login endpoint 500 error [CRITICAL] ✅ FIXED
- **Area:** Authentication
- **Found in:** QA Run 1
- **Root Cause:** Login queried `WHERE status = 'Active'` but column is `is_active` (boolean)
- **Fix:** Changed to `WHERE is_active = true`, used `from_db_row()` mapping
- **File:** main.py (lines ~280–310)

### BUG-AUTH-003 — HTTPException swallowed by generic handler [CRITICAL] ✅ FIXED
- **Area:** Authentication
- **Found in:** QA Run 3
- **Root Cause:** `except Exception` caught `HTTPException` for 409 duplicate email, converting it to 500
- **Fix:** Added `except HTTPException: raise` before generic handler
- **File:** main.py (line ~270)

### BUG-AUTH-004 — Empty password accepted [HIGH] ✅ FIXED
- **Area:** Authentication / Security
- **Found in:** QA Run 5
- **Root Cause:** No password validation — empty string "" was accepted
- **Fix:** Added `@validator('password')` to `UserCreate` model: min 6 chars, non-empty
- **File:** main.py (line ~120)

### BUG-AUTH-005 — Duplicate username causes 500 [HIGH] ✅ FIXED
- **Area:** Authentication
- **Found in:** QA Run 5
- **Root Cause:** `users.username` has UNIQUE constraint; test used hardcoded name
- **Fix:** Backend checks duplicate username before INSERT; test generates unique timestamps
- **Files:** main.py (line ~255), test-comprehensive-qa.js (line ~35)

### BUG-DATA-001 — Uploaded data not stored [HIGH] ✅ FIXED
- **Area:** Data Upload
- **Found in:** QA Run 2
- **Root Cause:** `/text/submit` endpoint didn't map `company_data` or `extracted_text` from request body
- **Fix:** Added field mapping for company_data and extracted_text storage
- **File:** main.py

### BUG-REQ-001 — Request management 500 error [MEDIUM] ✅ FIXED
- **Area:** Request Management
- **Found in:** QA Run 5
- **Root Cause:** `users.id` is integer but `app_requests.user_id` is UUID — type mismatch on INSERT
- **Fix:** Added `uuid.uuid5(uuid.NAMESPACE_DNS, str(current_user['id']))` deterministic conversion; added `AppRequestResponse.from_db_row()` mapping `created_at`→`submitted_at`, `completed_at`→`resolved_at`
- **File:** main.py (lines ~162–191, ~345–405)

### BUG-CORS-001 — CORS headers not returned [MEDIUM] ✅ FIXED
- **Area:** Infrastructure
- **Found in:** QA Run 1
- **Root Cause:** CORS middleware only allowed specific localhost origins; non-browser test had no Origin header
- **Fix:** Changed `allow_origins` to `["*"]`; test sends `Origin: http://localhost:3000`
- **File:** main.py (line ~82)

---

## Open Bugs

### BUG-SEC-001 — XSS payload stored without sanitization [HIGH] 🔴 OPEN
- **Area:** Security
- **Severity:** HIGH
- **Found in:** QA Run 8
- **Description:** Submitting `<script>alert('xss')</script>` as company_name stores the raw HTML in database
- **Risk:** Stored XSS attack if data rendered in browser without escaping
- **Recommended Fix:** Add input sanitization middleware or use `bleach`/`html.escape()` on text inputs
- **Priority for Week 2:** P1

### BUG-DATA-002 — Empty text upload accepted [MEDIUM] 🟡 OPEN
- **Area:** Data Upload
- **Severity:** MEDIUM
- **Found in:** QA Run 8
- **Description:** Uploading with empty text body succeeds (200 OK) instead of returning 400
- **Recommended Fix:** Add validation middleware: reject empty body/empty text fields
- **Priority for Week 2:** P2

### BUG-EDGE-001 — Malformed JSON causes 500 [MEDIUM] 🟡 OPEN
- **Area:** Edge Cases
- **Severity:** MEDIUM
- **Found in:** QA Run 8
- **Description:** Sending `{invalid json}` to POST endpoints returns 500 Internal Server Error instead of 422 Unprocessable Entity
- **Root Cause:** Starlette parses request body before reaching FastAPI validation or custom middleware
- **Recommended Fix:** Custom ASGI middleware wrapping body parsing, or front-end proxy validation
- **Priority for Week 2:** P3

### BUG-EDGE-002 — No max length on company_name [LOW] 🟢 OPEN
- **Area:** Edge Cases
- **Severity:** LOW
- **Found in:** QA Run 8
- **Description:** Company name of 10,000+ characters accepted without validation
- **Recommended Fix:** Add `max_length=255` to Pydantic model fields
- **Priority for Week 2:** P4

---

## Bug Discovery Timeline

| QA Run | Date | Pass/Total | Bugs Found | Bugs Fixed |
|--------|------|-----------|------------|------------|
| Run 1 | Feb 18 | 54/91 | 3 | 0 |
| Run 2 | Feb 18 | 88/116 | 1 | 3 |
| Run 3 | Feb 18 | 97/123 | 1 | 1 |
| Run 4 | Feb 18 | 114/121 | 0 | 1 |
| Run 5 | Feb 18 | 111/116 | 2 | 0 |
| Run 6 | Feb 18 | 118/123 | 0 | 2 |
| Run 7 | Feb 18 | 121/123 | 0 | 1 |
| Run 8 | Feb 18 | 122/123 | 4 | 0 |
| **Total** | | | **12** | **8** |

---

*QA Lead: Automated QA System*
*Last Updated: February 18, 2026*
