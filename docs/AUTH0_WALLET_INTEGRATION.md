# Auth0 Google SSO with Automatic Aptos Wallet Creation

This document provides comprehensive instructions for setting up Auth0 Google SSO integration with automatic Aptos wallet generation.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [1. Backend Configuration](#1-backend-configuration)
  - [2. Auth0 Dashboard Setup](#2-auth0-dashboard-setup)
  - [3. Post-Login Action Setup](#3-post-login-action-setup)
  - [4. Testing](#4-testing)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Overview

This integration enables users to:
1. Sign in with their Google account via Auth0
2. Automatically receive an Aptos wallet upon first login
3. Have their wallet private key securely encrypted and stored
4. Access their wallet for governance and treasury operations

### Key Features

- **Automatic Wallet Generation**: Ed25519 Aptos wallets created on first login
- **Secure Storage**: Private keys encrypted with AES-256-GCM
- **Zero User Friction**: No manual wallet setup required
- **Retry Logic**: Robust error handling with automatic retries
- **Audit Logging**: Complete audit trail for all operations

---

## Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ 1. Login with Google
       ▼
┌─────────────────┐
│     Auth0       │
└──────┬──────────┘
       │ 2. Post-Login Action Triggers
       │
       │ 3. Call Backend Webhook
       ▼
┌─────────────────────────────┐
│  Backend API                │
│  POST /api/auth/webhook/    │
│       create-wallet         │
└──────┬──────────────────────┘
       │ 4. Generate Wallet
       │
       ▼
┌─────────────────────────────┐
│  WalletService              │
│  - Generate Ed25519 keypair │
│  - Encrypt private key      │
│  - Store in database        │
└──────┬──────────────────────┘
       │ 5. Return wallet address
       ▼
┌─────────────────┐
│     Auth0       │
│  (Store address │
│   in metadata)  │
└─────────────────┘
```

---

## Prerequisites

### Backend Requirements

1. **Node.js** >= 16.x
2. **PostgreSQL** database with SSO support migration applied
3. **Environment Variables**:
   ```bash
   BACKEND_WEBHOOK_SECRET=<secure-random-secret>
   WALLET_ENCRYPTION_SECRET=<64-character-hex-string>
   APTOS_NETWORK=testnet  # or mainnet
   AUTO_FUND_WALLETS=true  # Optional: auto-fund on testnet
   ```

### Auth0 Requirements

1. **Auth0 Account** with appropriate plan (Actions require paid plan)
2. **Google OAuth Connection** configured
3. **Custom Domain** (recommended for production)

### Generate Secrets

```bash
# Generate webhook secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Setup Instructions

### 1. Backend Configuration

#### Step 1.1: Apply Database Migration

Ensure the SSO support migration has been applied:

```bash
cd backend
psql -U your_user -d your_database -f database/migrations/002_add_sso_support.sql
```

This adds the following columns to the `users` table:
- `sso_provider` - SSO provider identifier (e.g., 'google')
- `sso_id` - Unique identifier from Auth0 (e.g., 'google-oauth2|123456')
- `wallet_public_key` - Aptos wallet public key
- `encrypted_private_key` - AES-256-GCM encrypted private key
- `wallet_generated` - Boolean flag
- `wallet_created_at` - Timestamp
- `first_name`, `last_name` - User profile data

#### Step 1.2: Configure Environment Variables

Add to your `.env` file:

```bash
# Webhook Authentication
BACKEND_WEBHOOK_SECRET=your_webhook_secret_here

# Wallet Encryption
WALLET_ENCRYPTION_SECRET=your_encryption_secret_here

# Aptos Network
APTOS_NETWORK=testnet

# Optional: Auto-fund new wallets on testnet
AUTO_FUND_WALLETS=true

# CORS - Allow Auth0 domain
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Step 1.3: Verify Webhook Endpoint

Start your backend server:

```bash
npm run dev
```

Test the webhook health endpoint:

```bash
curl http://localhost:3001/api/auth/webhook/health
```

Expected response:
```json
{
  "success": true,
  "service": "webhook",
  "configured": true,
  "timestamp": "2024-11-11T12:00:00.000Z"
}
```

---

### 2. Auth0 Dashboard Setup

#### Step 2.1: Configure Google OAuth Connection

1. Go to **Auth0 Dashboard** > **Authentication** > **Social**
2. Click **+ Create Connection**
3. Select **Google**
4. Configure:
   - Client ID: Your Google OAuth Client ID
   - Client Secret: Your Google OAuth Client Secret
   - Attributes: Enable `email`, `profile`
   - Permissions: `email`, `profile`, `openid`
5. **Save**

#### Step 2.2: Configure Application

1. Go to **Applications** > **Applications**
2. Select your application
3. Configure:
   - **Allowed Callback URLs**: `https://your-frontend-domain.com/auth/callback`
   - **Allowed Logout URLs**: `https://your-frontend-domain.com`
   - **Allowed Web Origins**: `https://your-frontend-domain.com`
4. Under **Connections**, enable **google-oauth2**
5. **Save Changes**

---

### 3. Post-Login Action Setup

#### Step 3.1: Create Custom Action

1. Go to **Auth0 Dashboard** > **Actions** > **Library**
2. Click **+ Build Custom**
3. Click **Create Action**
4. Configure:
   - **Name**: `Create Aptos Wallet`
   - **Trigger**: `Login / Post Login`
   - **Runtime**: Node 18 (or latest)
5. Click **Create**

#### Step 3.2: Add Dependencies

In the action editor, click **Dependencies** (left sidebar):

1. Add dependency:
   - **Name**: `axios`
   - **Version**: `1.6.0` (or latest)
2. Click **Add Dependency**

#### Step 3.3: Add Secrets

In the action editor, click **Secrets** (left sidebar):

1. Add secret:
   - **Key**: `BACKEND_WEBHOOK_SECRET`
   - **Value**: Your webhook secret from backend `.env`
2. Add secret:
   - **Key**: `BACKEND_WEBHOOK_URL`
   - **Value**: `https://your-backend-api.com/api/auth/webhook/create-wallet`

Example for local development:
```
BACKEND_WEBHOOK_URL=http://localhost:3001/api/auth/webhook/create-wallet
```

**Important**: For local testing, use a tunneling service like ngrok:
```bash
ngrok http 3001
# Use the ngrok URL: https://abc123.ngrok.io/api/auth/webhook/create-wallet
```

#### Step 3.4: Add Action Code

Copy the code from `/backend/auth0/post-login-action.js` into the action editor.

The action will:
- Only trigger for Google OAuth logins
- Check if user already has a wallet
- Call your backend webhook to create a wallet
- Store the wallet address in `app_metadata`
- Retry up to 3 times on failure
- Not block login if wallet creation fails

#### Step 3.5: Test the Action

Click **Test** in the action editor:

1. Configure test payload:
```json
{
  "connection": "google-oauth2",
  "user": {
    "user_id": "google-oauth2|test123",
    "email": "test@example.com",
    "given_name": "Test",
    "family_name": "User",
    "app_metadata": {}
  }
}
```

2. Click **Run**
3. Check the **Console Output** for logs
4. Verify no errors occurred

#### Step 3.6: Deploy the Action

1. Click **Deploy** (top right)
2. Confirm deployment

#### Step 3.7: Add to Login Flow

1. Go to **Actions** > **Flows** > **Login**
2. Click **Custom** tab in the right sidebar
3. Drag **Create Aptos Wallet** action to the flow (between "Start" and "Complete")
4. Click **Apply**

---

### 4. Testing

#### Test 4.1: End-to-End Test

1. Open your application
2. Click "Sign in with Google"
3. Complete Google authentication
4. Check Auth0 logs:
   - Go to **Monitoring** > **Logs**
   - Look for action execution logs
   - Verify "Wallet created successfully" message

#### Test 4.2: Verify Database

```sql
-- Check if user was created
SELECT
  address,
  sso_provider,
  sso_id,
  email,
  wallet_generated,
  wallet_created_at
FROM users
WHERE sso_provider = 'google'
ORDER BY created_at DESC
LIMIT 5;
```

#### Test 4.3: Verify App Metadata

In Auth0 Dashboard:
1. Go to **User Management** > **Users**
2. Find your test user
3. Click on the user
4. Scroll to **Metadata**
5. Verify `app_metadata` contains:
```json
{
  "aptos_wallet_address": "0x...",
  "wallet_created_at": "2024-11-11T12:00:00.000Z",
  "wallet_provider": "auto_generated"
}
```

#### Test 4.4: Verify Wallet Functionality

```bash
# Test wallet endpoint
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "address": "0x...",
      "role": "member",
      "displayName": "Test User",
      "email": "test@example.com",
      "createdAt": "2024-11-11T12:00:00.000Z"
    }
  }
}
```

---

## Security Considerations

### Webhook Authentication

- **Bearer Token**: All webhook requests must include `Authorization: Bearer <secret>`
- **Constant-Time Comparison**: Prevents timing attacks
- **Rate Limiting**: 100 requests per minute per IP
- **Request Validation**: Strict input validation and sanitization

### Private Key Security

- **Encryption**: AES-256-GCM with PBKDF2 key derivation
- **Salt**: Unique 64-byte random salt per key
- **IV**: Unique 16-byte random IV per encryption
- **Auth Tag**: 16-byte authentication tag for integrity
- **Secret Storage**: Encryption secret stored in environment variables, never in code

### Best Practices

1. **Rotate Secrets Regularly**: Update `BACKEND_WEBHOOK_SECRET` quarterly
2. **Monitor Logs**: Set up alerts for failed webhook attempts
3. **HTTPS Only**: Never use HTTP in production
4. **Firewall Rules**: Restrict webhook endpoint to Auth0 IP ranges if possible
5. **Database Encryption**: Enable PostgreSQL encryption at rest
6. **Backup Keys**: Securely backup `WALLET_ENCRYPTION_SECRET` (cannot decrypt without it)

### Auth0 Security

- **Multi-Factor Authentication**: Enable MFA for Auth0 admin accounts
- **Anomaly Detection**: Enable Auth0's anomaly detection features
- **Rate Limiting**: Configure Auth0 rate limits
- **Custom Domains**: Use custom domain for production
- **Allowed Callbacks**: Strictly limit allowed callback URLs

---

## Troubleshooting

### Issue: "Unauthorized webhook request"

**Cause**: Webhook secret mismatch

**Solution**:
1. Verify `BACKEND_WEBHOOK_SECRET` in backend `.env`
2. Verify `BACKEND_WEBHOOK_SECRET` in Auth0 action secrets match exactly
3. Check Auth0 action logs for the secret being sent
4. Restart backend server after changing `.env`

### Issue: "Wallet creation failed - no response"

**Cause**: Backend unreachable or network timeout

**Solution**:
1. Verify backend is running: `curl http://localhost:3001/health`
2. Check `BACKEND_WEBHOOK_URL` in Auth0 action secrets
3. For local testing, ensure ngrok is running
4. Check firewall rules
5. Verify CORS configuration allows Auth0 domain

### Issue: "Invalid webhook request body"

**Cause**: Missing or malformed request data

**Solution**:
1. Check Auth0 action logs for the request body being sent
2. Verify user profile has required fields (email, given_name, family_name)
3. Check Google OAuth connection is sharing profile data
4. Verify action code matches the latest version

### Issue: "Failed to generate wallet"

**Cause**: Encryption or wallet generation error

**Solution**:
1. Verify `WALLET_ENCRYPTION_SECRET` is set and is 64 characters (hex)
2. Check backend logs for detailed error message
3. Verify Aptos SDK is properly initialized
4. Check database connection is working
5. Ensure sufficient disk space for encryption operations

### Issue: "User already exists but no wallet"

**Cause**: User created before wallet integration or previous failure

**Solution**:
1. Delete user from database and Auth0
2. Have user sign in again
3. Or manually trigger wallet creation:
```bash
curl -X POST http://localhost:3001/api/auth/webhook/create-wallet \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "auth0_id": "google-oauth2|123456",
    "email": "user@example.com",
    "given_name": "First",
    "family_name": "Last"
  }'
```

### Issue: "Wallet created but not in Auth0 metadata"

**Cause**: Auth0 API update failed

**Solution**:
1. Check Auth0 action has permission to update `app_metadata`
2. Verify action completed successfully (check logs)
3. Manual update via Auth0 Management API:
```javascript
// In Auth0 action or Management API
api.user.setAppMetadata('aptos_wallet_address', '0x...');
```

### Debug Mode

Enable verbose logging in backend:

```bash
# In .env
LOG_LEVEL=debug
```

Check logs:
```bash
tail -f backend/logs/combined.log
```

---

## API Reference

### POST /api/auth/webhook/create-wallet

Create an Aptos wallet for a new user.

**Authentication**: Bearer token

**Request Headers**:
```
Authorization: Bearer <BACKEND_WEBHOOK_SECRET>
Content-Type: application/json
X-Auth0-User-ID: <auth0_user_id>  (optional)
```

**Request Body**:
```json
{
  "auth0_id": "google-oauth2|123456789",
  "email": "user@example.com",
  "given_name": "John",
  "family_name": "Doe"
}
```

**Response (Success - New Wallet)**:
```json
{
  "success": true,
  "wallet_address": "0xabc123...",
  "message": "Wallet created successfully",
  "existing": false
}
```

**Response (Success - Existing Wallet)**:
```json
{
  "success": true,
  "wallet_address": "0xabc123...",
  "message": "Wallet already exists",
  "existing": true
}
```

**Response (Error - Unauthorized)**:
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid webhook authentication"
}
```

**Response (Error - Invalid Request)**:
```json
{
  "success": false,
  "error": "Invalid request",
  "message": "Missing or invalid required fields (auth0_id is required)"
}
```

**Response (Error - Server Error)**:
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to create wallet"
}
```

**Rate Limits**: 100 requests per minute per IP

---

### GET /api/auth/webhook/health

Health check for webhook service.

**Authentication**: None

**Response**:
```json
{
  "success": true,
  "service": "webhook",
  "configured": true,
  "timestamp": "2024-11-11T12:00:00.000Z"
}
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    address VARCHAR(66) PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    display_name VARCHAR(255),
    email VARCHAR(255),

    -- SSO fields
    sso_provider VARCHAR(50),          -- 'google', 'nyu_sso', etc.
    sso_id VARCHAR(255) UNIQUE,        -- Auth0 user_id
    first_name VARCHAR(255),
    last_name VARCHAR(255),

    -- Wallet fields
    wallet_public_key VARCHAR(66),
    encrypted_private_key TEXT,
    wallet_generated BOOLEAN DEFAULT FALSE,
    wallet_created_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BACKEND_WEBHOOK_SECRET` | Yes | Secret for webhook authentication | `abc123...` (64 chars) |
| `WALLET_ENCRYPTION_SECRET` | Yes | Secret for encrypting private keys | `def456...` (64 chars) |
| `APTOS_NETWORK` | Yes | Aptos network to use | `testnet` or `mainnet` |
| `AUTO_FUND_WALLETS` | No | Auto-fund new wallets on testnet | `true` or `false` |
| `CORS_ORIGIN` | Yes | Allowed CORS origin | `https://app.example.com` |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://...` |
| `LOG_LEVEL` | No | Logging level | `info`, `debug`, `error` |

---

## Support & Resources

- **Auth0 Documentation**: https://auth0.com/docs
- **Aptos SDK**: https://aptos.dev/sdks/ts-sdk/
- **Backend API Docs**: `/docs/API_REFERENCE.md`
- **Wallet Implementation**: `/docs/WALLET_IMPLEMENTATION_SUMMARY.md`

---

## License

MIT License - See LICENSE file for details
