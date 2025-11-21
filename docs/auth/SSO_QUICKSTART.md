# Quick Start Guide - NYU SSO Integration

## Overview

This guide provides a quick setup for the NYU SSO integration with automatic Aptos wallet generation.

## ✅ What's Included

### Backend Features
- **NYU Shibboleth SSO Authentication** - Login with NYU NetID
- **Automatic Wallet Generation** - Ed25519 Aptos wallet created on first login
- **Secure Key Storage** - Private keys encrypted with AES-256-GCM
- **Testnet Funding** - New wallets auto-funded with 1 APT on testnet
- **JWT Session Management** - Stateless authentication with refresh tokens
- **Dual Auth Support** - Both SSO and wallet-based login

### Frontend Features
- **Modern Login UI** - Clean, responsive authentication page
- **SSO Flow** - One-click NYU authentication
- **Wallet Connect** - Alternative login for existing wallets
- **Error Handling** - User-friendly error messages
- **Auto-redirect** - Seamless post-login experience

## 🚀 Quick Setup (5 Minutes)

### Step 1: Run Database Migration

\`\`\`bash
cd backend
psql -d nyu_aptos -U postgres -f database/migrations/002_add_sso_support.sql
\`\`\`

### Step 2: Configure Backend Environment

\`\`\`bash
cd backend

# Generate secrets
echo "SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env
echo "WALLET_ENCRYPTION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env

# Add these to .env
echo "FRONTEND_URL=http://localhost:3000" >> .env
\`\`\`

### Step 3: Configure Frontend Environment

\`\`\`bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
\`\`\`

### Step 4: Start Services

\`\`\`bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
\`\`\`

### Step 5: Test SSO

1. Open http://localhost:3000/auth
2. Click "Sign in with NYU SSO"
3. Complete authentication
4. You'll be redirected to the dashboard with a new Aptos wallet!

## 📁 New Files Added

### Backend

| File | Purpose |
|------|---------|
| `database/migrations/002_add_sso_support.sql` | Database schema for SSO |
| `src/config/passport.ts` | Passport SAML configuration |
| `src/routes/sso.ts` | SSO authentication routes |
| `src/services/walletService.ts` | Wallet generation & management |
| `src/utils/encryption.ts` | AES-256 encryption utilities |

### Frontend

| File | Purpose |
|------|---------|
| `app/auth/page.tsx` | Login page with SSO button |
| `app/auth/callback/page.tsx` | SSO callback handler |
| `app/auth/error/page.tsx` | Error page with troubleshooting |

### Documentation

| File | Purpose |
|------|---------|
| `SSO_INTEGRATION.md` | Complete integration guide |
| `IMPLEMENTATION_STATUS.md` | Implementation status & checklist |
| `QUICK_START.md` | This file |

## 🔑 Environment Variables

### Required (Backend)

\`\`\`env
# Session & Encryption
SESSION_SECRET=<random-32-char-secret>
WALLET_ENCRYPTION_SECRET=<random-32-char-secret>

# URLs
FRONTEND_URL=http://localhost:3000

# NYU SSO (production)
SAML_ENTRY_POINT=https://shibboleth.nyu.edu/idp/profile/SAML2/Redirect/SSO
SAML_CALLBACK_URL=http://localhost:3001/api/auth/sso/callback
SAML_ISSUER=nyu-aptos-app
SAML_IDP_CERT=<NYU-certificate>
\`\`\`

### Required (Frontend)

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001
\`\`\`

## 🧪 Testing

### Verify Wallet Creation

\`\`\`sql
SELECT
  address,
  sso_id,
  email,
  wallet_generated,
  wallet_created_at
FROM users
WHERE sso_provider = 'nyu_sso'
ORDER BY created_at DESC;
\`\`\`

### Check SSO Status

\`\`\`bash
curl http://localhost:3001/api/auth/sso/status
\`\`\`

Expected response:
\`\`\`json
{
  "success": true,
  "data": {
    "configured": true,
    "demoMode": false,
    "provider": "NYU Shibboleth",
    "callbackUrl": "http://localhost:3001/api/auth/sso/callback",
    "network": "testnet"
  }
}
\`\`\`

### Test Wallet Funding (Testnet)

After creating a user via SSO:

\`\`\`bash
# Check balance
aptos account list --account <wallet-address>

# Should show ~1 APT (100,000,000 Octas)
\`\`\`

## 🔒 Security Features

### Private Key Protection
- **Encryption**: AES-256-GCM with authenticated encryption
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Random Salt**: 64 bytes per encryption
- **Authentication Tag**: 16 bytes for integrity verification

### Session Security
- **Access Token**: 15-minute expiry
- **Refresh Token**: 7-day expiry
- **HTTP-only cookies**: Prevents XSS attacks
- **CORS protection**: Configured origins only

### Wallet Security
- **Server-side only**: Private keys never sent to frontend
- **Encrypted storage**: All keys encrypted at rest
- **Secure generation**: Cryptographically secure random number generation

## 📊 API Endpoints

### SSO Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/sso/login` | Initiate SSO login flow |
| POST | `/api/auth/sso/callback` | SAML assertion callback |
| GET | `/api/auth/sso/status` | Check SSO configuration |
| GET | `/api/auth/sso/metadata` | Service Provider metadata |
| POST | `/api/auth/sso/logout` | Logout from SSO session |

