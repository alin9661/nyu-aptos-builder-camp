# Complete Command Reference - NYU Aptos Builder Camp

This document contains all commands used throughout the development and setup of the NYU Aptos Builder Camp application.

## Table of Contents

- [Initial Setup Commands](#initial-setup-commands)
- [Git Commands](#git-commands)
- [Docker Commands](#docker-commands)
- [Database Commands](#database-commands)
- [Node.js & Package Management](#nodejs--package-management)
- [Development Commands](#development-commands)
- [Testing Commands](#testing-commands)
- [Helper Scripts](#helper-scripts)
- [Debugging Commands](#debugging-commands)
- [Cleanup Commands](#cleanup-commands)

---

## Initial Setup Commands

### Clone Repository
```bash
git clone https://github.com/alin9661/nyu-aptos-builder-camp.git
cd nyu-aptos-builder-camp
```

### Automated Setup (Recommended)
```bash
# Make scripts executable
chmod +x scripts/setup.sh
chmod +x scripts/start-dev.sh
chmod +x scripts/check-status.sh
chmod +x scripts/generate-secrets.sh
chmod +x scripts/cleanup.sh

# Run automated setup
./scripts/setup.sh
```

### Manual Setup
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# Generate secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For SESSION_SECRET
openssl rand -hex 32  # For WALLET_ENCRYPTION_SECRET
openssl rand -hex 32  # For AUTH0_SECRET

# Install dependencies
cd backend && npm install
cd ../frontend && pnpm install
```

---

## Git Commands

### Basic Operations
```bash
# Check status
git status

# View changes
git diff
git diff HEAD
git diff main...HEAD

# View commit history
git log --oneline
git log --oneline -10
git log main..HEAD --oneline

# Stage changes
git add .
git add <file>

# Commit changes
git commit -m "commit message"

# Push to remote
git push origin <branch-name>
git push -u origin <branch-name>  # First time
```

### Branch Operations
```bash
# Create new branch
git checkout -b feature/branch-name

# Switch branches
git checkout main
git checkout <branch-name>

# View branches
git branch
git branch -a  # Include remote branches
```

### Pull Request
```bash
# Create PR using GitHub CLI
gh pr create --title "Title" --body "Description"

# View PR
gh pr view <number>
gh pr list
```

---

## Docker Commands

### Container Management
```bash
# Start all services
docker-compose up
docker-compose up -d  # Detached mode

# Start specific service
docker-compose up -d postgres
docker-compose up -d backend

# Stop services
docker-compose down
docker-compose down -v  # Remove volumes (deletes data!)

# Restart services
docker-compose restart
docker-compose restart postgres

# View running containers
docker ps
docker ps -a  # Include stopped containers

# View logs
docker logs nyu-aptos-db
docker logs -f nyu-aptos-db  # Follow logs
docker-compose logs
docker-compose logs -f postgres
```

### Container Inspection
```bash
# Inspect container
docker inspect nyu-aptos-db

# Check container health
docker inspect nyu-aptos-db | grep -A 10 Health

# Execute commands in container
docker exec -it nyu-aptos-db bash
docker exec nyu-aptos-db psql -U postgres -d nyu_aptos
```

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect backend_postgres_data

# Remove volumes
docker volume rm backend_postgres_data
docker-compose down -v  # Remove all volumes
```

### Cleanup
```bash
# Remove stopped containers
docker-compose rm

# Remove all unused resources
docker system prune -a

# Remove specific container
docker rm nyu-aptos-db
```

---

## Database Commands

### PostgreSQL Server
```bash
# Check if PostgreSQL is running
pg_isready
pg_isready -h localhost -p 5432

# Start PostgreSQL (macOS)
brew services start postgresql@16
brew services stop postgresql@16
brew services restart postgresql@16

# Start PostgreSQL (Linux)
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql
```

### Database Management
```bash
# Create database
createdb nyu_aptos
createdb -U postgres nyu_aptos

# Drop database
dropdb nyu_aptos
dropdb -U postgres nyu_aptos

# List databases
psql -U postgres -l
```

### Connect to Database
```bash
# Local connection
psql -d nyu_aptos -U postgres

# Docker connection
docker exec -it nyu-aptos-db psql -U postgres -d nyu_aptos

# Remote connection
psql -h localhost -p 5432 -U postgres -d nyu_aptos
```

### Run Migrations
```bash
# Local database
psql -d nyu_aptos -U postgres -f database/migrations/001_add_auth_tables.sql
psql -d nyu_aptos -U postgres -f database/migrations/002_add_sso_support.sql
psql -d nyu_aptos -U postgres -f database/migrations/003_add_notifications.sql
psql -d nyu_aptos -U postgres -f database/migrations/003_add_wallet_audit_logs.sql

# Docker database
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/001_add_auth_tables.sql
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/002_add_sso_support.sql
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/003_add_notifications.sql
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/003_add_wallet_audit_logs.sql
```

### Database Queries
```bash
# Inside psql
\dt                    # List tables
\d users              # Describe table
\l                     # List databases
\c nyu_aptos          # Connect to database
\q                     # Quit

# From command line
psql -d nyu_aptos -U postgres -c "\dt"
psql -d nyu_aptos -U postgres -c "SELECT COUNT(*) FROM users;"
```

### Backup & Restore
```bash
# Backup database
pg_dump -U postgres nyu_aptos > backup.sql
pg_dump nyu_aptos > backup-$(date +%Y%m%d).sql

# Restore database
psql -U postgres nyu_aptos < backup.sql

# Docker backup
docker exec nyu-aptos-db pg_dump -U postgres nyu_aptos > backup.sql

# Docker restore
docker exec -i nyu-aptos-db psql -U postgres nyu_aptos < backup.sql
```

---

## Node.js & Package Management

### Backend (npm)
```bash
cd backend

# Install dependencies
npm install
npm ci  # Clean install

# Install specific package
npm install <package-name>
npm install --save-dev <package-name>

# Update dependencies
npm update
npm outdated  # Check for updates
```

### Frontend (pnpm)
```bash
cd frontend

# Install pnpm globally
npm install -g pnpm

# Install dependencies
pnpm install
pnpm install --frozen-lockfile  # Exact versions

# Install specific package
pnpm add <package-name>
pnpm add -D <package-name>

# Update dependencies
pnpm update
pnpm outdated
```

### Version Checks
```bash
# Check Node.js version
node --version
node -v

# Check npm version
npm --version

# Check pnpm version
pnpm --version
```

---

## Development Commands

### Start Development Servers

#### Using Helper Scripts
```bash
# Start all services
./scripts/start-dev.sh

# Check service status
./scripts/check-status.sh
```

#### Manual Start
```bash
# Terminal 1: PostgreSQL (Docker)
cd backend
docker-compose up -d postgres

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
pnpm dev
```

### Build Commands
```bash
# Backend
cd backend
npm run build      # Compile TypeScript
npm start          # Run production build

# Frontend
cd frontend
pnpm build         # Build for production
pnpm start         # Run production server
```

### Linting & Type Checking
```bash
# Backend
cd backend
npm run lint       # Run ESLint
npm run typecheck  # TypeScript type checking

# Frontend
cd frontend
pnpm lint          # Run ESLint
```

---

## Testing Commands

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# CI mode
npm run test:ci
```

### Smart Contract Tests
```bash
cd contracts

# Compile contracts
aptos move compile

# Run tests
aptos move test

# Deploy to testnet
aptos move publish --named-addresses nyu_aptos_builder_camp=<ADDRESS>
```

---

## Helper Scripts

All scripts are in the `scripts/` directory and are executable.

### Setup Script
```bash
./scripts/setup.sh
```
- Checks prerequisites
- Creates .env files
- Generates secrets
- Installs dependencies
- Sets up database
- Runs migrations

### Start Development
```bash
./scripts/start-dev.sh
```
- Checks configuration
- Starts PostgreSQL
- Opens backend/frontend terminals

### Check Status
```bash
./scripts/check-status.sh
```
- Verifies PostgreSQL running
- Checks backend (port 3001)
- Checks frontend (port 3000)
- Tests health endpoints

### Generate Secrets
```bash
./scripts/generate-secrets.sh
```
- Generates 4 secure secrets
- Displays formatted output
- Includes security warnings

### Cleanup
```bash
./scripts/cleanup.sh
```
- Stops all processes
- Removes Docker containers
- Cleans node_modules
- Removes build artifacts

---

## Debugging Commands

### Check Running Processes
```bash
# Check specific ports
lsof -ti:3000  # Frontend
lsof -ti:3001  # Backend
lsof -ti:5432  # PostgreSQL
lsof -ti:5433  # PostgreSQL (alternate)

# Kill process on port
kill -9 $(lsof -ti:3001)
```

### Check Service Health
```bash
# Backend health check
curl http://localhost:3001/health
curl http://localhost:3001/health | jq  # Pretty print JSON

# Frontend check
curl http://localhost:3000
```

### View Logs
```bash
# Docker logs
docker logs nyu-aptos-db
docker logs -f nyu-aptos-db --tail 100

# Backend logs (in terminal where npm run dev is running)
# Or check logs directory if configured
tail -f backend/logs/app.log
```

### Network & Connectivity
```bash
# Test PostgreSQL connection
psql -h localhost -p 5432 -U postgres -d nyu_aptos

# Test backend API
curl -X POST http://localhost:3001/api/auth/nonce

# Check open ports
netstat -an | grep LISTEN
sudo lsof -i -P | grep LISTEN
```

---

## Cleanup Commands

### Manual Cleanup
```bash
# Stop backend
kill $(lsof -ti:3001)

# Stop frontend
kill $(lsof -ti:3000)

# Stop Docker
cd backend
docker-compose down
docker-compose down -v  # With volumes

# Remove node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules

# Remove build artifacts
rm -rf backend/dist
rm -rf frontend/.next
rm -rf frontend/out

# Remove logs
rm -rf backend/logs
```

### Automated Cleanup
```bash
# Run cleanup script (interactive)
./scripts/cleanup.sh
```

### Complete Reset
```bash
# Nuclear option - removes everything
./scripts/cleanup.sh  # Answer 'y' to all prompts
rm backend/.env
rm frontend/.env.local

# Then start fresh
./scripts/setup.sh
```

---

## Quick Reference Commands

### Daily Development Workflow
```bash
# Morning - Start services
cd nyu-aptos-builder-camp
./scripts/start-dev.sh

# During development - Check status
./scripts/check-status.sh

# Evening - Stop services
# Ctrl+C in backend/frontend terminals
cd backend && docker-compose down
```

### Common Troubleshooting
```bash
# Port conflict
lsof -ti:3001 && kill -9 $(lsof -ti:3001)

# Database connection issue
docker-compose restart postgres

# Fresh start
./scripts/cleanup.sh
./scripts/setup.sh
```

### Git Workflow
```bash
# Make changes
git status
git diff

# Commit
git add .
git commit -m "description"

# Push
git push origin <branch>

# Create PR
gh pr create --title "Title" --body "Description"
```

---

## Environment Variables

### Backend (.env)
```bash
# Database
DB_PASSWORD=your_password
DB_PORT=5432

# Security
JWT_SECRET=<generated-32-char-hex>
SESSION_SECRET=<generated-32-char-hex>
WALLET_ENCRYPTION_SECRET=<generated-32-char-hex>
```

### Frontend (.env.local)
```bash
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Auth0
AUTH0_SECRET=<generated-32-char-hex>
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
```

---

## Useful Aliases (Optional)

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# NYU Aptos shortcuts
alias nyu-setup='cd ~/nyu-aptos-builder-camp && ./scripts/setup.sh'
alias nyu-start='cd ~/nyu-aptos-builder-camp && ./scripts/start-dev.sh'
alias nyu-status='cd ~/nyu-aptos-builder-camp && ./scripts/check-status.sh'
alias nyu-clean='cd ~/nyu-aptos-builder-camp && ./scripts/cleanup.sh'

# Quick navigation
alias nyu='cd ~/nyu-aptos-builder-camp'
alias nyu-be='cd ~/nyu-aptos-builder-camp/backend'
alias nyu-fe='cd ~/nyu-aptos-builder-camp/frontend'

# Docker shortcuts
alias nyu-db='docker exec -it nyu-aptos-db psql -U postgres -d nyu_aptos'
alias nyu-logs='docker logs -f nyu-aptos-db'
```

---

## Summary of Commands Used in This Session

### Project Setup
1. Created SETUP.md with comprehensive instructions
2. Created README.md with project overview
3. Created automation scripts (setup.sh, start-dev.sh, etc.)
4. Configured environment files

### Git Operations
1. Created feature branch: `feat/nyu-sso-wallet-integration`
2. Made multiple commits with features
3. Created Pull Request #7
4. Pushed documentation and scripts

### Docker Operations
1. Started PostgreSQL container
2. Ran database migrations
3. Managed volumes and containers
4. Cleaned up resources

### Development
1. Installed dependencies (npm, pnpm)
2. Started development servers
3. Tested endpoints
4. Fixed integration issues

All commands are now available as helper scripts for easy reuse!

---

**Last Updated**: 2025-11-15
**Project**: NYU Aptos Builder Camp
**Repository**: https://github.com/alin9661/nyu-aptos-builder-camp
