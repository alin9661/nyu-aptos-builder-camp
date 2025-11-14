# Authentication Setup Guide

This guide walks you through setting up the authentication system for the NYU Aptos Builder Camp backend.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Aptos wallet for testing

## Step 1: Install Dependencies

The authentication dependencies have been added to `package.json`. Install them:

```bash
npm install
```

New dependencies installed:
- `jsonwebtoken` - JWT token generation and verification
- `@types/jsonwebtoken` - TypeScript types for JWT
- `express-rate-limit` - Rate limiting for auth endpoints
- `@noble/ed25519` - Ed25519 signature verification

## Step 2: Configure Environment Variables

Copy the example environment file and configure JWT secrets:

```bash
cp .env.example .env
```

Edit `.env` and set the following required variables:

```env
# JWT Configuration (REQUIRED - use strong random secrets)
JWT_SECRET=your_secure_random_secret_min_32_chars
JWT_REFRESH_SECRET=your_secure_refresh_secret_min_32_chars

# Application URL (for wallet signature messages)
DOMAIN=localhost
APP_URL=http://localhost:3001
```

### Generating Secure JWT Secrets

Use Node.js to generate secure random secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice and use the outputs for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

## Step 3: Run Database Migrations

Apply the authentication database schema:

```bash
# Connect to your PostgreSQL database
psql -U postgres -d nyu_aptos

# Run the base schema (if not already done)
\i database/schema.sql

# Run the authentication migration
\i database/migrations/001_add_auth_tables.sql
```

This creates the following tables:
- `user_sessions` - Track active user sessions
- `login_attempts` - Security monitoring for login attempts
- `blacklisted_tokens` - Token revocation support

## Step 4: Verify Installation

Start the development server:

```bash
npm run dev
```

Check that auth routes are registered:

```bash
curl http://localhost:3001/ | jq '.endpoints.auth'
```

You should see:
```json
{
  "nonce": "POST /api/auth/nonce",
  "login": "POST /api/auth/login",
  "refresh": "POST /api/auth/refresh",
  "verify": "POST /api/auth/verify",
  "me": "GET /api/auth/me",
  "profile": "PUT /api/auth/profile",
  "logout": "POST /api/auth/logout"
}
```

## Step 5: Test Authentication Flow

### 5.1 Request a Nonce

```bash
curl -X POST http://localhost:3001/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"address": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "nonce": "abc123...",
    "message": "localhost wants you to sign in...",
    "address": "0x1234..."
  }
}
```

### 5.2 Sign Message with Aptos Wallet

Use the Aptos TypeScript SDK to sign the message:

```typescript
import { Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

// In your frontend/test script
const privateKey = new Ed25519PrivateKey("your_private_key_hex");
const account = Account.fromPrivateKey({ privateKey });

const message = "message from step 5.1";
const signature = account.sign(message);

console.log({
  address: account.accountAddress.toString(),
  signature: signature.toString(),
  publicKey: account.publicKey.toString()
});
```

### 5.3 Login with Signature

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234...",
    "message": "message from step 5.1",
    "signature": "0xabcd...",
    "publicKey": "0x9876..."
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "address": "0x1234...",
      "role": "member",
      "displayName": null,
      "email": null
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 5.4 Make Authenticated Request

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "address": "0x1234...",
      "role": "member",
      "displayName": null,
      "email": null,
      "createdAt": "2025-11-07T..."
    }
  }
}
```

## Step 6: Update User Roles

To test different authorization levels, update a user's role in the database:

```sql
-- Make a user an advisor
UPDATE users
SET role = 'advisor'
WHERE address = '0x1234...';

-- Make a user president
UPDATE users
SET role = 'president'
WHERE address = '0x1234...';

-- Make a user admin
UPDATE users
SET role = 'admin'
WHERE address = '0x1234...';
```

**Note:** After changing roles, the user must log in again to get a new token with updated permissions.

## Protected Endpoints

The following endpoints now require authentication:

### Requires Any Authenticated User
- `POST /api/proposals/:id/vote` - Vote on proposal
- `POST /api/treasury/reimbursements/submit` - Submit reimbursement
- `POST /api/governance/vote` - Vote in election

### Requires E-board or Higher
- `POST /api/proposals/create` - Create new proposal

### Requires Leadership (Advisor, President, VP)
- `POST /api/treasury/reimbursements/:id/approve` - Approve reimbursement

## Security Best Practices

### Production Deployment

1. **Use Environment-Specific Secrets**
   ```bash
   # Different secrets for dev/staging/prod
   JWT_SECRET_PROD=<different-secret>
   JWT_REFRESH_SECRET_PROD=<different-secret>
   ```

2. **Enable HTTPS Only**
   - Never transmit JWT tokens over HTTP in production
   - Configure CORS properly

3. **Rotate Secrets Regularly**
   - Change JWT secrets periodically
   - Implement a secret rotation strategy

4. **Monitor Login Attempts**
   ```sql
   -- Check failed login attempts
   SELECT address, COUNT(*) as failed_attempts
   FROM login_attempts
   WHERE success = false
     AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY address
   HAVING COUNT(*) > 5;
   ```

5. **Clean Up Old Data**
   ```sql
   -- Run periodically via cron
   SELECT cleanup_expired_auth_data();
   ```

### Rate Limiting

Rate limits are automatically applied:
- Login: 5 attempts per 5 minutes per IP
- Other auth endpoints: 10 requests per 15 minutes per IP

To adjust rate limits, modify `/src/routes/auth.ts`:

```typescript
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // Change window
  max: 5,                    // Change max attempts
  // ...
});
```

## Troubleshooting

### "JWT_SECRET must be set in environment variables"

**Solution:** Ensure `.env` file exists and contains `JWT_SECRET` and `JWT_REFRESH_SECRET`.

### "Invalid signature" on login

**Possible causes:**
1. Message doesn't match exactly (check whitespace/newlines)
2. Wrong private key used for signing
3. Public key doesn't match address
4. Nonce expired (5 minute timeout)

**Solution:** Request a fresh nonce and ensure message is signed exactly as provided.

### "User role has changed. Please login again."

**Expected behavior:** This occurs when a user's role is updated in the database. The old token becomes invalid to ensure proper authorization.

**Solution:** User should login again to get a token with updated role.

### Token expires too quickly

**Solution:** Adjust token expiry in `/src/utils/jwt.ts`:

```typescript
export const ACCESS_TOKEN_EXPIRY = '1h';  // Change from 15m to 1h
export const REFRESH_TOKEN_EXPIRY = '30d'; // Change from 7d to 30d
```

## Next Steps

1. **Integrate with Frontend**
   - See `AUTHENTICATION.md` for detailed frontend integration guide
   - Implement token storage and refresh logic

2. **Add Role Management UI**
   - Admin interface to update user roles
   - Role assignment workflow

3. **Implement Session Management**
   - Track active sessions
   - Allow users to view/revoke active sessions

4. **Add 2FA (Optional)**
   - Email verification
   - TOTP-based 2FA

5. **Monitor and Analytics**
   - Set up logging for authentication events
   - Track login patterns and anomalies

## Additional Resources

- [AUTHENTICATION.md](./AUTHENTICATION.md) - Complete authentication documentation
- [API_REFERENCE.md](./API_REFERENCE.md) - Full API documentation
- [Aptos TypeScript SDK](https://aptos.dev/sdks/ts-sdk) - Official SDK docs

## Support

For issues or questions:
- Check the troubleshooting section above
- Review authentication logs in the console
- Create an issue in the GitHub repository
