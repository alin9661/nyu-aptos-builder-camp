# NYU Aptos Builder Camp - Backend Infrastructure

Phase 2 Backend implementation for the governance and treasury management platform built on Aptos blockchain.

## Overview

This backend provides a comprehensive API layer, database caching, event indexing, and IPFS integration for the NYU Aptos Builder Camp platform.

## Key Features

- **Wallet Signature Authentication:** JWT-based authentication using Aptos wallet signatures for secure, decentralized login
- **Real-Time WebSocket Updates:** Live event streaming via Socket.IO for treasury deposits, reimbursements, elections, and proposals
- **Invoice Upload to IPFS:** Decentralized file storage with blockchain-verified hashes and IPFS integration

## Architecture

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── aptos.ts      # Aptos SDK configuration
│   │   └── database.ts   # PostgreSQL configuration
│   ├── routes/           # API route handlers
│   │   ├── treasury.ts   # Treasury & reimbursement endpoints
│   │   ├── governance.ts # Elections & voting endpoints
│   │   └── proposals.ts  # Proposal management endpoints
│   ├── services/         # Background services
│   │   ├── indexer.ts    # Aptos event indexer
│   │   └── ipfs.ts       # IPFS integration
│   ├── utils/            # Utility functions
│   │   ├── logger.ts     # Winston logger
│   │   └── validators.ts # Request validation
│   └── index.ts          # Express server entry point
├── database/
│   └── schema.sql        # PostgreSQL database schema
├── k8s/                  # Kubernetes manifests
├── scripts/              # Docker helper scripts
├── Dockerfile            # Multi-stage Docker build
├── docker-compose.yml    # Base Docker Compose config
├── docker-compose.dev.yml   # Development overrides
├── docker-compose.prod.yml  # Production overrides
└── package.json
```

## Quick Start

### Using Docker (Recommended)

The fastest way to get started is using Docker Compose:

```bash
# Development environment with hot reload
./scripts/docker-run.sh dev

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This will start:
- Backend API (http://localhost:3001)
- PostgreSQL database (localhost:5432)
- IPFS node (http://localhost:5001)
- Redis cache (localhost:6379)
- PgAdmin (http://localhost:5050)

See [Docker Setup](#docker-setup) section for detailed instructions.

### Manual Setup

If you prefer running without Docker:

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   npm install socket.io  # For real-time WebSocket updates
   ```

2. **Setup PostgreSQL database:**
   ```bash
   createdb nyu_aptos
   psql nyu_aptos < init-scripts/01-init-db.sql
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start services:**
   ```bash
   # Terminal 1: API server
   npm run dev

   # Terminal 2: Event indexer
   npm run indexer
   ```

## Features

### 1. API Layer
RESTful API with the following endpoints:

#### Treasury
- `GET /api/treasury/balance` - Get current vault balance
- `GET /api/treasury/transactions` - Get transaction history
- `GET /api/treasury/stats` - Get treasury statistics
- `GET /api/treasury/reimbursements` - List all reimbursement requests
- `GET /api/treasury/reimbursements/:id` - Get reimbursement details
- `POST /api/treasury/reimbursements/submit` - Submit reimbursement transaction
- `POST /api/treasury/reimbursements/:id/approve` - Approve reimbursement

#### Governance
- `GET /api/governance/elections` - List all elections
- `GET /api/governance/elections/:electionId/:role` - Get election details
- `POST /api/governance/vote` - Cast vote transaction
- `GET /api/governance/roles` - Get current role assignments
- `GET /api/governance/members` - Get all e-board members
- `GET /api/governance/stats` - Get governance statistics

#### Proposals
- `GET /api/proposals` - List all proposals
- `GET /api/proposals/:id` - Get proposal details
- `POST /api/proposals/create` - Create proposal transaction
- `POST /api/proposals/:id/vote` - Vote on proposal
- `GET /api/proposals/status/active` - Get active proposals
- `GET /api/proposals/stats/overview` - Get proposal statistics

### 2. Database Layer
PostgreSQL database with optimized schema for:
- User management and roles
- Transaction caching for fast queries
- Reimbursement request tracking
- Election and voting records
- Proposal management
- Invoice metadata
- Analytics aggregations

### 3. Event Indexer
Real-time blockchain event indexer that:
- Listens to Move contract events
- Stores event data in PostgreSQL
- Maintains indexer state for resume capability
- Processes events in batches for efficiency
- Supports three indexer services:
  - Treasury Indexer (deposits, reimbursements)
  - Governance Indexer (elections, votes)
  - Proposals Indexer (proposals, votes, execution)

### 4. IPFS Integration
Decentralized file storage for invoices:
- Upload invoices to IPFS
- Store IPFS hash on-chain
- Verify file integrity against blockchain
- Pin/unpin files for persistence
- Support for multiple file types (PDF, PNG, JPG, DOC, DOCX)

## Docker Setup

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Development Environment

Start all services with hot reload:

```bash
# Using helper script (recommended)
./scripts/docker-run.sh dev

# Or using docker-compose directly
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

The development setup includes:
- Source code mounted as volumes for hot reload
- PgAdmin for database management
- Debug port exposed (9229)
- All optional services enabled (IPFS, Redis)

**Access points:**
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health
- PostgreSQL: localhost:5432 (user: postgres, pass: dev_password)
- PgAdmin: http://localhost:5050 (admin@aptos.local / admin)
- IPFS API: http://localhost:5001
- IPFS Gateway: http://localhost:8080
- Redis: localhost:6379

### Production Environment

Build and run production containers:

```bash
# Build production image
./scripts/docker-build.sh prod

# Run production environment
./scripts/docker-run.sh prod --detach

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Production features:
- Multi-stage optimized builds
- Non-root user execution
- Read-only filesystem
- Resource limits
- Health checks
- Multiple replicas
- Security hardening

### Docker Helper Scripts

#### Build Script
```bash
# Build development image
./scripts/docker-build.sh dev

# Build production image
./scripts/docker-build.sh prod

# Build with no cache
./scripts/docker-build.sh prod --no-cache

# Build and push to registry
./scripts/docker-build.sh prod --registry your-registry.com --push
```

#### Run Script
```bash
# Start development environment
./scripts/docker-run.sh dev

# Start in detached mode
./scripts/docker-run.sh dev --detach

# Start with specific services
./scripts/docker-run.sh dev --with-ipfs --with-redis

# Rebuild containers before starting
./scripts/docker-run.sh dev --build
```

#### Stop Script
```bash
# Stop services (preserve data)
./scripts/docker-stop.sh dev

# Stop and remove volumes
./scripts/docker-stop.sh dev --remove-volumes

# Full cleanup (volumes + images)
./scripts/docker-stop.sh dev --clean
```

### Docker Compose Profiles

Enable optional services using profiles:

```bash
# Start with IPFS
docker-compose --profile with-ipfs up

# Start with monitoring
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile with-monitoring up

# Start with Nginx reverse proxy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile with-nginx up
```

### Environment Configuration

Create environment files from templates:

```bash
# Development
cp .env.development .env

# Production
cp .env.production .env
# Edit .env with your production values
```

### Viewing Logs

```bash
# All services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Backend only
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=100 backend
```

### Database Management

```bash
# Access PostgreSQL CLI
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U postgres -d nyu_aptos_dev

# Backup database
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres pg_dump -U postgres nyu_aptos_dev > backup.sql

# Restore database
cat backup.sql | docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U postgres nyu_aptos_dev

# Reset database (development only)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## Kubernetes Deployment

For production Kubernetes deployment, see [k8s/README.md](k8s/README.md).

Quick deploy:

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy database
kubectl apply -f k8s/postgres.yaml

# Deploy configuration
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

## Manual Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- IPFS node (optional, local or remote)
- Redis (optional, for caching)
- Access to Aptos testnet/mainnet

### Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   npm install socket.io  # For real-time WebSocket updates
   ```

2. **Setup PostgreSQL:**
   ```bash
   createdb nyu_aptos
   psql nyu_aptos < init-scripts/01-init-db.sql
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Build TypeScript:**
   ```bash
   npm run build
   ```

5. **Start services:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Configuration

### Environment Variables

#### Server Configuration
- `NODE_ENV` - Environment (development, production)
- `PORT` - Server port (default: 3001)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `CORS_ORIGIN` - Allowed CORS origins

#### Database Configuration
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_POOL_SIZE` - Connection pool size

#### Aptos Configuration
- `APTOS_NETWORK` - Network (testnet, mainnet, devnet)
- `APTOS_NODE_URL` - Full node URL
- `APTOS_INDEXER_URL` - Indexer GraphQL URL
- `MODULE_ADDRESS` - Deployed module address

#### IPFS Configuration
- `IPFS_HOST` - IPFS host
- `IPFS_PORT` - IPFS API port
- `IPFS_PROTOCOL` - Protocol (http, https)
- `IPFS_PROJECT_ID` - Infura project ID (optional)
- `IPFS_PROJECT_SECRET` - Infura secret (optional)

#### Security
- `API_KEY` - API authentication key
- `JWT_SECRET` - JWT signing secret

## API Usage Examples

### Health Check
```bash
curl http://localhost:3001/health
```

### Get Treasury Balance
```bash
curl http://localhost:3001/api/treasury/balance
```

### Get Reimbursement Requests
```bash
curl http://localhost:3001/api/treasury/reimbursements?page=1&limit=20
```

### Get Active Proposals
```bash
curl http://localhost:3001/api/proposals/status/active
```

### Submit Transaction
```bash
curl -X POST http://localhost:3001/api/treasury/reimbursements/submit \
  -H "Content-Type: application/json" \
  -d '{"transactionHash": "0x..."}'
```

## Development

### Project Structure
- `src/` - TypeScript source code
- `dist/` - Compiled JavaScript (generated)
- `logs/` - Application logs
- `k8s/` - Kubernetes manifests
- `scripts/` - Helper scripts
- `init-scripts/` - Database initialization scripts

### Development Workflow

```bash
# Start with hot reload
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build
npm run build
```

### Adding New Routes

1. Create route file in `src/routes/`
2. Import in `src/index.ts`
3. Register with `app.use()`

### Database Migrations

For schema changes:
1. Create migration SQL file
2. Test on development database
3. Apply to production with backup

## Monitoring and Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output (development)

View logs:
```bash
# Real-time logs
tail -f logs/combined.log

# Docker logs
docker-compose logs -f backend
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
pg_isready

# Test connection
psql -h localhost -U postgres -d nyu_aptos

# Docker: Check database logs
docker-compose logs postgres
```

### IPFS Connection Issues
```bash
# Check IPFS status
ipfs id

# Test API
curl http://localhost:5001/api/v0/id

# Docker: Check IPFS logs
docker-compose logs ipfs
```

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Docker Issues
```bash
# Clean up all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild containers
docker-compose up --build

# View container logs
docker-compose logs -f backend
```

## Security Considerations

- Never commit `.env` files
- Use environment variables for secrets
- Validate all API inputs
- Implement rate limiting in production
- Use HTTPS in production
- Sanitize database queries (parameterized queries)
- Verify transaction signatures on-chain
- Run containers as non-root user
- Use read-only filesystem in production

## Performance Optimization

- Database indexes on frequently queried columns
- Connection pooling for PostgreSQL
- Event batch processing in indexer
- Redis caching for frequently accessed data
- Pagination for large result sets
- Docker multi-stage builds for smaller images
- Resource limits in production

## Production Deployment

### Pre-deployment Checklist

- [ ] Update all secrets and environment variables
- [ ] Configure production database with backups
- [ ] Set up IPFS pinning service (Pinata/Infura)
- [ ] Enable HTTPS/TLS
- [ ] Configure monitoring and alerts
- [ ] Set up log aggregation
- [ ] Configure rate limiting
- [ ] Review security settings
- [ ] Test disaster recovery procedures
- [ ] Configure auto-scaling (Kubernetes HPA)

### Deployment Options

1. **Docker Compose** - Simple single-server deployment
2. **Kubernetes** - Production-grade orchestration
3. **Cloud Platforms** - AWS ECS, GCP Cloud Run, Azure Container Instances
4. **Traditional** - PM2 on VPS

See [k8s/README.md](k8s/README.md) for Kubernetes deployment guide.

## Integration with Frontend

The frontend should:
1. Build and sign transactions with Aptos SDK
2. Submit signed transactions to blockchain
3. Send transaction hash to backend for tracking
4. Poll backend API for status and data

Example flow:
```typescript
// 1. Build transaction
const transaction = await buildTransaction(...);

// 2. Sign with wallet
const signedTx = await wallet.signAndSubmitTransaction(transaction);

// 3. Track in backend
await fetch('http://localhost:3001/api/treasury/reimbursements/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transactionHash: signedTx.hash })
});

// 4. Poll for updates
const status = await fetch(`http://localhost:3001/api/treasury/reimbursements/${id}`);
```

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review Docker logs: `docker-compose logs`
- Verify configuration in `.env`
- Check database connectivity
- Ensure blockchain network is accessible
- Review [k8s/README.md](k8s/README.md) for Kubernetes issues

## License

MIT
