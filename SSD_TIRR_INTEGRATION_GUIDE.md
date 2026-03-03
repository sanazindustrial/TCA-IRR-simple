# SSD Application to TCA TIRR Endpoint — Integration Guide

## Overview

This document describes how to run and test the SSD Application to TCA TIRR integration for automated report generation. The integration enables seamless transfer of startup information from the SSD application to TCA TIRR for processing and 6-page triage report generation.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [API Endpoints](#api-endpoints)
4. [Request Payload Schema](#request-payload-schema)
5. [Response Payloads](#response-payloads)
6. [Running Integration Tests](#running-integration-tests)
7. [Using the Admin UI](#using-the-admin-ui)
8. [Configuration Options](#configuration-options)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Backend Requirements
- Python 3.11+
- PostgreSQL database (Azure PostgreSQL or local)
- Virtual environment with dependencies installed

### Frontend Requirements
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/sanazindustrial/TCA-IRR-simple.git
cd TCA-IRR-simple

# Backend setup
python -m venv .venv
.\.venv\Scripts\activate  # Windows
source .venv/bin/activate # Linux/Mac
pip install -r requirements.txt

# Frontend setup
npm install
```

---

## Quick Start

### 1. Start the Backend Server

```bash
# Windows
.\.venv\Scripts\python.exe main.py

# Linux/Mac
python main.py
```

The server starts at `http://localhost:8000`.

### 2. Start the Frontend (Development)

```bash
npm run dev
```

Frontend available at `http://localhost:3000`.

### 3. Test the Integration

```bash
node test-ssd-tirr-integration.js
```

---

## API Endpoints

### Main SSD TIRR Endpoint

| Property | Value |
|----------|-------|
| **Endpoint** | `POST /api/ssd/tirr` |
| **Content-Type** | `application/json` |
| **Purpose** | Receive startup data from SSD for report generation |

### Status Check Endpoint

| Property | Value |
|----------|-------|
| **Endpoint** | `GET /api/ssd/tirr/{tracking_id}` |
| **Purpose** | Check report generation status and retrieve completed report |

### Audit Log Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ssd/audit/logs` | GET | List all SSD audit logs |
| `/api/ssd/audit/logs/{tracking_id}` | GET | Get specific audit log |
| `/api/ssd/audit/logs/{tracking_id}/request` | GET | Get original request payload |
| `/api/ssd/audit/logs/{tracking_id}/response` | GET | Get callback response payload |
| `/api/ssd/audit/logs/{tracking_id}/report` | GET | Get generated report |
| `/api/ssd/audit/stats` | GET | Get SSD integration statistics |

---

## Request Payload Schema

The SSD application sends a JSON payload with 8 sections. All fields marked with `*` are **mandatory**.

### Section 4.1.1: Contact Information

```json
{
  "contactInformation": {
    "email": "founder@company.com",        // * Required
    "phoneNumber": "+1-555-0123",          // * Required
    "firstName": "John",                    // * Required
    "lastName": "Doe",                      // * Required
    "jobTitle": "CEO",                      // Optional
    "linkedInUrl": "https://linkedin.com/in/johndoe"  // Optional
  }
}
```

### Section 4.1.2: Company Information

```json
{
  "companyInformation": {
    "companyName": "TechStartup Inc.",      // Optional
    "website": "https://techstartup.com",   // Optional
    "industryVertical": "AI",               // * Required
    "developmentStage": "Seed",             // * Required
    "businessModel": "B2B SaaS",            // * Required
    "country": "United States",             // * Required
    "state": "California",                  // * Required
    "city": "San Francisco",                // * Required
    "oneLineDescription": "AI platform",    // * Required
    "companyDescription": "Full desc...",   // * Required
    "productDescription": "Product desc...",// * Required
    "pitchDeckPath": "/docs/pitch.pdf",     // * Required
    "legalName": "TechStartup Inc",         // Optional
    "numberOfEmployees": 12                  // Optional
  }
}
```

### Section 4.1.3: Financial Information

```json
{
  "financialInformation": {
    "fundingType": "Seed",                  // * Required
    "annualRevenue": 250000.00,             // * Required
    "preMoneyValuation": 5000000.00,        // * Required
    "postMoneyValuation": 6500000.00,       // Optional
    "offeringType": "SAFE Note",            // Optional
    "targetRaise": 1500000.00,              // Optional
    "currentlyRaised": 750000.00            // Optional
  }
}
```

### Section 4.1.4: Investor Questions (All Optional)

```json
{
  "investorQuestions": {
    "problemSolution": "Description...",
    "companyBackgroundTeam": "Team info...",
    "markets": "Market analysis...",
    "competitionDifferentiation": "Competitive position...",
    "businessModelChannels": "Distribution...",
    "timeline": "Milestones...",
    "technologyIP": "Patents...",
    "specialAgreements": "Partnerships...",
    "cashFlow": "Financial metrics...",
    "fundingHistory": "Previous rounds...",
    "risksChallenges": "Key risks...",
    "exitStrategy": "Exit plan..."
  }
}
```

### Section 4.1.5: Documents (All Optional)

```json
{
  "documents": {
    "executiveSummaryPath": "/docs/summary.pdf",
    "businessPlanPath": "/docs/plan.pdf",
    "financialProjectionPath": "/docs/projections.pdf",
    "additionalDocumentsPaths": [
      "/docs/extra1.pdf",
      "/docs/extra2.pdf"
    ]
  }
}
```

### Section 4.1.6: Customer Metrics (All Optional)

```json
{
  "customerMetrics": {
    "customerAcquisitionCost": 1200.00,
    "customerLifetimeValue": 18000.00,
    "churn": 5.5,       // Percentage
    "margins": 75.0     // Percentage
  }
}
```

### Section 4.1.7: Revenue Metrics (All Optional)

```json
{
  "revenueMetrics": {
    "totalRevenuesToDate": 450000.00,
    "monthlyRecurringRevenue": 62500.00,
    "yearToDateRevenue": 250000.00,
    "burnRate": 85000.00
  }
}
```

### Section 4.1.8: Market Size (All Optional)

```json
{
  "marketSize": {
    "totalAvailableMarket": 50000000000.00,
    "serviceableAreaMarket": 12000000000.00,
    "serviceableObtainableMarket": 500000000.00
  }
}
```

### Mandatory Fields Summary (17 Total)

| Category | Fields |
|----------|--------|
| Contact | email, phoneNumber, firstName, lastName |
| Company | industryVertical, developmentStage, businessModel, country, state, city, oneLineDescription, companyDescription, productDescription, pitchDeckPath |
| Financial | fundingType, annualRevenue, preMoneyValuation |

---

## Response Payloads

### Immediate Response (202 Accepted)

```json
{
  "status": "accepted",
  "tracking_id": "12d0699a-b6bd-4c05-9cf3-0c5111b03ed4",
  "message": "Report generation started for 'TechStartup Inc.'. Results will be delivered to the SSD callback endpoint."
}
```

### Status Check Response (Processing)

```json
{
  "status": "processing",
  "tracking_id": "12d0699a-b6bd-4c05-9cf3-0c5111b03ed4",
  "message": "Report is still being generated."
}
```

### Status Check Response (Completed)

```json
{
  "status": "completed",
  "tracking_id": "12d0699a-b6bd-4c05-9cf3-0c5111b03ed4",
  "report_file_path": "/reports/tirr_12d0699a-b6bd-4c05-9cf3-0c5111b03ed4.json",
  "report": {
    "report_type": "triage",
    "company_name": "TechStartup Inc.",
    "founder_email": "john.doe@techstartup.com",
    "final_tca_score": 6.8,
    "recommendation": "CONDITIONAL — Address key risks before investing",
    "total_pages": 6,
    // ... full 6-page triage report
  }
}
```

### Callback Response (SSD CaptureTCAReportResponse)

```json
{
  "founderEmail": "john.doe@techstartup.com",
  "generatedReportPath": "/reports/tca/2024/techstartup_inc_tca_report.pdf"
}
```

### Error Response

```json
{
  "error": {
    "code": "REPORT_GENERATION_FAILED",
    "message": "Failed to generate TCA report due to missing required documents",
    "details": {
      "missingFields": ["pitchDeckPath", "businessPlanPath"],
      "timestamp": "2024-02-23T14:30:22Z"
    }
  },
  "founderEmail": "john.doe@techstartup.com"
}
```

---

## Running Integration Tests

### Full Test Suite

```bash
# Start backend first
.\.venv\Scripts\python.exe main.py

# In another terminal, run tests
node test-ssd-tirr-integration.js
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════
  SSD → TCA TIRR INTEGRATION TEST SUITE
═══════════════════════════════════════════════════════════

▶ TEST 1: HEALTH CHECK
  ✅ 1.1 Backend is running (health 200)
  ✅ 1.2 Database connected (tables: 22)

▶ TEST 2: SUBMIT STARTUP DATA TO TCA TIRR
  ✅ 2.1 Returns 202 Accepted
  ✅ 2.2 Status = accepted
  ✅ 2.3 Tracking ID returned
  ...

═══════════════════════════════════════════════════════════
  RESULTS: 52/52 passed, 0 failed, 0 warnings
═══════════════════════════════════════════════════════════
```

### Test Categories

| Category | Tests | Description |
|----------|-------|-------------|
| Health Check | 2 | Backend running, DB connected |
| Submission | 5 | Submit payload, get tracking ID |
| Polling | 4 | Poll until report completes |
| Report Structure | 24 | Validate 6-page triage report |
| Validation | 8 | Edge cases, error handling |
| Persistence | 7 | Data stored in database |

### Manual API Testing

```bash
# Submit SSD data
curl -X POST http://localhost:8000/api/ssd/tirr \
  -H "Content-Type: application/json" \
  -d @sample-ssd-payload.json

# Check status
curl http://localhost:8000/api/ssd/tirr/{tracking_id}

# View audit logs
curl http://localhost:8000/api/ssd/audit/logs

# Get statistics
curl http://localhost:8000/api/ssd/audit/stats
```

---

## Using the Admin UI

### SSD Audit Log Page

**URL:** `https://your-domain.com/dashboard/ssd-audit`

Features:
- Real-time statistics dashboard (total requests, success rate, avg processing time)
- Filterable audit log table
- Detailed view of each request with:
  - Request payload
  - Response payload
  - Processing events timeline
  - Generated report link

### SSD Integration Tab (Report Configuration)

**URL:** `https://your-domain.com/dashboard/reports/configure`

Click the **"SSD Integration"** tab to access:
1. **Endpoint Configuration** — API endpoint URL, callback URL
2. **Report Sections** — 6 sections with customizable scores
3. **Scoring Thresholds** — Recommendation ranges
4. **Mandatory Fields** — List of 17 required fields
5. **Test Endpoint** — Button to test connectivity

---

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SSD_CALLBACK_URL` | URL to send callback response | None (logs warning) |
| `REPORTS_DIR` | Directory to save generated reports | `./reports` |
| `DATABASE_URL` | PostgreSQL connection string | Required |

### Report Configuration File

See `ssd_tirr_report_config.py` for:

```python
REPORT_META = {
    "version": "1.0",
    "title": "TCA Investment Readiness Report (Triage)",
    "total_pages": 6,
}

SCORING_THRESHOLDS = {
    "strong_pass": {"min": 7.5, "max": 10.0, "label": "STRONG PASS"},
    "conditional": {"min": 5.0, "max": 7.4, "label": "CONDITIONAL"},
    "pass": {"min": 4.0, "max": 4.9, "label": "PASS"},
    "fail": {"min": 0.0, "max": 3.9, "label": "FAIL"},
}
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| 422 Validation Error | Check mandatory fields are present |
| Connection refused | Ensure backend is running on port 8000 |
| No callback received | Check `SSD_CALLBACK_URL` is configured |
| Report not generating | Check database connection, view logs |

### Debug Logging

```bash
# Enable debug logs
LOG_LEVEL=DEBUG python main.py
```

### View Server Logs

```bash
# Look for [SSD-TIRR] entries
# Example logs:
# [SSD-TIRR] Received request for 'TechStartup Inc.' (tracking=abc123)
# [SSD-TIRR] Data stored as upload_id=xyz789
# [SSD-TIRR] 9-module analysis complete: score=6.8, rec=CONDITIONAL
# [SSD-TIRR] Triage report saved → /reports/tirr_abc123.json
# [SSD-TIRR] Callback sent to https://ssd.example.com — HTTP 200
```

---

## Integration Flow Diagram

```
┌──────────────┐    POST /api/ssd/tirr    ┌──────────────┐
│     SSD      │ ────────────────────────▶│   TCA TIRR   │
│  Application │◀── 202 Accepted ─────────│   Backend    │
└──────────────┘    + tracking_id         └──────┬───────┘
                                                 │
                         ┌───────────────────────┘
                         ▼
                  ┌──────────────┐
                  │  Background  │
                  │   Process    │
                  └──────┬───────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  Store   │   │ 9-Module │   │ Generate │
   │   Data   │   │ Analysis │   │  Report  │
   └──────────┘   └──────────┘   └────┬─────┘
                                      │
                                      ▼
┌──────────────┐   POST callback   ┌──────────────┐
│     SSD      │◀─────────────────│   TCA TIRR   │
│ Capture API  │   founderEmail    │   Backend    │
└──────────────┘   reportPath      └──────────────┘
```

---

## Report Structure (6 Pages)

| Page | Title | Key Data |
|------|-------|----------|
| 1 | Executive Summary | Overall score, recommendation, completeness |
| 2 | TCA Scorecard | Category breakdown, strengths, concerns |
| 3 | Risk Assessment | Risk score, flags, severity levels |
| 4 | Market & Team | TAM/SAM/SOM, team score, gaps |
| 5 | Financials & Tech | Revenue, burn rate, tech readiness |
| 6 | Recommendations | Final decision, next steps, exit potential |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-03 | Initial implementation with full spec compliance |

---

## Support

For issues or questions:
- Check the [Audit Log](/dashboard/ssd-audit) for request details
- Review server logs for `[SSD-TIRR]` entries
- Run integration tests to verify setup
