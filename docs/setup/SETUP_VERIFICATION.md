# Setup Verification Checklist

Use this checklist to verify your Docker setup is complete and working.

## Pre-flight Checklist

### 1. File Permissions
Make scripts executable:
```bash
cd /Users/aaronlin/Downloads/Projects/NYUxAptos/backend
chmod +x scripts/docker-build.sh
chmod +x scripts/docker-run.sh
chmod +x scripts/docker-stop.sh
```

Verify:
```bash
ls -lh scripts/
# Should show: -rwxr-xr-x for all .sh files
```

### 2. Environment Configuration
Create your .env file:
```bash
# For development
cp .env.development .env

# Or for production
cp .env.production .env
# Then edit .env with your actual values
```

Verify:
```bash
cat .env | grep -v "^#" | grep "="
# Should show all required environment variables
```

### 3. Docker Installation
Check Docker and Docker Compose:
```bash
docker --version
# Should show: Docker version 20.10.0 or higher

docker-compose --version
# Should show: Docker Compose version 2.0.0 or higher
```

## Development Environment Test

### Step 1: Start Services
```bash
./scripts/docker-run.sh dev --detach
```

Expected output:
```
Starting NYU Aptos Backend in dev mode
Services started successfully in detached mode!
```

### Step 2: Verify Services Are Running
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

Expected output should show:
- [x] nyu-aptos-backend-dev (Up, healthy)
- [x] nyu-aptos-db (Up, healthy)
- [x] nyu-aptos-ipfs (Up, healthy)
- [x] nyu-aptos-redis (Up, healthy)
- [x] nyu-aptos-pgadmin (Up)

### Step 3: Test Backend Health
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "environment": "development",
  "database": "connected",
  "network": {...}
}
```

### Step 4: Test Database
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U postgres -d nyu_aptos_dev -c "SELECT COUNT(*) FROM proposals;"
```

Expected: Should return 0 (or number of existing proposals)

### Step 5: Test PgAdmin
Open browser to: http://localhost:5050
- Username: admin@aptos.local
- Password: admin

### Step 6: Test IPFS
```bash
curl http://localhost:5001/api/v0/id
```

Expected: Should return IPFS node information

### Step 7: Test Redis
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec redis redis-cli ping
```

Expected response: `PONG`

### Step 8: View Logs
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs backend
```

Expected: Should see server startup logs without errors

### Step 9: Test API Endpoints
```bash
# Test treasury balance
curl http://localhost:3001/api/treasury/balance

# Test proposals
curl http://localhost:3001/api/proposals

# Test governance
curl http://localhost:3001/api/governance/roles
```

Expected: Each should return JSON responses (may be empty arrays initially)

### Step 10: Stop Services
```bash
./scripts/docker-stop.sh dev
```

Expected output:
```
Services stopped successfully!
Volumes removed: No (data persisted)
```

## Production Build Test

### Step 1: Build Production Image
```bash
./scripts/docker-build.sh prod
```

Expected output:
```
Build successful!
Image size: ~XXX MB
```

### Step 2: Verify Image
```bash
docker images | grep nyu-aptos-backend
```

Expected: Should show production images with tags

### Step 3: Test Production Container
```bash
# Create minimal .env for testing
cat > .env.test << EOF
NODE_ENV=production
DB_HOST=host.docker.internal
DB_PORT=5432
DB_NAME=test
DB_USER=postgres
DB_PASSWORD=test
APTOS_NETWORK=testnet
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
MODULE_ADDRESS=0x1
CORS_ORIGIN=*
EOF

# Run container (won't connect to DB, but should start)
docker run --rm -p 3001:3001 --env-file .env.test nyu-aptos-backend:prod &
sleep 5

# Test health endpoint (DB will fail, but server should respond)
curl http://localhost:3001/health

# Stop container
docker stop $(docker ps -q --filter ancestor=nyu-aptos-backend:prod)
rm .env.test
```

## Kubernetes Setup Test (Optional)

### Step 1: Verify Manifests
```bash
# Validate YAML syntax
kubectl apply --dry-run=client -f k8s/namespace.yaml
kubectl apply --dry-run=client -f k8s/deployment.yaml
kubectl apply --dry-run=client -f k8s/service.yaml
```

Expected: No errors

### Step 2: Test on Minikube (if available)
```bash
# Start minikube
minikube start

# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml

# Wait for database
kubectl wait --for=condition=ready pod -l app=postgres -n nyu-aptos --timeout=120s

# Apply deployment
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Check status
kubectl get all -n nyu-aptos

# Cleanup
kubectl delete namespace nyu-aptos
minikube stop
```

## Common Issues and Solutions

### Issue: Scripts Not Executable
```bash
chmod +x scripts/*.sh
```

### Issue: Port Already in Use
```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Issue: Database Connection Failed
```bash
# Check database logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs postgres

# Wait for database to be ready
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres pg_isready
```

### Issue: Container Won't Start
```bash
# View detailed logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=100 backend

# Check container status
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

# Rebuild without cache
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build --force-recreate
```

### Issue: Permission Denied in Container
```bash
# Run as root to check permissions
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -u root backend sh

# Fix permissions
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -u root backend chown -R nodeuser:nodeuser /app
```

### Issue: Out of Disk Space
```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a --volumes
```

## Performance Benchmarks

### Development Environment
Expected resource usage:
- Backend: ~200-300 MB RAM
- PostgreSQL: ~50-100 MB RAM
- Redis: ~10-20 MB RAM
- IPFS: ~100-200 MB RAM
- Total: ~500 MB RAM, minimal CPU

### Production Environment
Expected resource usage:
- Backend (per replica): ~256-512 MB RAM
- PostgreSQL: ~1-2 GB RAM
- Redis: ~256-512 MB RAM

## Security Checks

### Check for Secrets in Logs
```bash
# Should NOT show actual passwords
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs | grep -i password
```

### Check Non-Root User
```bash
# Should show: nodeuser (uid=1000)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend whoami
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend id
```

### Scan for Vulnerabilities
```bash
docker scan nyu-aptos-backend:prod
```

## Final Checklist

- [ ] All scripts are executable
- [ ] .env file is configured
- [ ] Development environment starts successfully
- [ ] All services are healthy
- [ ] Health endpoint returns 200 OK
- [ ] Database connection works
- [ ] API endpoints respond
- [ ] Logs show no errors
- [ ] Production image builds successfully
- [ ] Image size is reasonable (<500 MB)
- [ ] Non-root user is configured
- [ ] No secrets in logs
- [ ] Documentation is clear

## Success Criteria

Your setup is successful if:
1. All development services start and pass health checks
2. Backend responds to HTTP requests
3. Database is accessible and initialized
4. Production image builds without errors
5. No critical security issues in scans
6. All helper scripts work correctly

## Getting Help

If you encounter issues:
1. Check logs: `docker-compose logs backend`
2. Review DOCKER.md for troubleshooting
3. Check Docker daemon: `docker info`
4. Verify resources: `docker system df`
5. Review k8s/README.md for Kubernetes issues

## Next Steps After Verification

Once all checks pass:
1. Test with real Aptos testnet transactions
2. Set up CI/CD pipeline
3. Configure production secrets
4. Deploy to staging environment
5. Load test the API
6. Set up monitoring and alerts
7. Configure backup strategy
8. Document deployment procedures
9. Train team on Docker workflows
10. Deploy to production

---

**Verification Date**: _______________
**Verified By**: _______________
**Status**: [ ] Pass [ ] Fail
**Notes**: _______________
