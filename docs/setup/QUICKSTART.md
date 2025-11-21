# Quick Start - NYU Aptos Builder Camp

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+
- pnpm
- Docker Desktop (or PostgreSQL 15+)

## Installation

```bash
# 1. Clone repository
git clone https://github.com/alin9661/nyu-aptos-builder-camp.git
cd nyu-aptos-builder-camp

# 2. Run automated setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Configure Auth0 (optional for wallet-only mode)
# Edit frontend/.env.local with your Auth0 credentials
# See: docs/AUTH0_SETUP.md

# 4. Start development
./scripts/start-dev.sh
```

## Access

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Manual Start

```bash
# Terminal 1: Database
cd backend && docker-compose up -d postgres

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && pnpm dev
```

## Verification

```bash
# Check all services
./scripts/check-status.sh

# Test backend
curl http://localhost:3001/health

# Generate new secrets
./scripts/generate-secrets.sh
```

## Common Commands

```bash
# Stop all services
docker-compose down          # Stop database
# Ctrl+C in backend/frontend terminals

# View logs
docker logs -f nyu-aptos-db  # Database logs
# Backend/Frontend logs in their terminals

# Reset database
docker-compose down -v       # Remove database
docker-compose up -d postgres # Recreate
# Run migrations again
```

## Troubleshooting

**Port conflicts?**
```bash
lsof -ti:3000  # Find process on port 3000
lsof -ti:3001  # Find process on port 3001
kill -9 <PID>  # Kill the process
```

**Database issues?**
```bash
docker-compose restart postgres
docker logs nyu-aptos-db
```

**Need help?**
- Full guide: [SETUP.md](SETUP.md)
- Troubleshooting: [SETUP.md#troubleshooting](SETUP.md#troubleshooting)

---

**Next Steps**: Check out [SETUP.md](SETUP.md) for detailed documentation!
