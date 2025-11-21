# Vercel and Railway Deployment Guide

This guide covers deploying the NYU Aptos Nexus platform using modern cloud infrastructure.

## Architecture Overview

```
Frontend (Vercel)           Backend (Railway/Render)
     |                              |
     |                              |
     v                              v
Auth0 API Routes          Express REST API
Next.js Pages             SSE Event Service
                          Blockchain Indexer
     |                              |
     |                              |
     v                              v
                    Database (Vercel Postgres)
                    File Storage (Vercel Blob)
```

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Railway or Render account (free tier available)
- Auth0 account (free tier available)
- Domain name (optional, for production)

## Part 1: Database Setup

### Option A: Vercel Postgres (Recommended for small-medium apps)

1. Go to your Vercel dashboard
2. Navigate to Storage tab
3. Create a new Postgres database
4. Note the connection string (starts with `postgres://`)

### Option B: Supabase (Recommended for larger apps)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to Project Settings > Database
4. Copy the connection string
5. Enable connection pooling for better performance

### Database Migration

Export your current database:
```bash
pg_dump nyu_aptos_dev > backup.sql
```

Import to new database:
```bash
# For Vercel Postgres (use connection string from dashboard)
psql "postgres://username:password@host/database" < backup.sql

# Or use Vercel dashboard import feature
```

## Part 2: Backend Deployment (Railway)

### Why Railway for Backend?

- Express server needs persistent process
- SSE connections require long-lived server
- Blockchain indexer runs continuously
- Cron jobs for data retention

### Railway Setup

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login to Railway:**
```bash
railway login
```

3. **Create New Project:**
```bash
cd backend
railway init
```

4. **Configure Environment Variables:**

In Railway dashboard, add these variables:

```bash
# Database (from Vercel Postgres or Supabase)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Or individual vars
DB_HOST=your-db-host.postgres.database.azure.com
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_POOL_SIZE=20

# Security (generate new 32-character secrets)
JWT_SECRET=generate_new_32_char_secret_here
JWT_REFRESH_SECRET=generate_new_32_char_secret_here
SESSION_SECRET=generate_new_32_char_secret_here
WALLET_ENCRYPTION_SECRET=generate_new_32_char_secret_here

# CORS (your Vercel frontend URL)
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
APP_URL=https://your-app.vercel.app

# Aptos Blockchain
APTOS_NETWORK=testnet
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
APTOS_INDEXER_URL=https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql
MODULE_ADDRESS=your_deployed_contract_address
COIN_TYPE=0x1::aptos_coin::AptosCoin

# File Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_token_from_vercel_dashboard

# Server
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
```

5. **Deploy:**
```bash
railway up
```

6. **Note Your Backend URL:**
Railway will provide a URL like: `https://your-backend.railway.app`

### Alternative: Render Deployment

1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service
4. Configure:
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Environment: Node
5. Add all environment variables from above
6. Deploy

## Part 3: Frontend Deployment (Vercel)

### Vercel Setup

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Link Project:**
```bash
cd frontend
vercel link
```

3. **Configure Environment Variables:**

In Vercel dashboard (Settings > Environment Variables), add:

```bash
# Backend API
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Aptos Network
NEXT_PUBLIC_APTOS_NETWORK=testnet

# Auth0 (create NEW application in Auth0 for production)
AUTH0_SECRET=generate_new_32_char_secret
AUTH0_BASE_URL=https://your-app.vercel.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your_production_client_id
AUTH0_CLIENT_SECRET=your_production_client_secret
```

4. **Deploy:**
```bash
vercel --prod
```

5. **Note Your Frontend URL:**
Vercel will provide a URL like: `https://your-app.vercel.app`

## Part 4: Auth0 Configuration

### Create Production Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Applications > Create Application
3. Choose "Regular Web Application"
4. Configure settings:

**Allowed Callback URLs:**
```
https://your-app.vercel.app/api/auth/callback
```

**Allowed Logout URLs:**
```
https://your-app.vercel.app
```

**Allowed Web Origins:**
```
https://your-app.vercel.app
```

5. Save changes
6. Copy Client ID and Client Secret to Vercel environment variables
7. Update frontend environment variables in Vercel dashboard

## Part 5: Vercel Blob Setup (File Storage)

1. Go to Vercel dashboard > Storage
2. Create a new Blob store
3. Copy the `BLOB_READ_WRITE_TOKEN`
4. Add it to Railway environment variables:
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx
```

## Part 6: Testing Deployment

### Test Checklist

1. **Frontend:**
   - [ ] Site loads at Vercel URL
   - [ ] No console errors
   - [ ] Static assets load correctly

2. **Auth0 Login:**
   - [ ] Click "Sign In with Google"
   - [ ] Auth0 login flow completes
   - [ ] Redirected back to app
   - [ ] User session persists

3. **Wallet Generation:**
   - [ ] New user gets wallet created
   - [ ] Wallet address shown in UI
   - [ ] Private key encrypted in database

4. **Backend API:**
   - [ ] Test endpoint: `curl https://your-backend.railway.app/health`
   - [ ] Check API responses in browser network tab
   - [ ] Verify CORS allows frontend requests

5. **Real-time Updates (SSE):**
   - [ ] Test SSE connection: `curl -N "https://your-backend.railway.app/api/events/stream?channels=treasury:deposit"`
   - [ ] Check browser DevTools for SSE connection
   - [ ] Verify events appear in real-time

