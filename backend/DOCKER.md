# Docker Quick Reference

This guide provides quick commands and tips for working with the Docker setup.

## Quick Start Commands

```bash
# Development (recommended for local development)
./scripts/docker-run.sh dev

# Production
./scripts/docker-run.sh prod --detach

# Stop services
./scripts/docker-stop.sh dev
```

## Common Docker Compose Commands

### Starting Services

```bash
# Development with auto-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production mode
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild and start
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Start specific service
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up backend

# Start with IPFS and Redis
docker-compose --profile with-ipfs --profile with-redis up
```

### Stopping Services

```bash
# Stop all services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Stop and remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# Stop specific service
docker-compose -f docker-compose.yml -f docker-compose.dev.yml stop backend
```

### Viewing Logs

```bash
# All services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs --tail=100

# Since specific time
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs --since 2024-01-01T00:00:00
```

### Service Management

```bash
# List running services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

# Restart service
docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart backend

# Execute command in running container
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend sh

# Run one-off command
docker-compose -f docker-compose.yml -f docker-compose.dev.yml run backend npm run lint
```

## Database Operations

### Access PostgreSQL

```bash
# PostgreSQL shell
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U postgres -d nyu_aptos_dev

# Execute SQL file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U postgres -d nyu_aptos_dev < query.sql

# Run SQL command directly
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U postgres -d nyu_aptos_dev -c "SELECT * FROM proposals;"
```

### Backup and Restore

```bash
# Backup database
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres pg_dump -U postgres nyu_aptos_dev > backup-$(date +%Y%m%d).sql

# Restore database
cat backup-20240101.sql | docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U postgres nyu_aptos_dev

# Backup with compression
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres pg_dump -U postgres nyu_aptos_dev | gzip > backup.sql.gz

# Restore from compressed backup
gunzip < backup.sql.gz | docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -T postgres psql -U postgres nyu_aptos_dev
```

### Reset Database

```bash
# Development only - complete reset
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Drop and recreate database
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS nyu_aptos_dev;"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U postgres -c "CREATE DATABASE nyu_aptos_dev;"
```

## Building Images

### Using Helper Script

```bash
# Build development image
./scripts/docker-build.sh dev

# Build production image
./scripts/docker-build.sh prod

# Build without cache
./scripts/docker-build.sh prod --no-cache

# Build and push to registry
./scripts/docker-build.sh prod --registry ghcr.io/your-org --push
```

### Using Docker Directly

```bash
# Build development image
docker build --target development -t nyu-aptos-backend:dev .

# Build production image
docker build --target production -t nyu-aptos-backend:prod .

# Build with build args
docker build --build-arg NODE_ENV=production -t nyu-aptos-backend:prod .

# Build for specific platform
docker build --platform linux/amd64 -t nyu-aptos-backend:prod .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t nyu-aptos-backend:prod .
```

## Container Management

### Inspecting Containers

```bash
# List containers
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps

# Container details
docker inspect nyu-aptos-backend-dev

# Container stats (CPU, memory)
docker stats nyu-aptos-backend-dev

# Top processes in container
docker top nyu-aptos-backend-dev
```

### Debugging Containers

```bash
# Shell into running container
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend sh

# Shell into container as root
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec -u root backend sh

# View container logs
docker logs nyu-aptos-backend-dev

# Follow logs
docker logs -f nyu-aptos-backend-dev

# Copy file from container
docker cp nyu-aptos-backend-dev:/app/logs/error.log ./local-error.log

# Copy file to container
docker cp ./local-file.txt nyu-aptos-backend-dev:/app/
```

### Health Checks

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' nyu-aptos-backend-dev

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' nyu-aptos-backend-dev

# Manual health check
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend curl -f http://localhost:3001/health
```

## Volume Management

### List and Inspect Volumes

```bash
# List all volumes
docker volume ls

# Filter volumes by name
docker volume ls -f name=nyu-aptos

# Inspect volume
docker volume inspect backend_postgres_data

# Show volume disk usage
docker system df -v
```

### Backup and Restore Volumes

```bash
# Backup volume to tar
docker run --rm -v backend_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data.tar.gz -C /data .

# Restore volume from tar
docker run --rm -v backend_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-data.tar.gz -C /data

# Copy volume to another volume
docker run --rm -v backend_postgres_data:/from -v new_postgres_data:/to alpine cp -av /from/. /to/
```

### Clean Up Volumes

```bash
# Remove unused volumes
docker volume prune

