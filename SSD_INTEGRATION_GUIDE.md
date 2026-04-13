# SSD (Startup Steroid) Integration Guide

## Overview
TCA-IRR integrates with Startup Steroid (SSD) to provide TIRR (Tax Incentive Readiness Report) analysis services.

---

## 🔐 API Authentication

| Parameter | Value |
|-----------|-------|
| **API Key** | `ssd-tca-58ceb369539c4a098b9ac49c` |
| **Header Name** | `X-API-Key` |
| **Base URL** | `https://tcairrapiccontainer.azurewebsites.net` |

---

## 📍 Available Endpoints

### 1. Submit TIRR Analysis
**Primary Endpoint:**
```
POST /api/v1/ssd/tirr
```

**Alias Endpoint:**
```
POST /api/v1/startup-steroid/tirr
```

**Request Body (JSON):**
```json
{
  "company_name": "Example Startup Inc",
  "ein": "12-3456789",
  "year": 2024,
  "company_data": {
    "industry": "Technology",
    "employee_count": 25,
    "annual_revenue": 1500000,
    "rd_expenses": 250000,
    "state": "CA"
  },
  "webhook_url": "https://your-server.com/webhook/callback",
  "callback_id": "unique-request-id-123"
}
```

**Required Fields:**
- `company_name` - Company legal name
- `ein` - Employer Identification Number (format: XX-XXXXXXX)
- `year` - Tax year for analysis (2020-2025)

**Optional Fields:**
- `company_data` - Additional company information for enhanced analysis
- `webhook_url` - URL to receive analysis completion notification
- `callback_id` - Your reference ID for tracking

**Response (Success - 202):**
```json
{
  "status": "accepted",
  "message": "TIRR analysis request received and queued for processing",
  "request_id": "uuid-generated-by-system",
  "estimated_completion": "2-5 minutes",
  "webhook_configured": true
}
```

---

### 2. Health Check
```
GET /api/v1/ssd/health
```

**Headers:**
```
X-API-Key: ssd-tca-58ceb369539c4a098b9ac49c
```

**Response (200):**
```json
{
  "status": "healthy",
  "service": "ssd_tirr_integration",
  "reports_directory": "/app/reports",
  "reports_exist": true,
  "timestamp": "2024-03-18T15:30:00.000Z"
}
```

---

### 3. Webhook Receiver
```
POST /api/v1/ssd/webhook/receive
```

Used for receiving callbacks from SSD. Accepts:
- Analysis completion notifications
- Status updates
- Error notifications

---

## 🔄 Integration Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   SSD Client    │────▶│   TCA-IRR API   │────▶│   Processing    │
│  (Your System)  │     │   /ssd/tirr     │     │   Queue         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your Webhook  │◀────│   TCA-IRR API   │◀────│   Analysis      │
│   Endpoint      │     │   Callback      │     │   Complete      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 💻 Code Examples

### cURL
```bash
# Submit TIRR Analysis
curl -X POST "https://tcairrapiccontainer.azurewebsites.net/api/v1/ssd/tirr" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ssd-tca-58ceb369539c4a098b9ac49c" \
  -d '{
    "company_name": "Example Startup Inc",
    "ein": "12-3456789",
    "year": 2024,
    "webhook_url": "https://your-server.com/webhook",
    "callback_id": "req-001"
  }'

# Health Check
curl -X GET "https://tcairrapiccontainer.azurewebsites.net/api/v1/ssd/health" \
  -H "X-API-Key: ssd-tca-58ceb369539c4a098b9ac49c"
```

### Python
```python
import requests

API_KEY = "ssd-tca-58ceb369539c4a098b9ac49c"
BASE_URL = "https://tcairrapiccontainer.azurewebsites.net"

headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

# Submit TIRR Analysis
response = requests.post(
    f"{BASE_URL}/api/v1/ssd/tirr",
    headers=headers,
    json={
        "company_name": "Example Startup Inc",
        "ein": "12-3456789",
        "year": 2024,
        "webhook_url": "https://your-server.com/webhook",
        "callback_id": "req-001"
    }
)
print(response.json())
```

### JavaScript/TypeScript
```typescript
const API_KEY = "ssd-tca-58ceb369539c4a098b9ac49c";
const BASE_URL = "https://tcairrapiccontainer.azurewebsites.net";

// Submit TIRR Analysis
const response = await fetch(`${BASE_URL}/api/v1/ssd/tirr`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
  },
  body: JSON.stringify({
    company_name: "Example Startup Inc",
    ein: "12-3456789",
    year: 2024,
    webhook_url: "https://your-server.com/webhook",
    callback_id: "req-001"
  })
});

const data = await response.json();
console.log(data);
```

---

## ⚠️ Error Responses

### 401 Unauthorized
```json
{
  "detail": "Invalid or missing API key"
}
```
**Solution:** Include valid `X-API-Key` header

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "ein"],
      "msg": "EIN must be in format XX-XXXXXXX",
      "type": "value_error"
    }
  ]
}
```
**Solution:** Check request body format

### 429 Rate Limited
```json
{
  "detail": "Rate limit exceeded. Please wait before retrying."
}
```
**Solution:** Implement exponential backoff

---

## 🔒 Security Best Practices

1. **Never expose the API key in client-side code**
2. **Use HTTPS for all API calls**
3. **Store API key in environment variables**
4. **Implement webhook signature verification**
5. **Use callback_id for request tracking**

---

## 📊 Rate Limits

| Tier | Requests/Minute | Concurrent |
|------|-----------------|------------|
| Standard | 60 | 5 |
| Enterprise | 300 | 20 |

---

## 🆘 Support

- **Dashboard:** https://tca-irr.azurewebsites.net/ssd
- **API Status:** https://tca-irr.azurewebsites.net/ssd/audit
- **Documentation:** This file

---

## 📝 Changelog

### v1.0.0 (2024-03-18)
- Initial SSD integration release
- TIRR analysis endpoint
- Webhook support
- Health check endpoint
- Rate limiting

