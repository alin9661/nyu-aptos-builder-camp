# Backend Deployment Guide

Complete guide for deploying the NYU Aptos Builder Camp backend to production.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ database
- IPFS node or pinning service account
- Access to Aptos mainnet/testnet
- Deployed Move smart contracts

## Deployment Checklist

### 1. Database Setup

#### Create Production Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE nyu_aptos_prod;

# Create user (optional)
CREATE USER nyu_aptos_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE nyu_aptos_prod TO nyu_aptos_user;
```

#### Initialize Schema
```bash
psql -U nyu_aptos_user -d nyu_aptos_prod < database/schema.sql
```

#### Verify Tables
```sql
\c nyu_aptos_prod
\dt
-- Should show all tables from schema
```

### 2. Environment Configuration

Create production `.env` file:

```bash
# Server
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
CORS_ORIGIN=https://your-frontend-domain.com

# Database
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=nyu_aptos_prod
DB_USER=nyu_aptos_user
DB_PASSWORD=strong_password
DB_POOL_SIZE=20

# Aptos Network (IMPORTANT: Use mainnet for production)
APTOS_NETWORK=mainnet
APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
APTOS_INDEXER_URL=https://indexer.mainnet.aptoslabs.com/v1/graphql

# Module Addresses (REPLACE with your deployed addresses)
MODULE_ADDRESS=0xYOUR_DEPLOYED_MODULE_ADDRESS
ADVISOR_ADDRESS=0xYOUR_ADVISOR_ADDRESS
PRESIDENT_ADDRESS=0xYOUR_PRESIDENT_ADDRESS
VICE_ADDRESS=0xYOUR_VICE_ADDRESS

# Coin Type (Use production stablecoin)
COIN_TYPE=0x1::aptos_coin::AptosCoin

# IPFS (Pinata recommended for production)
IPFS_HOST=api.pinata.cloud
IPFS_PORT=443
IPFS_PROTOCOL=https
IPFS_GATEWAY=https://gateway.pinata.cloud
IPFS_PROJECT_ID=your_pinata_api_key
IPFS_PROJECT_SECRET=your_pinata_secret

# Security
API_KEY=generate_random_api_key
JWT_SECRET=generate_random_jwt_secret
```

### 3. Build Application

```bash
# Install dependencies
npm ci --production=false

# Run TypeScript compiler
npm run build

