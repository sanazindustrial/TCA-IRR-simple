# TCA-IRR QA Test Plan
## Version 1.0 — February 18, 2026

---

## 1. Objective

Validate the TCA-IRR Investment Risk Rating Application's backend API functionality, data integrity, security posture, and 9-module analysis engine accuracy through automated testing covering 10 functional areas.

## 2. Scope

### In Scope
- Backend API endpoints (FastAPI)
- Authentication & authorization (JWT-based)
- Data upload and storage precision
- 9-module analysis engine scoring accuracy
- Report generation (Triage + Due Diligence)
- Request management CRUD operations
- Edge cases and error handling
- Security testing (SQL injection, XSS, path traversal)
- Comparative analysis (strong vs weak client differentiation)
- Database integrity checks

### Out of Scope
- Frontend UI testing (Next.js components)
- Load/stress testing beyond 5 concurrent requests
- Browser compatibility testing
- Mobile responsiveness testing
- Third-party API integrations

## 3. Test Environment

| Component | Detail |
|-----------|--------|
| Backend | FastAPI + Uvicorn (Python 3.12) |
| Database | Azure PostgreSQL 17.7 |
| DB Host | tca-irr-server.postgres.database.azure.com |
| DB Name | tca_platform (22 tables) |
| Test Runner | Node.js v22.17.0 (native fetch) |
| Test File | test-comprehensive-qa.js (1,192 lines) |
| API Target | http://localhost:8000 |

## 4. Test Areas

| Area | Description | Test Cases | Priority |
|------|-------------|------------|----------|
| 1 | Environment & Infrastructure | 12 | Critical |
| 2 | Authentication & Authorization | 12 | Critical |
| 3 | Data Upload & Storage Precision | 19 | Critical |
| 4 | 9-Module Analysis Engine | 30 | Critical |
| 5 | Report Generation | 7 | High |
| 6 | Request Management | 2 | Medium |
| 7 | Edge Cases & Error Handling | 6 | Medium |
| 8 | Security Testing | 5 | High |
| 9 | Comparative Analysis | 7 | High |
| 10 | Cleanup & Integrity | 12 | Medium |
| **Total** | | **123** | |

## 5. Entry / Exit Criteria

### Entry Criteria
- Backend server is running and healthy
- Database is connected with ≥ 20 tables
- Node.js 18+ is available
- Network access to Azure PostgreSQL

### Exit Criteria
- All Critical/High test areas pass ≥ 95%
- No CRITICAL bugs remain unfixed
- All 9 analysis modules return valid scores
- Test report JSON is generated

## 6. Test Data

### Strong Client (QA_TestCorp_Alpha)
```json
{
  "revenue": 750000, "mrr": 62500, "burn_rate": 110000,
  "runway_months": 18, "gross_margin": 72, "customers": 95,
  "nrr": 130, "mom_growth": 15, "team_size": 35,
  "tam": "$12B", "sam": "$3B", "som": "$600M",
  "founders": 2, "patents": true, "trl": 8
}
```

### Weak Client (Weak_Startup)
```json
{
  "revenue": 15000, "mrr": 1250, "burn_rate": 30000,
  "runway_months": 4, "gross_margin": 25, "customers": 5,
  "nrr": 80, "mom_growth": 2, "team_size": 2
}
```

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| DB schema changes | Medium | High | Automated schema checks |
| Auth token expiry during tests | Low | Medium | Fresh token per run |
| Network latency to Azure DB | Low | Low | 30s timeout thresholds |
| Test data pollution | Medium | Medium | Cleanup area (Area 10) |

## 8. Execution

```bash
# Prerequisites
npm install   # (no dependencies needed — uses native fetch)

# Start backend
.venv/Scripts/python.exe main.py

# Run tests
node test-comprehensive-qa.js

# Output
# Console: Real-time pass/fail with scores
# File: test-qa-report.json
```

## 9. Deliverables

- [x] test-comprehensive-qa.js — Automated test suite
- [x] test-qa-report.json — Machine-readable results
- [x] QA_STATUS_REPORT.md — Human-readable status report
- [x] QA_TEST_PLAN.md — This document
- [x] QA_BUG_LIST.md — Bug tracking document

---

*Approved by: QA Lead*
*Date: February 18, 2026*