6. **Database:**
   - [ ] User data saves correctly
   - [ ] Queries execute without errors
   - [ ] Check connection pool usage

7. **File Uploads:**
   - [ ] Upload receipt for reimbursement
   - [ ] File appears in Vercel Blob dashboard
   - [ ] File URL accessible

## Part 7: Domain Configuration (Optional)

### Custom Domain on Vercel

1. Go to Vercel project settings > Domains
2. Add your domain (e.g., `nexus.your-domain.com`)
3. Configure DNS records as instructed by Vercel
4. Update Auth0 callback URLs with new domain
5. Update CORS_ORIGIN in Railway with new domain

## Part 8: Monitoring and Logs

### Vercel Logs

```bash
# View deployment logs
vercel logs

# Real-time logs
vercel logs --follow
```

### Railway Logs

1. Go to Railway dashboard
2. Click on your service
3. View logs in real-time
4. Set up log drains for external monitoring (optional)

### Database Monitoring

**Vercel Postgres:**
- Dashboard > Storage > Your Database > Insights

**Supabase:**
- Dashboard > Database > Query Performance

## Part 9: Environment Variables Reference

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://your-backend.railway.app` |
| `NEXT_PUBLIC_APTOS_NETWORK` | Aptos network | `testnet` or `mainnet` |
| `AUTH0_SECRET` | Auth0 secret (32 chars) | Generate with `openssl rand -hex 32` |
| `AUTH0_BASE_URL` | Your frontend URL | `https://your-app.vercel.app` |
| `AUTH0_ISSUER_BASE_URL` | Auth0 tenant URL | `https://your-tenant.auth0.com` |
| `AUTH0_CLIENT_ID` | Auth0 client ID | From Auth0 dashboard |
| `AUTH0_CLIENT_SECRET` | Auth0 client secret | From Auth0 dashboard |

### Backend (Railway/Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | JWT signing secret | Generate with `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | JWT refresh secret | Generate with `openssl rand -hex 32` |
| `SESSION_SECRET` | Session secret | Generate with `openssl rand -hex 32` |
| `WALLET_ENCRYPTION_SECRET` | Wallet encryption key | Generate with `openssl rand -hex 32` |
| `CORS_ORIGIN` | Allowed frontend origin | `https://your-app.vercel.app` |
| `FRONTEND_URL` | Frontend URL | `https://your-app.vercel.app` |
| `APTOS_NETWORK` | Aptos network | `testnet` or `mainnet` |
| `APTOS_NODE_URL` | Aptos node URL | `https://fullnode.testnet.aptoslabs.com/v1` |
| `MODULE_ADDRESS` | Deployed contract address | `0xYourContractAddress` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token | From Vercel Blob dashboard |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` |

## Part 10: Troubleshooting

### Frontend Issues

**Issue: 404 on API calls**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running
- Check CORS configuration

**Issue: Auth0 login fails**
- Verify callback URLs in Auth0
- Check Auth0 environment variables
- Ensure AUTH0_SECRET is 32 characters

**Issue: Blank page**
- Check browser console for errors
- Verify build completed successfully
- Check Vercel deployment logs

### Backend Issues

**Issue: Database connection fails**
- Verify DATABASE_URL is correct
- Check database is accessible from Railway
- Ensure SSL mode is enabled: `?sslmode=require`

**Issue: SSE not working**
- Verify Railway/Render supports long-lived connections
- Check firewall/proxy settings
- Test with curl: `curl -N https://your-backend.railway.app/api/events/stream`

**Issue: File uploads fail**
- Verify BLOB_READ_WRITE_TOKEN is set
- Check Vercel Blob dashboard for quota
- Ensure Blob store is created

### Database Issues

**Issue: Connection pool exhausted**
- Increase DB_POOL_SIZE in environment variables
- Enable connection pooling in database provider
- Check for connection leaks in code

## Part 11: Cost Optimization

### Free Tier Limits

**Vercel (Hobby Plan):**
- Unlimited projects
- 100GB bandwidth/month
- Automatic SSL
- Custom domains

**Railway (Free):**
- $5 credit/month
- Then ~$0.000463/GB-hour
- May need paid plan for production

**Render (Free):**
- 750 hours/month free
- Sleeps after 15 minutes inactivity
- Good for testing, not production

**Recommended Production Setup:**
- Vercel Pro: $20/month (frontend)
- Railway: ~$5-10/month (backend)
- Vercel Postgres: $10/month (database)
- **Total: ~$35-40/month**

### Budget-Friendly Alternative:
- Vercel Hobby: Free (frontend)
- Render Starter: $7/month (backend)
- Supabase Free: $0 (database + storage)
- **Total: $7/month**

## Part 12: Rollback Procedure

### Vercel Rollback

```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote <deployment-url>
```

Or use Vercel dashboard > Deployments > Promote to Production

### Railway Rollback

1. Go to Railway dashboard
2. Click on service
3. Deployments tab
4. Click "Rollback" on previous deployment

## Part 13: Next Steps

After successful deployment:

1. Set up monitoring (Sentry, LogRocket, etc.)
2. Configure backup schedule for database
3. Set up status page (status.your-domain.com)
4. Enable preview deployments for pull requests
5. Set up staging environment
6. Configure CDN for static assets (already included in Vercel)
7. Set up database read replicas (for scaling)

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Railway: [railway.app/help](https://railway.app/help)
- Render: [render.com/docs](https://render.com/docs)