# Verify build output
ls -la dist/
```

### 4. Deployment Options

#### Option A: Traditional Server (VPS, EC2, etc.)

**Install PM2 for process management:**
```bash
npm install -g pm2
```

**Create PM2 ecosystem file (`ecosystem.config.js`):**
```javascript
module.exports = {
  apps: [
    {
      name: 'nyu-aptos-api',
      script: './dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'nyu-aptos-indexer',
      script: './dist/services/indexer.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

**Start services:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Monitor services:**
```bash
pm2 status
pm2 logs
pm2 monit
```

#### Option B: Docker Deployment

**Create `Dockerfile`:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

**Create `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
    restart: unless-stopped

  indexer:
    build: .
    command: node dist/services/indexer.js
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: nyu_aptos_prod
      POSTGRES_USER: nyu_aptos_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy with Docker:**
```bash
docker-compose up -d
docker-compose logs -f
```

#### Option C: Kubernetes Deployment

**Create Kubernetes manifests in `k8s/` directory**

See example configurations in the Kubernetes section below.

### 5. IPFS Setup

#### Using Pinata (Recommended)

1. Sign up at https://pinata.cloud
2. Generate API credentials
3. Update .env:
   ```
   IPFS_HOST=api.pinata.cloud
   IPFS_PORT=443
   IPFS_PROTOCOL=https
   IPFS_PROJECT_ID=your_api_key
   IPFS_PROJECT_SECRET=your_secret
   ```

#### Using Infura

1. Sign up at https://infura.io
2. Create IPFS project
3. Update .env with Infura credentials

#### Self-hosted IPFS

```bash
# Install IPFS
wget https://dist.ipfs.io/go-ipfs/v0.x.x/go-ipfs_v0.x.x_linux-amd64.tar.gz
tar -xvzf go-ipfs_v0.x.x_linux-amd64.tar.gz
cd go-ipfs
sudo bash install.sh

# Initialize and start
ipfs init
ipfs daemon &
```

### 6. Nginx Configuration (Reverse Proxy)

**Create `/etc/nginx/sites-available/nyu-aptos-backend`:**

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
```

**Enable site and reload Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/nyu-aptos-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL/TLS Setup with Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### 8. Monitoring and Logging

#### Application Monitoring

**Install and configure PM2 monitoring:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### Database Monitoring

**Install pgAdmin or similar:**
```bash
# Monitor connections
psql -c "SELECT * FROM pg_stat_activity;"

# Monitor slow queries
psql -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

#### Log Management

**Configure log rotation (`/etc/logrotate.d/nyu-aptos`):**
```
/var/www/nyu-aptos-backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 9. Security Hardening

#### Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### Database Security
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Only allow localhost connections
# host    all    all    127.0.0.1/32    md5
```

#### Environment Variables
```bash
# Never commit .env file
# Use secrets management in production
# AWS Secrets Manager, Vault, etc.
```

### 10. Health Checks and Monitoring

#### Setup Health Check Endpoint

Already implemented at `/health`. Monitor it:

```bash
# Manual check
curl https://api.your-domain.com/health

# Automated monitoring with uptimerobot.com or similar
```

#### Application Monitoring Services

- Sentry for error tracking
- DataDog for APM
- New Relic for performance
- Grafana + Prometheus for metrics

### 11. Backup Strategy

#### Database Backups

**Automated daily backups:**
```bash
# Create backup script
cat > /usr/local/bin/backup-nyu-aptos.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/nyu-aptos"
mkdir -p $BACKUP_DIR

pg_dump -U nyu_aptos_user nyu_aptos_prod | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-nyu-aptos.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-nyu-aptos.sh
```

### 12. CI/CD Pipeline

#### GitHub Actions Example

**Create `.github/workflows/deploy.yml`:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/nyu-aptos-backend
            git pull
            npm ci
            npm run build
            pm2 restart all
```

## Post-Deployment Verification

### 1. Health Check
```bash
curl https://api.your-domain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "network": {...}
}
```

### 2. Database Connection
```bash
psql -h your-db-host -U nyu_aptos_user -d nyu_aptos_prod -c "SELECT COUNT(*) FROM users;"
```

### 3. Indexer Status
```sql
SELECT * FROM indexer_state;
```

All services should show `status = 'running'`.

### 4. API Endpoints
```bash
curl https://api.your-domain.com/api/treasury/balance
curl https://api.your-domain.com/api/governance/elections
curl https://api.your-domain.com/api/proposals
```

### 5. Logs
```bash
pm2 logs nyu-aptos-api
pm2 logs nyu-aptos-indexer
```

## Rollback Procedure

If deployment fails:

```bash
# Stop services
pm2 stop all

# Restore database from backup
gunzip < /backups/nyu-aptos/backup_TIMESTAMP.sql.gz | psql -U nyu_aptos_user nyu_aptos_prod

# Revert code
git checkout previous_working_commit
npm ci
npm run build

# Restart services
pm2 restart all
```

## Performance Tuning

### Database Optimization
```sql
-- Analyze query performance
ANALYZE;

-- Create additional indexes if needed
CREATE INDEX idx_custom ON table_name(column_name);

-- Vacuum database
VACUUM ANALYZE;
```

### Node.js Tuning
```bash
# Increase memory limit if needed
NODE_OPTIONS="--max-old-space-size=4096" pm2 start ecosystem.config.js
```

## Troubleshooting

### Service Won't Start
```bash
pm2 logs --err
# Check error logs for details
```

### Database Connection Issues
```bash
# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### High Memory Usage
```bash
# Monitor memory
pm2 monit

# Restart services
pm2 restart all
```

## Maintenance

### Regular Tasks

**Weekly:**
- Review logs for errors
- Check disk space
- Monitor API response times

**Monthly:**
- Update dependencies (security patches)
- Review and optimize database queries
- Check backup integrity

**Quarterly:**
- Review security configurations
- Performance audit
- Capacity planning

## Support and Escalation

For critical issues:
1. Check service status: `pm2 status`
2. Review error logs: `pm2 logs --err`
3. Check database: `psql` connection test
4. Verify network connectivity to Aptos
5. Contact infrastructure team if needed

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [PostgreSQL Administration](https://www.postgresql.org/docs/14/admin.html)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Aptos Documentation](https://aptos.dev/)
