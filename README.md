# TCA-IRR Platform - Comprehensive Technology Commercialization Analysis

A sophisticated platform for technology commercialization analysis featuring AI-driven insights, 9-module analysis system, and comprehensive investment evaluation capabilities.

## 🚀 Major Features

### 🎯 9-Module Analysis System

- **TCA Scorecard** (Core Assessment) - 20% weight
- **Risk Assessment & Flags** - 15% weight
- **Market & Competition Analysis** - 15% weight
- **Team & Leadership Assessment** - 15% weight
- **Financial Health & Projections** - 15% weight
- **Technology & IP Assessment** - 10% weight
- **Business Model & Strategy** - 5% weight
- **Growth Potential & Scalability** - 5% weight
- **Investment Readiness & Exit Potential** - 5% weight

### ⚙️ Advanced Configuration

- **Module Status Control**: Active/Inactive/Testing modes for each module
- **Data Mapping**: Automated mapping from uploaded CSV/JSON files
- **Weighted Scoring**: Configurable importance weights per module
- **Role-Based Access**: Different report types for different user roles

### 🏗️ Technical Architecture

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI with Python 3.12+, Pydantic models
- **AI Integration**: Firebase Genkit for AI-powered analysis
- **Database**: PostgreSQL with Azure hosting support
- **Deployment**: Docker containerization with Azure App Service

## � System Requirements

### Development Environment

- **Node.js**: 18+ or 20+
- **Python**: 3.12+
- **Package Manager**: npm or yarn
- **Database**: PostgreSQL 14+

### Production Requirements

- **Azure App Service**: Node.js 18+ runtime
- **Azure Database**: PostgreSQL flexible server
- **Azure Storage**: For file uploads and static assets

## 🛠️ Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/sanazindustrial/TCA-IRR-simple.git
cd TCA-IRR-simple
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration:
# NEXT_PUBLIC_API_URL=https://tcairrapiccontainer.azurewebsites.net
# NEXTAUTH_SECRET=your-secret-key
# NEXTAUTH_URL=http://localhost:3000
# OPENAI_API_KEY=your-openai-api-key-here
# OPENAI_MODEL=gpt-4-turbo-preview

# Start development server
npm run dev
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# MacOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration:
# DATABASE_URL=postgresql://user:password@localhost:5432/tcairr
# JWT_SECRET_KEY=your-jwt-secret
# FRONTEND_URL=http://localhost:3000
# OPENAI_API_KEY=your-openai-api-key-here
# OPENAI_MODEL=gpt-4-turbo-preview

# Initialize database (if using PostgreSQL)
python init_database.py

# Start backend server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. AI Service Setup (Optional)

```bash
# Configure OpenAI API (if using AI features)
# Add your OpenAI API key to environment variables:
# In .env.local (frontend) and .env (backend):
# OPENAI_API_KEY=your-openai-api-key-here
# OPENAI_MODEL=gpt-4-turbo-preview

# Verify AI service configuration
npm run test:ai
```

### 5. Database Setup (PostgreSQL)

```sql
-- Create database
CREATE DATABASE tcairr;

-- Create user (optional)
CREATE USER tca_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tcairr TO tca_user;
```

## 🚀 Deployment & Production Status

### **✅ Production Ready - November 2025**

The application has been fully tested and verified for production deployment:

```
🎯 Status: DEPLOYMENT READY
📊 Test Coverage: 100% (14/14 tests passing)
🏗️ Build Status: ✅ Successful (39s, 67 pages)
🌐 Backend: ✅ FastAPI running on port 8000
💾 Database: ✅ Azure PostgreSQL connected
🔄 Integration: ✅ Frontend-backend communication verified
```

### **Azure App Service Deployment**

1. **Quick Deployment (Recommended):**

   ```bash
   # Authenticate with Azure
   azd auth login
   
   # Deploy everything with one command
   azd up
   ```

2. **Manual Azure Deployment:**

   ```bash
   # Create resource group
   az group create --name rg-tca-irr --location eastus2
   
   # Deploy infrastructure
   az deployment group create \
     --resource-group rg-tca-irr \
     --template-file infra/main.bicep
   ```