# Remove specific volume (WARNING: deletes data)
docker volume rm backend_postgres_data

# Remove all project volumes
docker volume ls -q -f name=backend | xargs docker volume rm
```

## Network Management

```bash
# List networks
docker network ls

# Inspect network
docker network inspect aptos-network

# Connect container to network
docker network connect aptos-network my-container

# Disconnect container from network
docker network disconnect aptos-network my-container
```

## Cleanup Commands

### Remove Containers

```bash
# Stop and remove all containers
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Remove all stopped containers
docker container prune

# Force remove running containers
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -f
```

### Remove Images

```bash
# Remove unused images
docker image prune

# Remove all images for this project
docker images | grep nyu-aptos | awk '{print $3}' | xargs docker rmi

# Remove dangling images
docker image prune -f

# Remove all unused images
docker image prune -a
```

### Complete Cleanup

```bash
# Using helper script (recommended)
./scripts/docker-stop.sh dev --clean

# Manual cleanup
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --rmi local
docker system prune -a --volumes

# Nuclear option (removes everything)
docker system prune -a --volumes -f
```

## Environment Variables

### Loading Environment Files

```bash
# Specify env file
docker-compose --env-file .env.development up

# Use multiple env files
docker-compose --env-file .env --env-file .env.local up

# Override specific variable
DB_PASSWORD=newpass docker-compose up
```

### Viewing Environment Variables

```bash
# Show all environment variables in container
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend env

# Show specific variable
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend printenv DB_HOST

# View compose config with resolved variables
docker-compose -f docker-compose.yml -f docker-compose.dev.yml config
```

## Performance and Monitoring

### Resource Usage

```bash
# Real-time stats
docker stats

# Specific container stats
docker stats nyu-aptos-backend-dev

# Export stats to file
docker stats --no-stream > stats.txt
```

### Performance Tuning

```bash
# Set resource limits
docker run --cpus=2 --memory=1g nyu-aptos-backend:prod

# Compose resource limits (in docker-compose.yml)
# deploy:
#   resources:
#     limits:
#       cpus: '2'
#       memory: 1G
```

## Troubleshooting

### Common Issues

```bash
# Port already in use
lsof -i :3001
kill -9 <PID>

# Permission denied
docker-compose exec -u root backend chown -R nodeuser:nodeuser /app

# Container keeps restarting
docker-compose logs backend
docker inspect nyu-aptos-backend-dev

# Out of disk space
docker system df
docker system prune -a --volumes

# Network issues
docker network ls
docker network inspect aptos-network
```

### Reset Everything

```bash
# Complete reset (WARNING: deletes all data)
./scripts/docker-stop.sh dev --clean
docker system prune -a --volumes -f
./scripts/docker-run.sh dev --build
```

## Tips and Best Practices

### Development Workflow

1. **Use helper scripts** - They handle compose files correctly
2. **Keep volumes** - Don't use `-v` unless you want to delete data
3. **Use logs** - Always check logs when debugging
4. **Layer caching** - Order Dockerfile commands by change frequency
5. **Hot reload** - Use development mode for code changes

### Production Best Practices

1. **Use specific versions** - Don't use `latest` tag
2. **Health checks** - Always define health checks
3. **Resource limits** - Set CPU and memory limits
4. **Non-root user** - Run as non-root in production
5. **Read-only filesystem** - Use read-only when possible
6. **Scan images** - Use `docker scan` for vulnerabilities
7. **Multi-stage builds** - Keep production images small

### Security

```bash
# Scan image for vulnerabilities
docker scan nyu-aptos-backend:prod

# Check for outdated base images
docker pull postgres:16-alpine
docker-compose build --pull

# Use secrets for sensitive data
docker secret create db_password ./password.txt
```

## Aliases (Optional)

Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
# Docker Compose shortcuts
alias dc='docker-compose'
alias dcdev='docker-compose -f docker-compose.yml -f docker-compose.dev.yml'
alias dcprod='docker-compose -f docker-compose.yml -f docker-compose.prod.yml'

# Common operations
alias dcup='dcdev up'
alias dcdown='dcdev down'
alias dclogs='dcdev logs -f'
alias dcps='dcdev ps'
alias dcrestart='dcdev restart'

# Backend specific
alias dclogs-backend='dcdev logs -f backend'
alias dcshell-backend='dcdev exec backend sh'
alias dcdb='dcdev exec postgres psql -U postgres -d nyu_aptos_dev'
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Security](https://docs.docker.com/engine/security/)
