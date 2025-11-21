# Docker Quickstart Guide

Get the entire NYU Aptos Nexus application running in under 5 minutes with Docker!

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Accessing Services](#accessing-services)
- [Common Commands](#common-commands)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** (v20.10 or higher)
  - macOS: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - Windows: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)

- **Docker Compose** (usually included with Docker Desktop)
  - Verify: `docker compose version`

That's it! No need to install Node.js, PostgreSQL, IPFS, or any other dependencies locally.

## Quick Start

### One-Command Setup

```bash
# Clone the repository (if you haven't already)
git clone <repository-url>
cd NYUxAptos

# Run the automated setup script
npm run docker:setup
```

This single command will:
1. ✅ Create `.env` file with auto-generated secrets
2. ✅ Build all Docker images (frontend, backend, database)
3. ✅ Initialize PostgreSQL database with schema
4. ✅ Apply all database migrations
5. ✅ Start all services

**Wait 2-3 minutes** for the initial build and setup to complete.

### Verify Installation

```bash
# Check running services
npm run docker:ps

# Or use docker compose directly
docker compose ps
```

You should see all services running and healthy:
- ✅ `nyu-aptos-frontend-dev` - Frontend Next.js app
- ✅ `nyu-aptos-backend-dev` - Backend Express API
- ✅ `nyu-aptos-db` - PostgreSQL database
- ✅ `nyu-aptos-pgadmin` - Database management UI
- ✅ `nyu-aptos-ipfs` - IPFS node (optional)
- ✅ `nyu-aptos-redis` - Redis cache (optional)

## Accessing Services

Once the services are running, you can access:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:3001 | - |
| **API Health** | http://localhost:3001/health | - |
| **PgAdmin** | http://localhost:5050 | Email: `admin@aptos.local`<br>Password: `admin` |
| **IPFS Gateway** | http://localhost:8080 | - |
| **IPFS API** | http://localhost:5001 | - |

### PgAdmin Database Connection

To connect to the database in PgAdmin:

1. Open http://localhost:5050
2. Login with credentials above
3. Right-click "Servers" → "Register" → "Server"
4. **General Tab:**
   - Name: `NYU Aptos Database`
5. **Connection Tab:**
   - Host: `postgres`
   - Port: `5432`
   - Database: `nyu_aptos_dev`
   - Username: `postgres`
   - Password: `dev_password`

## Common Commands

### Starting Services

```bash
# Start all services in development mode
npm run docker:dev

# Start in production mode
npm run docker:prod

# Start with logs
npm run docker:start -- --logs

# Rebuild and start
npm run docker:start -- --build
```

### Stopping Services

```bash
# Stop all services (data is preserved)
npm run docker:stop

# Stop and remove all data
./scripts/docker-stop.sh --remove-volumes
```

### Viewing Logs

```bash
# View all logs
npm run docker:logs

# View logs for specific service
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f postgres
```

### Restarting Services

```bash
# Restart all services
npm run docker:restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

### Accessing Container Shells

```bash
# Access backend container
npm run docker:exec:backend

# Access frontend container
npm run docker:exec:frontend

# Access database directly
npm run docker:exec:db
```

### Building Images

```bash
# Build all images
npm run docker:build

# Build specific service
docker compose build frontend
docker compose build backend
```

### Complete Cleanup

```bash
# Remove everything (containers, volumes, images)
npm run docker:clean
```

⚠️ **Warning:** This will delete all data! Use with caution.

## Configuration

### Environment Variables

The `.env` file is auto-generated during setup. To customize:

```bash
# Edit environment variables
nano .env
# or
code .env

# Restart services to apply changes
npm run docker:restart
```

### Required Configuration

After initial setup, you need to configure:

1. **Auth0 Credentials** (for SSO)
   ```env
   AUTH0_ISSUER_BASE_URL=https://YOUR_DOMAIN.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   ```

2. **Smart Contract Address** (after deployment)
   ```env
   MODULE_ADDRESS=0x1234567890abcdef...
   NEXT_PUBLIC_MODULE_ADDRESS=0x1234567890abcdef...
   ```

### Auto-Generated Secrets

These are automatically generated during setup:
- `API_KEY` - Backend API authentication
- `JWT_SECRET` - JWT token signing
- `JWT_REFRESH_SECRET` - Refresh token signing
- `SESSION_SECRET` - Session encryption
- `WALLET_ENCRYPTION_SECRET` - Wallet key encryption
- `AUTH0_SECRET` - Auth0 session encryption

**Never commit these to version control!**

## Troubleshooting

### Port Already in Use

If you see errors about ports already in use:

```bash
# Check what's using the port
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # PostgreSQL

# Kill the process or change ports in .env
```

### Services Not Starting

```bash
# Check Docker daemon
docker info

# View detailed logs
docker compose logs --tail=100

# Restart Docker Desktop
```

### Database Connection Issues

```bash
# Check database health
docker compose ps postgres

# View database logs
docker compose logs postgres

# Restart database
docker compose restart postgres
```

### Hot Reload Not Working

Ensure you're running in development mode:

```bash
# Check which compose file is active
docker compose config

# Restart in dev mode
docker compose down
npm run docker:dev
```

### Out of Disk Space

```bash
# Clean up unused Docker resources
docker system prune -a

# Remove old volumes
docker volume prune
```

### Permission Denied on Scripts

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

## Advanced Usage

### Production Deployment

For production, use the production compose file:

```bash
# Start in production mode
npm run docker:prod

# Or use compose directly
docker compose -f docker-compose.yml up -d
```

Key differences in production mode:
- ✅ Optimized builds (no source maps)
- ✅ Multi-stage Dockerfiles (smaller images)
- ✅ Non-root users for security
- ✅ Resource limits
- ✅ Health checks enabled
- ✅ No hot reload

### Using Profiles

Enable optional services:

```bash
# Start with IPFS
docker compose --profile with-ipfs up -d

# Start with Redis
docker compose --profile with-redis up -d

# Start with all optional services
docker compose --profile full up -d
```

### Custom Database Migrations

To run custom migrations:

```bash
# Copy migration file to container
docker compose cp ./path/to/migration.sql postgres:/tmp/

# Execute migration
docker compose exec postgres psql -U postgres -d nyu_aptos_dev -f /tmp/migration.sql
```

### Backup and Restore

**Backup Database:**
```bash
docker compose exec postgres pg_dump -U postgres nyu_aptos_dev > backup.sql
```

**Restore Database:**
```bash
docker compose exec -T postgres psql -U postgres -d nyu_aptos_dev < backup.sql
```

### Performance Tuning

**Adjust PostgreSQL resources:**
```yaml
# In docker-compose.override.yml
services:
  postgres:
    environment:
      POSTGRES_SHARED_BUFFERS: 256MB
      POSTGRES_MAX_CONNECTIONS: 100
```

**Adjust Redis memory:**
```bash
# In docker-compose.override.yml
services:
  redis:
    command: redis-server --maxmemory 512mb
```

### Development Workflow

1. **Make code changes** - Files are mounted as volumes, changes reflect immediately
2. **View logs** - `npm run docker:logs`
3. **Restart if needed** - `npm run docker:restart`
4. **Test changes** - Access http://localhost:3000
5. **Debug** - Use port 9229 for Node.js debugging

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and test
        run: |
          docker compose build
          docker compose up -d
          docker compose exec -T backend npm test
```

## Next Steps

Now that your Docker environment is running:

1. ✅ Configure Auth0 credentials in `.env`
2. ✅ Deploy smart contracts to Aptos testnet
3. ✅ Update `MODULE_ADDRESS` in `.env`
4. ✅ Restart services: `npm run docker:restart`
5. ✅ Start building your governance features!

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Main Project README](../../README.md)
- [Backend Setup Guide](../backend/QUICKSTART.md)
- [Frontend Integration Guide](../frontend/wallet/INTEGRATION_GUIDE.md)

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. View logs: `npm run docker:logs`
3. Check service status: `npm run docker:ps`
4. Review [GitHub Issues](https://github.com/your-repo/issues)

---

**Happy Building!** 🚀