3. **Application Build & Deploy:**

   ```bash
   # Verified production build
   npm run build  # ✅ 39s build time, 67 pages
   
   # Deploy to Azure App Service
   az webapp deployment source config-zip \
     --resource-group rg-tca-irr \
     --name <web-app-name> \
     --src build.zip
   ```

### **Infrastructure as Code**

Complete Azure infrastructure with Bicep templates:

- ✅ App Service Plan (B1 tier optimized)
- ✅ Web App (Next.js frontend hosting)  
- ✅ Function App (FastAPI backend hosting)
- ✅ PostgreSQL Database (production-ready)
- ✅ Storage Account (document management)
- ✅ Key Vault (secure secret management)
- ✅ Application Insights (monitoring & analytics)

## 📁 Project Structure

```
TCA-IRR-simple/
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── api/v1/endpoints/         # API endpoints
│   │   ├── core/                     # Configuration & security
│   │   ├── models/                   # Data models & schemas
│   │   │   └── module_config.py      # 9-module configuration
│   │   ├── services/                 # Business logic
│   │   │   └── ai_service.py         # Enhanced AI analysis processor
│   │   ├── db/                       # Database configuration
│   │   └── utils/                    # Utility functions
│   ├── main.py                       # FastAPI application entry
│   ├── requirements.txt              # Python dependencies
│   └── Dockerfile                    # Container configuration
├── src/
│   ├── app/                          # Next.js app directory
│   │   ├── analysis/                 # Analysis workflows
│   │   ├── dashboard/                # Dashboard pages
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   ├── analysis/                 # Analysis components
│   │   │   └── module-configuration.tsx  # Module config UI
│   │   ├── evaluation/               # Evaluation components
│   │   └── ui/                       # Reusable UI components
│   └── lib/                          # Utility libraries
├── test_simple_module_system.py      # 9-module system tests
├── 9-MODULE-ANALYSIS-IMPLEMENTATION.md  # System documentation
├── DEPLOYMENT_READY.md               # Deployment guide
└── PRODUCTION_DEPLOYMENT_GUIDE.md    # Production setup guide
```

## 🧪 Testing & Quality Assurance

### **Automated Test Suite**

```bash
# Run comprehensive TCA analysis tests
node run-tests.js

# Build verification
npm run build

# Development server
npm run dev
```

### **Test Coverage - 100% Pass Rate**

- ✅ **TCA Score Calculation (5/5)**: Composite scoring, weight distribution, range validation
- ✅ **What-If Analysis (4/4)**: Score modification, scenario generation, impact calculation  
- ✅ **Result Page Loading (5/5)**: Data structure, component extraction, configuration management
- ✅ **Error Handling**: Graceful fallbacks and recovery mechanisms
- ✅ **Production Build**: All 67 pages compiled successfully

### **Quality Metrics**

```
Build Time: 39.0s (optimized)
Bundle Size: 638 kB total (5.62 kB dynamic result page)
Pages: 67 static + dynamic pages
Test Suite: 14/14 tests passing (100% success rate)
```

### **Backend Testing**

```bash
# Test Python backend
py main.py  # Runs on https://tcairrapiccontainer.azurewebsites.net

# Database health check
curl https://tcairrapiccontainer.azurewebsites.net/health
```

## 📖 API Documentation

### Analysis Endpoints

- `POST /api/analysis/create` - Start new investment analysis
- `GET /api/analysis/{id}` - Retrieve analysis results
- `POST /api/analysis/{id}/export` - Export analysis report

### AI Flows

- Market trend assessment
- Competitive analysis generation
- Financial risk evaluation
- Growth trajectory modeling

## 🔧 Configuration

### Module Configuration

The application supports configurable analysis modules through `src/lib/module-guides.ts`. Each module can be:

- Enabled/disabled per user role
- Configured with custom parameters
- Extended with additional analysis criteria

### Security

- Content Security Policy headers configured
- HTTPS enforcement in production
- Role-based access control
- Secure API endpoints with authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary. All rights reserved.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in `/docs`

---

**Built with ❤️ for intelligent investment analysis**

### Project Team

- **Creator**: Dr. Sanaz Tehrani
- **Co-Leader**: Dr. Omar Haddad
- **SMART Capstone Project** - Westcliff University
- **Collaboration**: TCA Venture Group & Westcliff University
