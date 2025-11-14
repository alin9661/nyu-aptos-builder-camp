# Quick Start Guide

Get the NYU Aptos Backend up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git installed

## 5-Minute Setup

### 1. Install Dependencies (1 min)

```bash
cd backend
npm install
```

### 2. Setup Database (1 min)

```bash
# Create database
createdb nyu_aptos

# Initialize schema
psql nyu_aptos < database/schema.sql
```

### 3. Configure Environment (1 min)

```bash
# Copy example env file
cp .env.example .env

# Edit .env - Minimal required changes:
# - DB_PASSWORD=your_postgres_password
# - MODULE_ADDRESS=0x1  # Will update after deploying contracts
```

### 4. Start Services (2 min)

```bash
# Terminal 1 - Start API server
npm run dev

# Terminal 2 - Start indexer
npm run indexer
```

### 5. Verify (30 sec)

```bash
# Check health
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","database":"connected",...}
```

## Common Commands

### Development
```bash
npm run dev        # Start API server with hot reload
npm run indexer    # Start event indexer
npm run build      # Build TypeScript
npm run lint       # Run ESLint
npm run typecheck  # Type checking only
```

### Database
```bash
# Connect to database
psql nyu_aptos

# Reset database (WARNING: deletes all data)
dropdb nyu_aptos && createdb nyu_aptos && psql nyu_aptos < database/schema.sql

# Backup database
pg_dump nyu_aptos > backup_$(date +%Y%m%d).sql

# Restore database
psql nyu_aptos < backup_YYYYMMDD.sql
```

### Testing Endpoints
```bash
# Get treasury balance
curl http://localhost:3001/api/treasury/balance

# Get reimbursements
curl http://localhost:3001/api/treasury/reimbursements

# Get elections
curl http://localhost:3001/api/governance/elections

# Get proposals
curl http://localhost:3001/api/proposals
```

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── routes/         # API endpoints
│   ├── services/       # Background services
│   ├── utils/          # Helper functions
│   └── index.ts        # Main server
├── database/
│   └── schema.sql      # Database schema
└── logs/               # Application logs
```

## Environment Variables

### Required
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nyu_aptos
DB_USER=postgres
DB_PASSWORD=your_password
MODULE_ADDRESS=0x1
```

### Optional (defaults provided)
```bash
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
APTOS_NETWORK=testnet
```

## Troubleshooting

### "Database connection failed"
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql@14

# Start PostgreSQL (Linux)
sudo systemctl start postgresql
```

### "Port 3001 already in use"
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env
PORT=3002
```

### "Module not found"
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

### "TypeScript errors"
```bash
# Rebuild
npm run build

# Check types
npm run typecheck
```

## Next Steps

1. **Deploy Smart Contracts**
   - Deploy Move contracts to Aptos testnet
   - Update `MODULE_ADDRESS` in `.env`

2. **Configure IPFS**
   - Setup local IPFS node OR
   - Sign up for Pinata/Infura
   - Update IPFS settings in `.env`

3. **Integrate with Frontend**
   - See `/backend/INTEGRATION.md`
   - Configure frontend `.env` with backend URL

4. **Production Deployment**
   - See `/backend/DEPLOYMENT.md`
   - Setup production database
   - Configure reverse proxy (Nginx)
   - Enable SSL/TLS

## Useful SQL Queries

```sql
-- Check indexer status
SELECT * FROM indexer_state;

-- Count events
SELECT
    (SELECT COUNT(*) FROM treasury_deposits) as deposits,
    (SELECT COUNT(*) FROM reimbursement_requests) as reimbursements,
    (SELECT COUNT(*) FROM proposals) as proposals;

-- Recent reimbursements
SELECT id, amount, approved_advisor, approved_president, approved_vice, paid_out
FROM reimbursement_requests
ORDER BY created_ts DESC
LIMIT 5;

-- Election results
SELECT e.role_name, e.winner, u.display_name
FROM elections e
LEFT JOIN users u ON e.winner = u.address
WHERE e.finalized = true
ORDER BY e.start_ts DESC;
```

## API Examples

### Get Treasury Balance
```bash
curl http://localhost:3001/api/treasury/balance
```

### Get Reimbursements with Pagination
```bash
curl "http://localhost:3001/api/treasury/reimbursements?page=1&limit=10&sort=desc"
```

### Get Specific Reimbursement
```bash
curl http://localhost:3001/api/treasury/reimbursements/1
```

### Get Active Proposals
```bash
curl http://localhost:3001/api/proposals/status/active
```

### Get Treasury Statistics
```bash
curl http://localhost:3001/api/treasury/stats
```

## Log Files

```bash
# View real-time logs
tail -f logs/combined.log

# View only errors
tail -f logs/error.log

# Search logs
grep "error" logs/combined.log
grep "Indexed" logs/combined.log
```

## Development Tips

### Hot Reload
The dev server uses nodemon for automatic reloading when files change.

### Database Schema Changes
After modifying `schema.sql`:
```bash
dropdb nyu_aptos
createdb nyu_aptos
psql nyu_aptos < database/schema.sql
```

### Testing with Mock Data
```sql
-- Insert test user
INSERT INTO users (address, role, display_name)
VALUES ('0x1234...', 'eboard_member', 'Test User');

-- Insert test proposal
INSERT INTO proposals (proposal_id, creator, title, description, start_ts, end_ts, status, transaction_hash, version, block_height)
VALUES (1, '0x1234...', 'Test Proposal', 'Description', 1699000000, 1699100000, 1, '0xabc', 1, 1);
```

### Debugging
```typescript
// Add debug logging
import { logger } from './utils/logger';

logger.debug('Debug info', { data: someData });
logger.info('Info message');
logger.error('Error occurred', { error });
```

## Resources

- [Full README](./README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Integration Guide](./INTEGRATION.md)
- [Aptos Docs](https://aptos.dev/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## Getting Help

1. Check logs: `tail -f logs/combined.log`
2. Verify database: `psql nyu_aptos`
3. Test endpoints: Use curl commands above
4. Review error messages in console

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│ NYU Aptos Backend - Quick Reference         │
├─────────────────────────────────────────────┤
│ Start API:    npm run dev                   │
│ Start Indexer: npm run indexer              │
│ Health Check: curl localhost:3001/health    │
│ Database:     psql nyu_aptos                │
│ Logs:         tail -f logs/combined.log     │
│ Port:         3001 (default)                │
│ Docs:         /backend/README.md            │
└─────────────────────────────────────────────┘
```

Happy coding! 🚀
