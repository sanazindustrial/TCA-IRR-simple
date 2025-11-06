# TCA-IRR Investment Analysis Application

A comprehensive investment analysis and deal evaluation platform built with Next.js 15, React 18, and TypeScript. The application provides sophisticated tools for evaluating investment opportunities, performing risk assessments, and generating detailed analytical reports.

## 🚀 Features

- **Comprehensive Investment Analysis**: Multi-module evaluation system covering market trends, competitive landscapes, financial metrics, and risk assessments
- **Interactive Dashboard**: Real-time analytics and visualization of investment data
- **AI-Powered Insights**: Automated analysis using Google Genkit AI flows for intelligent investment recommendations
- **Role-Based Access Control**: Multi-tier user management with different access levels
- **Document Management**: Secure upload and analysis of investment documents
- **Export Capabilities**: Generate detailed reports in multiple formats

## 🏗️ Architecture

### Frontend

- **Next.js 15** with App Router and React 18
- **TypeScript** for type safety and better development experience
- **Tailwind CSS** for modern, responsive styling
- **Shadcn/UI** components for consistent design system

### Backend & AI

- **Google Genkit** for AI-powered analysis flows
- **Azure App Service** for scalable cloud hosting
- **Azure Functions** for serverless computing capabilities

### Analysis Modules

- Market Trend Alignment Assessment
- Competitive Landscape Analysis
- Financial Metrics & Burn Rate Analysis
- Founder-Market Fit Evaluation
- Risk Assessment & Mitigation
- Growth Classification & Projections
- Strategic Fit Matrix
- Team Assessment & Capabilities

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- Azure account (for cloud deployment)
- Google Cloud account (for AI features)

### Local Development

1. **Clone the repository:**

   ```bash
   git clone https://github.com/sanazindustrial/TCA-IRR-simple.git
   cd TCA-IRR-simple
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Setup:**

   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:

   ```env
   # Database Configuration
   DATABASE_URL="your_database_connection_string"
   
   # Google Genkit AI Configuration
   GOOGLE_GENKIT_API_KEY="your_genkit_api_key"
   
   # Azure Configuration (optional for local dev)
   AZURE_CLIENT_ID="your_azure_client_id"
   AZURE_CLIENT_SECRET="your_azure_client_secret"
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

### Database Setup

1. **Initialize the database:**

   ```bash
   python init_db.py
   ```

2. **Run database migrations:**

   ```bash
   # The schema files are located in ./schema/
   # - users.sql: User management and roles
   # - app_requests.sql: Investment request tracking
   # - evaluations.sql: Analysis results and reports
   ```

## 🚀 Deployment

### Azure App Service Deployment

The application is configured for Azure App Service with comprehensive infrastructure as code:

1. **Azure Resources:**

   ```bash
   # Deploy using Azure CLI
   az deployment group create \
     --resource-group your-resource-group \
     --template-file infra/main.bicep \
     --parameters @infra/main.parameters.json
   ```

2. **Application Deployment:**

   ```bash
   # Build and deploy
   npm run build
   # Deploy to Azure App Service using your preferred method
   ```

### GitHub Actions (CI/CD)

The repository includes GitHub Actions workflows for automated deployment:

- `.github/workflows/` contains deployment pipelines
- Automated testing and deployment to Azure on push to main branch

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── analysis/          # Investment analysis interface
│   │   ├── dashboard/         # Main dashboard and admin panels
│   │   ├── evaluation/        # Evaluation results and reporting
│   │   └── data-sources/      # Data source management
│   ├── components/            # Reusable React components
│   │   ├── analysis/          # Analysis-specific components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── evaluation/        # Evaluation display components
│   │   └── ui/                # Base UI components
│   ├── ai/                    # AI and Genkit integration
│   │   └── flows/             # AI analysis flows
│   └── lib/                   # Utilities and configuration
├── schema/                    # Database schema definitions
├── infra/                     # Azure infrastructure (Bicep templates)
├── scripts/                   # Deployment and utility scripts
└── docs/                      # Project documentation
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
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
