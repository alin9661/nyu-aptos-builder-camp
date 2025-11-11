# NYU SSO Integration Guide

## Overview

This document describes the Single Sign-On (SSO) integration with NYU's authentication system for the Aptos Builder Camp governance platform. Upon successful authentication, users automatically receive an Aptos wallet for blockchain interactions.

## Features

- **NYU Shibboleth SSO**: Authenticate using NYU NetID credentials
- **Automatic Wallet Generation**: Create Aptos wallet automatically on first login
- **Secure Key Storage**: Private keys encrypted with AES-256-GCM
- **Testnet Funding**: Auto-fund new wallets on testnet for demo purposes
- **JWT Session Management**: Stateless authentication with access and refresh tokens
- **Dual Authentication**: Support for both SSO and wallet-based login

## Architecture

### Backend Components

1. **Database Migration** (`backend/database/migrations/002_add_sso_support.sql`)
   - Adds SSO-related columns to users table
   - Stores encrypted wallet private keys
   - Tracks wallet generation metadata

2. **Wallet Service** (`backend/src/services/walletService.ts`)
   - Generates Ed25519 Aptos wallets
   - Encrypts/decrypts private keys
   - Funds wallets on testnet
   - Manages wallet operations

3. **Encryption Utility** (`backend/src/utils/encryption.ts`)
   - AES-256-GCM encryption for private keys
   - PBKDF2 key derivation
   - Secure random salt generation

4. **Passport Configuration** (`backend/src/config/passport.ts`)
   - SAML strategy for NYU SSO
   - User profile extraction
   - Session serialization

5. **SSO Routes** (`backend/src/routes/sso.ts`)
   - `/api/auth/sso/login` - Initiate SSO flow
   - `/api/auth/sso/callback` - Handle SAML response
   - `/api/auth/sso/status` - Check SSO configuration
   - `/api/auth/sso/metadata` - Service Provider metadata

### Frontend Components

1. **Login Page** (`frontend/app/auth/page.tsx`)
   - SSO login button
   - Wallet connect option
   - Status indicators

2. **Callback Page** (`frontend/app/auth/callback/page.tsx`)
   - Processes SSO response
   - Stores authentication tokens
   - Redirects to dashboard

3. **Error Page** (`frontend/app/auth/error/page.tsx`)
   - User-friendly error messages
   - Troubleshooting tips
   - Support contact options

## Setup Instructions

### 1. Database Migration

Run the SSO support migration:

\`\`\`bash
cd backend
psql -d nyu_aptos -f database/migrations/002_add_sso_support.sql
\`\`\`

### 2. Backend Environment Variables

Add these variables to `backend/.env`:

\`\`\`env
# Session Management
SESSION_SECRET=your_random_session_secret_min_32_chars

# Wallet Encryption
WALLET_ENCRYPTION_SECRET=your_random_encryption_secret_min_32_chars

# Frontend URL
FRONTEND_URL=http://localhost:3000

# NYU SSO Configuration
SAML_ENTRY_POINT=https://shibboleth.nyu.edu/idp/profile/SAML2/Redirect/SSO
SAML_CALLBACK_URL=http://localhost:3001/api/auth/sso/callback
SAML_ISSUER=nyu-aptos-app
SAML_IDP_CERT=<NYU_IDP_CERTIFICATE>
SAML_PRIVATE_KEY=<YOUR_SP_PRIVATE_KEY>
SAML_PUBLIC_CERT=<YOUR_SP_PUBLIC_CERT>
\`\`\`

**Generate Secrets:**

\`\`\`bash
# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate wallet encryption secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

### 3. Frontend Environment Variables

Create/update `frontend/.env.local`:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001
\`\`\`

### 4. NYU SSO Registration (Production Only)

For production deployment, you need to register with NYU IT:

1. **Contact NYU IT**:
   - Email: identity-support@nyu.edu
   - Request: Shibboleth Service Provider registration

2. **Provide Service Provider Information**:
   - Entity ID: `nyu-aptos-app` (or your production domain)
   - Assertion Consumer Service URL: `https://your-domain.com/api/auth/sso/callback`
   - Service Provider metadata: Download from `/api/auth/sso/metadata`

3. **Receive IdP Configuration**:
   - NYU will provide the IdP certificate
   - Update `SAML_IDP_CERT` in your environment

4. **Generate SP Certificates** (for production):

