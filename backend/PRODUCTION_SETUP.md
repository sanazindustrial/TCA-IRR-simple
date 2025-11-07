# TCA Investment Analysis Platform - Production Setup Guide

This guide covers the setup and deployment of the TCA Investment Analysis Platform for production use with Azure PostgreSQL.

## 🗄️ Database Configuration

### Azure PostgreSQL Setup

The application is configured to connect to Azure Database for PostgreSQL with the following settings:

- **Server**: `tca-irr-server.postgres.database.azure.com`
- **Database**: `tca_platform`
- **User**: `tcairrserver`
- **SSL Mode**: `require` (enforced for security)

### Environment Variables

For production deployment, set the following environment variables:

```bash
# Application Settings
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your-super-secret-key-here

# Database Settings
POSTGRES_HOST=tca-irr-server.postgres.database.azure.com
POSTGRES_PORT=5432
POSTGRES_DB=tca_platform
POSTGRES_USER=tcairrserver
POSTGRES_PASSWORD=your-secure-password
POSTGRES_SSL_MODE=require

# Connection Pool Settings
DB_POOL_MIN_SIZE=5
DB_POOL_MAX_SIZE=20
DB_POOL_MAX_QUERIES=50000
DB_POOL_MAX_INACTIVE_TIME=300

# Security Settings
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI Integration
GENKIT_HOST=http://your-ai-service-host:3100
GENKIT_TIMEOUT=300
```

## 🚀 Deployment Steps

### 1. Database Initialization

Initialize the production database with required tables and sample data:

```bash
cd backend
python init_database.py
```

This will create:

- User management tables
- Company and analysis tables
- Investment tracking tables
- Default admin user (admin/admin123456)
- Sample data for testing

### 2. Dependencies Installation

Install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

### 3. Database Migration (if needed)

For schema updates, use the migration scripts:

```bash
python manage_database.py migrate
```

### 4. Application Deployment

#### Option A: Direct Python Deployment

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Option B: Docker Deployment

Build and run with Docker:

```bash
cd backend
docker build -t tca-platform-backend .
docker run -d -p 8000:8000 --env-file .env.production tca-platform-backend
```

#### Option C: Azure Container Instances

Deploy using Azure CLI:

```bash
az container create \
  --resource-group tca-platform-rg \
  --name tca-backend \
  --image tca-platform-backend:latest \
  --cpu 2 \
  --memory 4 \
  --port 8000 \
  --environment-variables \
    ENVIRONMENT=production \
    POSTGRES_HOST=tca-irr-server.postgres.database.azure.com \
    POSTGRES_DB=tca_platform \
    POSTGRES_USER=tcairrserver \
    POSTGRES_PASSWORD=$POSTGRES_PASSWORD
```

### 5. Frontend Deployment

Build and deploy the Next.js frontend:

```bash
cd frontend
npm run build
npm start
```

Or deploy to Azure Static Web Apps:

```bash
az staticwebapp create \
  --name tca-frontend \
  --resource-group tca-platform-rg \
  --source "https://github.com/your-repo/tca-platform" \
  --location "East US 2" \
  --branch main \
  --app-location "/" \
  --api-location "backend" \
  --output-location ".next"
```

## 🔧 Development Setup

For local development with PostgreSQL:

### 1. Start Development Environment

```bash
cd backend
docker-compose up -d
```

This starts:

- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- PgAdmin web interface (port 5050)
- FastAPI backend (port 8000)

### 2. Access Development Tools

- **Application**: <http://localhost:8000>
- **API Documentation**: <http://localhost:8000/docs>
- **PgAdmin**: <http://localhost:5050>
  - Email: <admin@tcaplatform.com>
  - Password: admin123

### 3. Development Database

- **Host**: localhost
- **Port**: 5432
- **Database**: tca_platform_dev
- **User**: tca_dev_user
- **Password**: tca_dev_password

## 🔐 Security Considerations

### 1. Database Security

- ✅ SSL/TLS encryption enabled
- ✅ Firewall rules configured
- ✅ Strong password policies
- ✅ Regular security updates

### 2. Application Security

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Security headers middleware
- ✅ Rate limiting

### 3. Production Hardening

```python
# Update these settings for production:
# backend/app/core/config.py

class Settings(BaseSettings):
    debug: bool = False  # Disable debug mode
    allowed_hosts: List[str] = ["yourdomain.com"]  # Restrict hosts
    cors_origins: List[str] = ["https://yourdomain.com"]  # Restrict CORS
    secret_key: str = os.getenv("SECRET_KEY")  # Use strong secret key
```

## 📊 Monitoring and Logging

### 1. Application Logs

Logs are configured with structured logging:

```python
import logging
logger = logging.getLogger(__name__)

# Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
logger.info("Application started successfully")
```

### 2. Database Monitoring

Monitor database performance:

```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'tca_platform';

-- Check database size
SELECT pg_size_pretty(pg_database_size('tca_platform'));

-- Monitor slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### 3. Health Checks

The application provides health check endpoints:

- **Basic**: `GET /health`
- **Detailed**: `GET /api/v1/admin/health` (admin only)

## 🔄 Backup and Recovery

### 1. Database Backup

```bash
# Create backup
pg_dump -h tca-irr-server.postgres.database.azure.com \
        -U tcairrserver \
        -d tca_platform \
        --clean --create \
        > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -h tca-irr-server.postgres.database.azure.com \
     -U tcairrserver \
     -d tca_platform \
     < backup_20241107_120000.sql
```

### 2. Automated Backups

Set up automated backups using Azure Backup or scheduled tasks:

```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * /path/to/backup_script.sh
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**

   ```bash
   # Check connection
   psql -h tca-irr-server.postgres.database.azure.com -U tcairrserver -d tca_platform
   
   # Check firewall rules
   az postgres server firewall-rule list --server-name tca-irr-server --resource-group your-rg
   ```

2. **SSL Connection Issues**

   ```bash
   # Download SSL certificate
   wget https://www.digicert.com/CACerts/BaltimoreCyberTrustRoot.crt.pem
   
   # Update connection string
   POSTGRES_SSL_CERT_PATH=/path/to/BaltimoreCyberTrustRoot.crt.pem
   ```

3. **Performance Issues**

   ```sql
   -- Check slow queries
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   
   -- Check indexes
   SELECT schemaname, tablename, attname, n_distinct, correlation 
   FROM pg_stats 
   WHERE tablename IN ('users', 'companies', 'analyses');
   ```

## 📞 Support

For production support and issues:

1. Check application logs
2. Verify database connectivity
3. Review health check endpoints
4. Check Azure service status
5. Contact system administrator

## 📋 Maintenance Tasks

### Weekly Tasks

- [ ] Review application logs
- [ ] Check database performance
- [ ] Verify backups
- [ ] Update dependencies (if needed)

### Monthly Tasks

- [ ] Review security logs
- [ ] Update SSL certificates
- [ ] Performance optimization review
- [ ] Capacity planning review

### Quarterly Tasks

- [ ] Security audit
- [ ] Disaster recovery testing
- [ ] Documentation updates
- [ ] Architecture review
