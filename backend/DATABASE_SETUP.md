# Database Setup Guide

This guide explains how to set up and configure the PostgreSQL database for the NYU Aptos Builder Camp backend.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL client tools (optional, for manual operations)

## Quick Start

### 1. Start the Database

The database runs in a Docker container defined in `docker-compose.yml`:

```bash
# From the backend directory
docker-compose up -d
```

This will start PostgreSQL on port **5433** (not the default 5432).

### 2. Initialize the Database Schema

Run the initialization script to create all tables:

```bash
# Option 1: Using the provided script (recommended)
./scripts/init-db.sh

# Option 2: Manual initialization
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/schema.sql
```

### 3. Run Migrations

Apply authentication and SSO support migrations:

```bash
# Run all migrations in order
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/001_add_auth_tables.sql
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/002_add_sso_support.sql
```

### 4. Verify Setup

Check that all tables were created successfully:

```bash
# List all tables
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos -c "\dt"

# Verify users table structure
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos -c "\d users"
```

Expected tables:
- `users` (with SSO columns)
- `user_sessions`
- `login_attempts`
- `blacklisted_tokens`
- `treasury_deposits`
- `reimbursement_requests`
- `reimbursement_approvals`
- `reimbursement_payments`
- `elections`
- `election_candidates`
- `election_votes`
- `proposals`
- `proposal_votes`
- `invoice_metadata`
- `indexer_state`

## Database Configuration

The database connection settings are in `.env`:

```env
DB_HOST=localhost
DB_PORT=5433          # Note: Non-standard port
DB_NAME=nyu_aptos
DB_USER=postgres
DB_PASSWORD=postgres
```

## Common Issues & Troubleshooting

### Error: "relation does not exist" (42P01)

**Symptoms:**
- Backend returns 500 errors
- Logs show: `ERROR code="42P01" ... "relation does not exist"`
- Auth endpoints fail with "Failed to fetch backend tokens"

**Cause:** The database tables haven't been created or migrations haven't been run.

**Fix:**

```bash
# 1. Check if database exists
docker exec -i nyu-aptos-db psql -U postgres -l | grep nyu_aptos

# 2. Check which tables exist
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos -c "\dt"

# 3. If users table is missing, run migrations
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/schema.sql
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/001_add_auth_tables.sql
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/002_add_sso_support.sql
```

### Error: "address already in use :::3001"

**Cause:** Another instance of the backend is already running.

**Fix:**

```bash
# Kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Or restart the backend
npm run dev
```

### Error: "Cannot connect to database"

**Symptoms:**
- Backend fails to start
- Error: `ECONNREFUSED`

**Fix:**

```bash
# 1. Check if Docker container is running
docker ps | grep postgres

# 2. If not running, start it
docker-compose up -d

# 3. Check container health
docker ps

# 4. View container logs
docker logs nyu-aptos-db
```

## Resetting the Database

To completely reset the database (⚠️ **WARNING: This deletes all data**):

```bash
# Option 1: Using the init script (interactive)
./scripts/init-db.sh

# Option 2: Manual reset
docker exec -i nyu-aptos-db psql -U postgres -c "DROP DATABASE IF EXISTS nyu_aptos;"
docker exec -i nyu-aptos-db psql -U postgres -c "CREATE DATABASE nyu_aptos;"
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/schema.sql
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/001_add_auth_tables.sql
docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/002_add_sso_support.sql
```

## Migration Files

Migrations should be run in this order:

1. **database/schema.sql** - Base schema with core tables
2. **database/migrations/001_add_auth_tables.sql** - Authentication tables
3. **database/migrations/002_add_sso_support.sql** - SSO and wallet support

## Verifying the Setup

After setup, test the authentication endpoints:

```bash
# 1. Start the backend
npm run dev

# 2. Test health check
curl http://localhost:3001/health

# 3. Test SSO login endpoint
curl -X POST http://localhost:3001/api/auth/sso-login \
  -H "Content-Type: application/json" \
  -d '{"auth0_id":"test_user","email":"test@nyu.edu"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "address": "0x...",
      "role": "member",
      "displayName": "test",
      "email": "test@nyu.edu"
    },
    "accessToken": "...",
    "refreshToken": "...",
    "isNewUser": true
  }
}
```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- Project Scripts: `backend/scripts/`
  - `init-db.sh` - Initialize database
  - `run-migrations.sh` - Run migrations
  - `seed-db.sh` - Seed test data