\`\`\`bash
# Generate private key
openssl genrsa -out sp-private-key.pem 2048

# Generate certificate
openssl req -new -x509 -key sp-private-key.pem -out sp-cert.pem -days 3650

# Set environment variables
SAML_PRIVATE_KEY="$(cat sp-private-key.pem)"
SAML_PUBLIC_CERT="$(cat sp-cert.pem)"
\`\`\`

## SSO Flow

### 1. User Initiates Login

\`\`\`
User clicks "Sign in with NYU SSO"
  ↓
Frontend redirects to: GET /api/auth/sso/login
  ↓
Backend redirects to NYU Shibboleth
\`\`\`

### 2. NYU Authentication

\`\`\`
User enters NetID and password at NYU
  ↓
NYU Shibboleth validates credentials
  ↓
NYU sends SAML response to: POST /api/auth/sso/callback
\`\`\`

### 3. Wallet Creation (First-time Users)

\`\`\`
Backend receives SAML assertion
  ↓
Extract user info (NetID, email, name)
  ↓
Check if user exists in database
  ↓
If new user:
  - Generate Ed25519 keypair
  - Encrypt private key with AES-256
  - Store in database with SSO identifier
  - Fund wallet on testnet (demo only)
  ↓
Generate JWT tokens
  ↓
Redirect to frontend with tokens
\`\`\`

### 4. Session Establishment

\`\`\`
Frontend receives tokens in URL
  ↓
Store in localStorage:
  - accessToken
  - refreshToken
  - userAddress
  - userRole
  ↓
Redirect to dashboard
\`\`\`

## Security Considerations

### Private Key Encryption

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: 64 random bytes per encryption
- **IV**: 16 random bytes per encryption
- **Authentication Tag**: 16 bytes for integrity

### Access Control

- Private keys are only decrypted server-side
- Never expose private keys to frontend
- Use for automated transaction signing only
- Consider implementing MFA for sensitive operations

### Token Management

- **Access Token**: 15-minute expiry
- **Refresh Token**: 7-day expiry
- **JWT Secret**: Strong random secret (min 32 chars)
- **Session Secret**: Strong random secret (min 32 chars)

## Testing

### Development Mode

The system includes a demo/development mode for testing without real NYU SSO:

1. SSO status endpoint shows `demoMode: true`
2. Uses a demo certificate for development
3. Real NYU integration requires production setup

### Test SSO Flow

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to: `http://localhost:3000/auth`
4. Click "Sign in with NYU SSO"
5. Complete authentication
6. Verify redirect to dashboard
7. Check wallet creation in database

### Verify Wallet Creation

\`\`\`sql
SELECT
  address,
  sso_id,
  sso_provider,
  wallet_generated,
  wallet_created_at,
  email
FROM users
WHERE sso_provider = 'nyu_sso'
ORDER BY created_at DESC;
\`\`\`

### Check Wallet Funding (Testnet)

\`\`\`bash
# Using Aptos CLI
aptos account list --account <wallet_address>

# Or check in the application
curl http://localhost:3001/api/treasury/balance
\`\`\`

## API Endpoints

### SSO Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/sso/login` | Initiate SSO login |
| POST | `/api/auth/sso/callback` | SAML callback |
| GET | `/api/auth/sso/status` | SSO configuration status |
| GET | `/api/auth/sso/metadata` | SP metadata XML |
| POST | `/api/auth/sso/logout` | SSO logout |

### Original Auth Endpoints (Still Available)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/nonce` | Request signature nonce |
| POST | `/api/auth/login` | Wallet signature login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get user info |

## Troubleshooting

### "SAML strategy not configured"

- Verify Passport is initialized in `index.ts`
- Check `configurePassport()` is called
- Ensure SAML environment variables are set

### "Wallet encryption secret not set"

- Add `WALLET_ENCRYPTION_SECRET` to `.env`
- Use a strong random 32+ character secret

### "Session secret not set"

- Add `SESSION_SECRET` to `.env`
- Use a strong random 32+ character secret

### "Nonce not found" or "Invalid signature"

- Clear browser cookies/localStorage
- Request new nonce
- Ensure timestamp sync

### Wallet not funded on testnet

- Check Aptos faucet availability
- Verify `APTOS_NETWORK=testnet`
- May need manual funding: `aptos account fund-with-faucet --account <address>`

## Production Deployment Checklist

- [ ] Obtain real NYU IdP certificate
- [ ] Generate production SP certificates
- [ ] Register with NYU IT as Service Provider
- [ ] Set strong random secrets (32+ chars)
- [ ] Use HTTPS for all endpoints
- [ ] Set `secure: true` for cookies
- [ ] Configure CORS properly
- [ ] Set up monitoring/logging
- [ ] Implement rate limiting
- [ ] Regular security audits
- [ ] Backup encryption keys securely
- [ ] Document recovery procedures

## Support

For issues related to:
- **NYU SSO**: Contact identity-support@nyu.edu
- **Aptos Integration**: Check Aptos documentation
- **Application Issues**: Contact development team

## References

- [NYU Shibboleth Documentation](https://www.nyu.edu/life/information-technology/infrastructure/identity-and-access-management.html)
- [Aptos SDK Documentation](https://aptos.dev/sdks/ts-sdk/)
- [SAML 2.0 Specification](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- [Passport SAML](https://github.com/node-saml/passport-saml)