### Authentication Endpoints (Existing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/nonce` | Get signature nonce |
| POST | `/api/auth/login` | Wallet signature login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/logout` | Logout |

## 🎯 User Flow

### First-Time User

1. User clicks "Sign in with NYU SSO"
2. Redirected to NYU Shibboleth
3. Enters NetID and password
4. NYU sends SAML assertion to callback
5. Backend:
   - Extracts user info (NetID, email, name)
   - Generates Ed25519 keypair
   - Encrypts private key
   - Stores in database
   - Funds wallet on testnet (1 APT)
   - Generates JWT tokens
6. Frontend:
   - Receives tokens in callback URL
   - Stores in localStorage
   - Redirects to dashboard
7. User sees their new wallet address in dashboard

### Returning User

1. User clicks "Sign in with NYU SSO"
2. Redirected to NYU Shibboleth
3. Authenticates with NetID
4. Backend:
   - Finds existing user by NetID
   - Retrieves wallet address
   - Generates new JWT tokens
5. Frontend redirects to dashboard
6. User sees their existing wallet

## 🐛 Troubleshooting

### "Session secret not set"
```bash
echo "SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> backend/.env
```

### "Wallet encryption secret not set"
```bash
echo "WALLET_ENCRYPTION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> backend/.env
```

### Migration fails
```bash
# Check if already applied
psql -d nyu_aptos -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='sso_id';"

# If not found, run migration
psql -d nyu_aptos -f backend/database/migrations/002_add_sso_support.sql
```

### Wallet not funded
```bash
# Manual funding on testnet
aptos account fund-with-faucet --account <wallet-address>
```

## 📚 Additional Resources

- [SSO_INTEGRATION.md](SSO_INTEGRATION.md) - Comprehensive integration guide
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Implementation checklist
- [Aptos SDK Docs](https://aptos.dev/sdks/ts-sdk/) - Aptos TypeScript SDK
- [NYU IT Identity](https://www.nyu.edu/life/information-technology/infrastructure/identity-and-access-management.html) - NYU identity management

## 🎓 Demo Mode

For development/testing without real NYU SSO:

- System includes demo certificate
- SSO status shows `demoMode: true`
- Simulated authentication flow
- Real production requires NYU IT registration

## ✨ Features Highlight

1. **Zero Blockchain Knowledge Required** - Users don't need to know about wallets or keys
2. **Instant Onboarding** - From login to funded wallet in seconds
3. **Secure by Default** - Enterprise-grade encryption and security
4. **Seamless UX** - No manual wallet creation or seed phrase management
5. **Dual Auth** - Supports both SSO and traditional wallet login
6. **Production Ready** - Built with security and scalability in mind

## 🚀 Next Steps

1. ✅ Run database migration
2. ✅ Configure environment variables
3. ✅ Start backend and frontend
4. ✅ Test SSO login flow
5. ✅ Verify wallet creation
6. ⏭️ Register with NYU IT (for production)
7. ⏭️ Deploy to production environment
8. ⏭️ Configure production SSO certificates

## 💡 Tips

- **Development**: Use demo mode for testing
- **Production**: Register with NYU IT first
- **Security**: Rotate secrets regularly
- **Backup**: Securely backup encryption keys
- **Monitoring**: Set up logging and alerting
- **Testing**: Test SSO flow thoroughly before production

## 🤝 Support

For questions or issues:
- Check [SSO_INTEGRATION.md](SSO_INTEGRATION.md) troubleshooting section
- Review [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) known issues
- Contact NYU IT for SSO-related questions

---

**Ready to start?** Follow the 5-minute quick setup above!
