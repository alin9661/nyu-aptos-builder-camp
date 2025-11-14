# NYU Aptos Builder Camp - Setup Guide

Complete setup instructions for the NYU Aptos governance and treasury management platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (5 Minutes)](#quick-start-5-minutes)
- [Detailed Setup](#detailed-setup)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Development Workflow](#development-workflow)
- [Commands Reference](#commands-reference)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js 18 or higher**
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```
   Download: https://nodejs.org/

2. **pnpm** (for frontend)
   ```bash
   npm install -g pnpm
   pnpm --version
   ```

3. **PostgreSQL 15+** (or Docker Desktop)
   - **Option A - Docker** (Recommended): https://www.docker.com/products/docker-desktop
   - **Option B - Manual**: https://www.postgresql.org/download/

4. **Git**
   ```bash
   git --version
   ```

### Optional but Recommended

- **Aptos CLI** (for smart contract development)
  ```bash
  brew install aptos  # macOS
  # Or follow: https://aptos.dev/tools/aptos-cli/install-cli/
  ```

---

## Quick Start (5 Minutes)

For experienced developers who want to get started quickly:

```bash
# 1. Clone the repository
git clone https://github.com/alin9661/nyu-aptos-builder-camp.git
cd nyu-aptos-builder-camp

# 2. Run the automated setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Start development servers
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

That's it! The app should now be running at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

**If the automated script doesn't work**, follow the [Detailed Setup](#detailed-setup) below.

---

## Detailed Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/alin9661/nyu-aptos-builder-camp.git
cd nyu-aptos-builder-camp
```

### Step 2: Set Up PostgreSQL Database

Choose one of the following methods:

#### Option A: Using Docker (Recommended)

```bash
# Navigate to backend directory
cd backend

# Start PostgreSQL container
docker-compose up -d postgres

# Verify it's running
docker ps
# Should show: nyu-aptos-db ... (healthy)

# Check logs if needed
docker logs nyu-aptos-db
```

#### Option B: Manual PostgreSQL Setup

```bash
# Start PostgreSQL service (macOS)
brew services start postgresql@16

# Or on Linux
sudo systemctl start postgresql

# Create database
createdb nyu_aptos

# Or using psql
psql -U postgres
CREATE DATABASE nyu_aptos;
\q
```

### Step 3: Configure Environment Variables

#### Backend Configuration

```bash
cd backend

# Copy the example environment file
cp .env.example .env

# Generate secure secrets
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for SESSION_SECRET
openssl rand -hex 32  # Use for WALLET_ENCRYPTION_SECRET

# Edit .env file
nano .env  # or use your preferred editor
```

**Required variables to update in `backend/.env`:**

```env
# Database (if using Docker, use port 5432; if local PostgreSQL is on 5432, use 5433)
DB_PASSWORD=your_secure_password
DB_PORT=5432  # or 5433 if you have port conflicts

# Security - REPLACE with generated secrets from above
JWT_SECRET=<paste generated secret here>
JWT_REFRESH_SECRET=<paste generated secret here>
SESSION_SECRET=<paste generated secret here>
WALLET_ENCRYPTION_SECRET=<paste generated secret here>

# Leave other values as default for development
```

⚠️ **IMPORTANT**: Never commit these secrets to Git! The `.env` file is already in `.gitignore`.

#### Frontend Configuration

```bash
cd ../frontend

# Copy the example environment file
cp .env.local.example .env.local

# Generate Auth0 secret
openssl rand -hex 32  # Use for AUTH0_SECRET

# Edit .env.local file
nano .env.local
```

**Required variables to update in `frontend/.env.local`:**

```env
# Auth0 Secret - REPLACE with generated secret
AUTH0_SECRET=<paste generated secret here>

# Auth0 Configuration - You'll need to create an Auth0 account
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_AUTH0_DOMAIN.auth0.com
AUTH0_CLIENT_ID=YOUR_AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET=YOUR_AUTH0_CLIENT_SECRET

# Backend API URL (default should work)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

**Don't have Auth0 set up yet?** See [Auth0 Setup Guide](#auth0-setup) below.

### Step 4: Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
pnpm install
```

### Step 5: Initialize Database

Run the database migrations to create all necessary tables:

```bash
cd backend

# Run migrations in order
psql -d nyu_aptos -U postgres -f database/migrations/001_add_auth_tables.sql
psql -d nyu_aptos -U postgres -f database/migrations/002_add_sso_support.sql
psql -d nyu_aptos -U postgres -f database/migrations/003_add_notifications.sql
psql -d nyu_aptos -U postgres -f database/migrations/003_add_wallet_audit_logs.sql

# Verify tables were created
psql -d nyu_aptos -U postgres -c "\dt"
```

**If using Docker PostgreSQL:**

```bash
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/001_add_auth_tables.sql
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/002_add_sso_support.sql
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/003_add_notifications.sql
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/003_add_wallet_audit_logs.sql
```

### Step 6: Start the Services

Open **three** terminal windows/tabs:

#### Terminal 1: PostgreSQL (if using Docker)

```bash
cd backend
docker-compose up postgres
# Or use -d flag to run in background: docker-compose up -d postgres
```

#### Terminal 2: Backend API

```bash
cd backend
npm run dev
```

Expected output:
```
Server running on port 3001
Database connected successfully
Connected to Aptos testnet
WebSocket server initialized
```

#### Terminal 3: Frontend

```bash
cd frontend
pnpm dev
```

Expected output:
```
▲ Next.js 15.2.4
- Local:        http://localhost:3000
- Ready in XXXms
```

### Step 7: Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **Backend API Health Check**: http://localhost:3001/health

---

## Auth0 Setup

Auth0 provides authentication services (Google Sign-In, etc.). Here's how to set it up:

1. **Create an Auth0 Account**
   - Go to https://auth0.com/
   - Sign up for a free account

2. **Create an Application**
   - Dashboard → Applications → Create Application
   - Name: "NYU Aptos Builder Camp"
   - Type: "Regular Web Application"
   - Click "Create"

3. **Configure Application**
   - Settings tab:
     - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
     - **Allowed Logout URLs**: `http://localhost:3000`
     - **Allowed Web Origins**: `http://localhost:3000`
   - Save Changes

4. **Get Credentials**
   - Copy these values from the Settings tab:
     - **Domain** → Use in `AUTH0_ISSUER_BASE_URL`
     - **Client ID** → Use in `AUTH0_CLIENT_ID`
     - **Client Secret** → Use in `AUTH0_CLIENT_SECRET`

5. **Enable Google Connection** (Optional)
   - Authentication → Social
   - Enable Google
   - Use Auth0 development keys or add your own

6. **Update `.env.local`**
   ```env
   AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   ```

For detailed instructions, see [docs/AUTH0_SETUP.md](docs/AUTH0_SETUP.md)

---

## Verification

### 1. Check Backend Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": "development",
  "database": "connected",
  "network": {
    "network": "testnet",
    "nodeUrl": "https://fullnode.testnet.aptoslabs.com/v1"
  }
}
```

### 2. Check Database

```bash
psql -d nyu_aptos -U postgres -c "SELECT COUNT(*) FROM users;"
```

Should return `0` (no users yet, but table exists).

### 3. Test Frontend

1. Open http://localhost:3000
2. You should see the landing page
3. Try connecting a wallet or using Auth0 login

### 4. Check Logs

- Backend logs should show successful connections
- No error messages about missing environment variables
- Database queries should be working

---

## Troubleshooting

### Problem: "Cannot connect to database"

**Solutions:**

1. **Check PostgreSQL is running:**
   ```bash
   # For Docker
   docker ps | grep nyu-aptos-db

   # For local PostgreSQL
   pg_isready
   ```

2. **Check credentials in `.env`:**
   - Verify `DB_PASSWORD` matches your PostgreSQL password
   - Verify `DB_PORT` is correct (5432 or 5433)

3. **Check database exists:**
   ```bash
   psql -U postgres -l | grep nyu_aptos
   ```

### Problem: "Port already in use"

**Backend (port 3001):**
```bash
# Find process using port 3001
lsof -ti:3001

# Kill it
kill -9 $(lsof -ti:3001)
```

**Frontend (port 3000):**
```bash
lsof -ti:3000
kill -9 $(lsof -ti:3000)
```

**PostgreSQL (port 5432):**
```bash
# If you have local PostgreSQL on 5432, use 5433 for Docker
# Edit backend/.env:
DB_PORT=5433

# Update docker-compose.yml ports:
ports:
  - "5433:5432"
```

### Problem: "Missing environment variables"

**Error:** `SESSION_SECRET is not defined`

**Solution:**
```bash
# Generate secrets
openssl rand -hex 32

# Add to backend/.env
SESSION_SECRET=<generated value>
```

### Problem: "Auth0 callback error"

**Solution:**

1. Check `AUTH0_BASE_URL` matches your frontend URL
2. Verify callback URL in Auth0 dashboard matches `http://localhost:3000/api/auth/callback`
3. Ensure all Auth0 credentials are correct

### Problem: "Database migrations fail"

**Solution:**

1. **Check migration order** - Run them in numerical order (001, 002, 003)
2. **Check for existing tables:**
   ```bash
   psql -d nyu_aptos -U postgres -c "\dt"
   ```
3. **Drop and recreate database if needed:**
   ```bash
   dropdb nyu_aptos
   createdb nyu_aptos
   # Run migrations again
   ```

### Problem: "pnpm: command not found"

**Solution:**
```bash
npm install -g pnpm
```

---

## Development Workflow

### Daily Development

```bash
# Terminal 1: Database (if using Docker)
cd backend && docker-compose up -d postgres

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && pnpm dev
```

### Stopping Services

```bash
# Backend/Frontend: Ctrl+C in their terminals

# PostgreSQL Docker:
cd backend && docker-compose down

# Or keep it running (it will auto-start next time)
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests (if implemented)
cd frontend
pnpm test
```

### Database Operations

```bash
# Backup database
pg_dump -U postgres nyu_aptos > backup.sql

# Restore database
psql -U postgres nyu_aptos < backup.sql

# Connect to database
psql -U postgres nyu_aptos

# View tables
\dt

# View table schema
\d users
```

---

## Commands Reference

### NPM Scripts (Backend)

```bash
npm run dev          # Start development server
npm run build        # Build TypeScript to JavaScript
npm start            # Start production server
npm test             # Run tests
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript types
```

### PNPM Scripts (Frontend)

```bash
pnpm dev            # Start development server
pnpm build          # Build for production
pnpm start          # Start production server
pnpm lint           # Run linting
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f postgres

# Restart service
docker-compose restart postgres

# Remove all containers and volumes
docker-compose down -v
```

### Database Commands

```bash
# Create database
createdb nyu_aptos

# Drop database
dropdb nyu_aptos

# Connect to database
psql -d nyu_aptos -U postgres

# Run migration
psql -d nyu_aptos -U postgres -f migration.sql

# Export data
pg_dump nyu_aptos > backup.sql
```

---

## Next Steps

1. **Deploy Smart Contracts**
   - See [contracts/README.md](contracts/README.md)
   - Deploy to Aptos testnet

2. **Configure Production**
   - Set up production database
   - Configure production Auth0 app
   - Set up monitoring and logging

3. **Read Documentation**
   - [API Documentation](docs/API_REFERENCE.md)
   - [Authentication Guide](docs/AUTHENTICATION.md)
   - [Wallet Integration](docs/WALLET_INTEGRATION.md)

---

## Getting Help

- **Documentation**: Check the [docs/](docs/) directory
- **GitHub Issues**: Report bugs or request features
- **API Reference**: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

---

## Security Notes

⚠️ **IMPORTANT**:

- Never commit `.env` or `.env.local` files
- Use strong, randomly generated secrets
- Rotate secrets regularly in production
- Keep Auth0 credentials secure
- Use HTTPS in production
- Review [docs/COMPLIANCE_GDPR_CCPA.md](docs/COMPLIANCE_GDPR_CCPA.md)

---

**Setup complete!** You should now have a fully functional development environment. Happy coding! 🚀
