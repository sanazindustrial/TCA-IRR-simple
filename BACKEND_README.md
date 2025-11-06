# TCA IRR Backend

A FastAPI-based backend for the TCA Investment Risk Rating application that integrates with your existing Next.js frontend and Genkit AI flows.

## Quick Start

### Option 1: One-Click Launch (Recommended)

**Windows:**

```cmd
start_backend.bat
```

**Mac/Linux:**

```bash
python3 launch.py
```

### Option 2: Manual Setup

1. **Install Dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Setup Environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize Database:**

   ```bash
   python init_db.py
   ```

4. **Start Server:**

   ```bash
   python main.py
   ```

## Architecture

```text
TCA IRR Application
├── Next.js Frontend (Port 3000)
│   ├── React Components
│   ├── Genkit AI Flows
│   └── UI/UX
│
├── FastAPI Backend (Port 8000)
│   ├── Authentication & Users
│   ├── Request Management
│   ├── Evaluation Processing
│   └── AI Integration
│
└── PostgreSQL Database
    ├── Users & Auth
    ├── App Requests
    └── Evaluations
```

## Features

### 🔐 Authentication

- JWT-based authentication
- User registration and login
- Role-based access control (Admin, Reviewer, User, AI Adopter)
- Password hashing with bcrypt

### 📊 Evaluation System

- Integration with existing Genkit AI flows
- Async evaluation processing
- Multiple analysis modules:
  - TCA Scorecard Generation
  - Founder Fit Analysis
  - Risk Flags & Mitigation
  - Team Assessment
  - Benchmark Comparison
  - Gap Analysis
  - Comprehensive Analysis

### 📝 Request Management

- User request submission
- Status tracking (pending, in_review, approved, rejected, completed)
- Admin review capabilities
- Priority management

### 🛡️ Security Features

- CORS protection
- Input validation with Pydantic
- SQL injection protection
- Rate limiting ready
- Environment-based configuration

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Requests

- `POST /requests` - Create new request
- `GET /requests` - Get user requests
- `GET /admin/requests` - Get all requests (admin)

### Evaluations

- `POST /evaluations` - Create evaluation
- `GET /evaluations/{id}` - Get evaluation results

### Health

- `GET /` - Basic health check
- `GET /health` - Detailed health check

## Configuration

### Environment Variables (.env)

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/tca_irr_db

# JWT Security
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production-minimum-32-chars
JWT_ALGORITHM=HS256

# CORS
FRONTEND_URL=http://localhost:3000

# Development
DEBUG=true
LOG_LEVEL=info
```

### Database Schema

The backend uses three main tables:

1. **users** - User accounts and authentication
2. **app_requests** - User-submitted requests and tickets
3. **evaluations** - AI evaluation requests and results

## AI Integration

The backend integrates with your existing Genkit AI flows:

```python
# AI Flow Integration
├── TCA Scorecard Generation
├── Founder Fit Analysis
├── Risk Assessment
├── Team Evaluation
├── Benchmark Comparison
├── Gap Analysis
└── Comprehensive Analysis
```

### Genkit Server Communication

The backend communicates with your Genkit server (typically on port 3100) to process AI evaluations. Make sure your Genkit server is running:

```bash
npm run genkit:dev
```

## Database Setup

### PostgreSQL Installation

**Windows:**

1. Download from [PostgreSQL.org](https://www.postgresql.org/download/windows/)
2. Install with default settings
3. Remember the password you set for 'postgres' user

**Mac:**

```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### Create Database

```sql
-- Connect to PostgreSQL as postgres user
CREATE DATABASE tca_irr_db;
CREATE USER tca_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tca_irr_db TO tca_user;
```

## Development

### Running in Development Mode

```bash
# Start with auto-reload
python main.py

# Or use uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation

Once running, visit:

- **Swagger UI:** <http://localhost:8000/docs>
- **ReDoc:** <http://localhost:8000/redoc>

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## Integration with Frontend

### Next.js Integration

Add API calls to your Next.js frontend:

```javascript
// lib/api.js
const API_BASE_URL = 'http://localhost:8000';

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function createEvaluation(evaluationData, token) {
  const response = await fetch(`${API_BASE_URL}/evaluations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(evaluationData),
  });
  return response.json();
}
```

### Authentication Flow

```javascript
// Store JWT token
localStorage.setItem('auth_token', response.access_token);

// Use in API calls
const token = localStorage.getItem('auth_token');
headers: {
  'Authorization': `Bearer ${token}`,
}
```

## Deployment

### Production Checklist

- [ ] Change JWT_SECRET_KEY to a secure random value
- [ ] Use production database credentials
- [ ] Set DEBUG=false
- [ ] Configure proper CORS origins
- [ ] Set up reverse proxy (nginx)
- [ ] Configure SSL/TLS
- [ ] Set up logging and monitoring
- [ ] Configure environment-specific settings

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Check firewall settings

2. **Import Errors**
   - Run `pip install -r requirements.txt`
   - Check Python version (3.8+)

3. **AI Integration Issues**
   - Ensure Genkit server is running
   - Check Genkit server URL (default: <http://localhost:3100>)
   - Verify AI flow endpoints

4. **CORS Errors**
   - Check FRONTEND_URL in .env
   - Verify frontend is running on correct port

### Logs

Backend logs include:

- Request/response details
- Database operations
- AI processing status
- Error tracking

Check logs for debugging information.

## Support

For issues and questions:

1. Check the logs for error details
2. Verify all environment variables are set correctly
3. Ensure all services (PostgreSQL, Genkit) are running
4. Check the API documentation at <http://localhost:8000/docs>

## License

This backend is part of the TCA IRR application project.
