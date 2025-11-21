# Vercel Environment Variables Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the required environment variables in Vercel to fix the deployment failures for PR #8.

## Prerequisites

- Vercel account with access to the project
- Vercel Postgres database set up
- Vercel KV database set up
- Auth0 account configured (for SSO)

## Required Environment Variables

### 1. Database Configuration

#### Vercel Postgres
```bash
DATABASE_URL=postgresql://...
```

**How to get it:**
1. Go to Vercel Dashboard
2. Navigate to Storage tab
3. Click on your Postgres database
4. Copy the `DATABASE_URL` from the `.env.local` tab
5. Add it to your project's Environment Variables

### 2. Vercel KV (Redis) - Required for Nonce Storage

```bash
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

**How to get it:**
1. Go to Vercel Dashboard → Storage tab
2. Click "Create Database" → Select "KV"
3. Name it (e.g., "nyu-aptos-kv")
4. Connect it to your project
5. All four environment variables will be automatically added

**Why needed:** The application uses Vercel KV for secure nonce storage during wallet authentication (5-minute expiration, replay attack prevention).

### 3. JWT Secrets

```bash
JWT_SECRET=your_32_character_random_string_here
JWT_REFRESH_SECRET=your_32_character_random_string_here
WALLET_ENCRYPTION_SECRET=your_32_character_random_string_here
```

**How to generate:**
```bash
# On macOS/Linux
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Note:** Generate three different random strings, one for each variable.

### 4. Aptos Configuration

```bash
# Public variables (exposed to browser)
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_MODULE_ADDRESS=0x...your_deployed_contract_address

# Server-side variables
APTOS_NETWORK=testnet
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
MODULE_ADDRESS=0x...your_deployed_contract_address
```

**How to get MODULE_ADDRESS:**
- Use your deployed Aptos smart contract address
- If not deployed yet, you can use a placeholder: `0x1`

### 5. Optional: Aptos API Key (Recommended for Production)

```bash
NEXT_PUBLIC_APTOS_API_KEY=your_aptos_api_key
```

**How to get it:**
1. Go to https://aptos.dev/
2. Sign up for an API key
3. Add it to improve rate limits in production

### 6. Optional: Auth0 Configuration (for SSO)

```bash
AUTH0_SECRET=your_auth0_secret_here
AUTH0_BASE_URL=https://your-vercel-app.vercel.app
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
```

**How to get it:**
1. Go to Auth0 Dashboard
2. Navigate to Applications → Your Application
3. Copy Client ID and Client Secret
4. Set Domain (ISSUER_BASE_URL)
5. Generate AUTH0_SECRET using: `openssl rand -hex 32`
6. Set AUTH0_BASE_URL to your Vercel deployment URL

## Step-by-Step Setup in Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Navigate to Project Settings**
   - Go to https://vercel.com/dashboard
   - Select your project (nyu-aptos-builder-camp or nexus)
   - Click "Settings" tab
   - Click "Environment Variables" in the sidebar

2. **Add Each Variable**
   - Click "Add New"
   - Enter variable name (e.g., `JWT_SECRET`)
   - Enter value
   - Select environments: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

3. **Verify All Variables Are Set**
   - Scroll through the list and ensure all required variables are present
   - Check that no values show as "Undefined" or "Missing"

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Add environment variables
vercel env add JWT_SECRET production
# Enter the value when prompted

# Repeat for all variables
vercel env add JWT_REFRESH_SECRET production
vercel env add WALLET_ENCRYPTION_SECRET production
# ... etc
```

### Option C: Via .env File (Local to Vercel)

1. Create a `.env` file with all variables
2. Run: `vercel env pull`
3. Then manually add them via dashboard or CLI

## Verification Checklist

After adding all environment variables:

- [ ] DATABASE_URL is set (from Vercel Postgres)
- [ ] All 4 KV variables are set (KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN, KV_REST_API_READ_ONLY_TOKEN)
- [ ] JWT_SECRET is set (32+ characters)
- [ ] JWT_REFRESH_SECRET is set (32+ characters)
- [ ] WALLET_ENCRYPTION_SECRET is set (32+ characters)
- [ ] NEXT_PUBLIC_APTOS_NETWORK=testnet
- [ ] APTOS_NETWORK=testnet
- [ ] APTOS_NODE_URL is set
- [ ] NEXT_PUBLIC_MODULE_ADDRESS is set
- [ ] MODULE_ADDRESS is set
- [ ] (Optional) NEXT_PUBLIC_APTOS_API_KEY is set
- [ ] (Optional) All 5 AUTH0 variables are set if using SSO

## Trigger Redeployment

After adding all environment variables:

1. **Automatic Method** (Recommended):
   - Push a new commit to your PR branch
   - This will trigger a new deployment with updated env vars

2. **Manual Method**:
   - Go to Vercel Dashboard → Deployments
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"
   - Select "Use existing Build Cache" = No
   - Click "Redeploy"

## Troubleshooting

### Deployment Still Fails After Adding Env Vars

1. **Check Build Logs:**
   ```
   Vercel Dashboard → Deployments → Click on failed deployment → View logs
   ```

2. **Common Issues:**
   - Env var names have typos
   - Values are wrapped in quotes (remove quotes)
   - KV database not connected to project
   - Postgres database not connected to project

### Missing KV Environment Variables

If KV variables are not automatically added:
1. Go to Storage → KV database → Settings
2. Click "Connect to Project"
3. Select your project
4. Variables will be automatically injected

### Database Connection Errors

1. Verify DATABASE_URL format:
   ```
   postgresql://user:password@host:5432/database
   ```
2. Ensure Vercel Postgres is connected to the project
3. Check that the database is in the same region as your deployment

## Security Best Practices

- ✅ Never commit `.env` files to git
- ✅ Use different secrets for production/preview/development
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use Vercel's encrypted storage (automatic)
- ✅ Limit environment variable access to necessary team members

## Next Steps

Once all environment variables are set and deployment succeeds:

1. Test the authentication flow
2. Verify wallet creation works
3. Test nonce generation and validation
4. Check database connections
5. Monitor error logs in Vercel

## Support

If you continue to experience issues:
- Check Vercel deployment logs for specific errors
- Review [VERCEL_DEPLOYMENT_READY.md](./VERCEL_DEPLOYMENT_READY.md)
- Consult [docs/setup/VERCEL_DEPLOYMENT.md](./docs/setup/VERCEL_DEPLOYMENT.md)
