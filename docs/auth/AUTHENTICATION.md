# Authentication & Authorization Documentation

## Overview

The NYU Aptos Builder Camp backend implements a comprehensive JWT-based authentication system with Aptos wallet signature verification. This document covers the authentication flow, API endpoints, middleware usage, and security considerations.

## Table of Contents

- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
- [Middleware](#middleware)
- [Role-Based Access Control](#role-based-access-control)
- [Security Features](#security-features)
- [Integration Guide](#integration-guide)
- [Error Handling](#error-handling)
- [Database Schema](#database-schema)

## Authentication Flow

### 1. Wallet Signature Authentication

The authentication process uses Aptos wallet signatures for secure login:

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  Backend │         │ Blockchain│
└────┬─────┘         └────┬─────┘         └────┬──────┘
     │                    │                     │
     │  POST /auth/nonce  │                     │
     ├───────────────────>│                     │
     │                    │                     │
     │  { nonce, message }│                     │
     │<───────────────────┤                     │
     │                    │                     │
     │  Sign message      │                     │
     │  with wallet       │                     │
     │                    │                     │
     │  POST /auth/login  │                     │
     │  { signature }     │                     │
     ├───────────────────>│                     │
     │                    │                     │
     │                    │ Verify signature    │
     │                    │ Check user in DB    │
     │                    │                     │
     │  { accessToken,    │                     │
     │    refreshToken }  │                     │
     │<───────────────────┤                     │
     │                    │                     │
```

### 2. Token-Based Authentication

After initial login, clients use JWT tokens:

- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

## API Endpoints

### Authentication Endpoints

#### 1. Request Nonce

**Endpoint:** `POST /api/auth/nonce`

**Description:** Request a nonce for wallet signature authentication.

**Request Body:**
```json
{
  "address": "0x1234...5678"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nonce": "a1b2c3d4...",
    "message": "nyu-aptos.app wants you to sign in with your Aptos account:\n0x1234...5678\n\nSign in to NYU Aptos Builder Camp\n\nURI: https://nyu-aptos.app\nVersion: 1\nChain ID: testnet\nNonce: a1b2c3d4...\nIssued At: 2025-11-07T10:00:00.000Z\nExpiration Time: 2025-11-07T10:05:00.000Z",
    "address": "0x1234...5678"
  }
}
```

**Rate Limit:** 10 requests per 15 minutes per IP

---

#### 2. Login with Wallet Signature

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate using wallet signature and receive JWT tokens.

**Request Body:**
```json
{
  "address": "0x1234...5678",
  "message": "nyu-aptos.app wants you to sign in...",
  "signature": "0xabcd...ef01",
  "publicKey": "0x9876...5432"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "address": "0x1234...5678",
      "role": "member",
      "displayName": null,
      "email": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Rate Limit:** 5 requests per 5 minutes per IP

**Notes:**
- If the user doesn't exist, a new user is created with 'member' role
- The nonce is consumed and deleted after successful login

---

#### 3. Refresh Access Token

**Endpoint:** `POST /api/auth/refresh`

**Description:** Obtain a new access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Rate Limit:** 10 requests per 15 minutes per IP

---

#### 4. Verify Token

**Endpoint:** `POST /api/auth/verify`

**Description:** Verify if an access token is valid.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

OR

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "address": "0x1234...5678",
      "role": "member"
    }
  }
}
```

---

#### 5. Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Get authenticated user's information.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "address": "0x1234...5678",
      "role": "member",
      "displayName": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-11-07T10:00:00.000Z"
    }
  }
}
```

---

#### 6. Update Profile

**Endpoint:** `PUT /api/auth/profile`

**Description:** Update user profile information.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "displayName": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "address": "0x1234...5678",
      "role": "member",
      "displayName": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

#### 7. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Logout (client should delete tokens).

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Note:** JWT tokens are stateless. Logout is primarily client-side. For token revocation, implement the blacklisted_tokens table.

---

## Middleware

### 1. verifyAuth

**Purpose:** Verify JWT token and attach user info to request

**Usage:**
```typescript
import { verifyAuth, AuthenticatedRequest } from '../middleware/auth';

router.get('/protected', verifyAuth, async (req: AuthenticatedRequest, res: Response) => {
  // req.user is available
  const { address, role } = req.user;
});
```

**Behavior:**
- Extracts token from `Authorization: Bearer <token>` header
- Verifies token signature and expiration
- Checks user exists in database
- Verifies role hasn't changed since token issuance
- Returns 401 if authentication fails

---

### 2. optionalAuth

**Purpose:** Attach user info if authenticated, but don't require it

**Usage:**
```typescript
router.get('/public', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    // User is authenticated
  } else {
    // Anonymous user
  }
});
```

---

### 3. requireRole

**Purpose:** Require specific role(s) to access endpoint

**Usage:**
```typescript
import { requireRole, UserRole } from '../middleware/auth';

router.post(
  '/admin-only',
  verifyAuth,
  requireRole([UserRole.ADMIN]),
  async (req, res) => {
    // Only admins can access
  }
);

router.post(
  '/leadership',
  verifyAuth,
  requireRole([UserRole.ADVISOR, UserRole.PRESIDENT, UserRole.VICE_PRESIDENT]),
  async (req, res) => {
    // Leadership team can access
  }
);
```

**Behavior:**
- Requires `verifyAuth` to be used first
- Returns 403 if user doesn't have required role

---

### 4. requireMinWeight

**Purpose:** Require minimum role weight to access endpoint

**Usage:**
```typescript
import { requireMinWeight } from '../middleware/auth';

router.post(
  '/vote',
  verifyAuth,
  requireMinWeight(2), // E-board and above
  async (req, res) => {
    // Users with weight >= 2 can access
  }
);
```

**Role Weights:**
- Admin: 100
- Advisor: 3
- President: 2
- Vice President: 2
- E-board Member: 2
- Member: 1

---

### 5. requireWalletOwnership

**Purpose:** Ensure authenticated user matches wallet address parameter

**Usage:**
```typescript
import { requireWalletOwnership } from '../middleware/auth';

router.get(
  '/user/:address/profile',
  verifyAuth,
  requireWalletOwnership('address'),
  async (req, res) => {
    // User can only access their own profile
  }
);
```

---

### 6. Convenience Middleware

```typescript
// Admin only
import { requireAdmin } from '../middleware/auth';
router.post('/admin-action', verifyAuth, requireAdmin, handler);

// E-board or higher
import { requireEboard } from '../middleware/auth';
router.post('/eboard-action', verifyAuth, requireEboard, handler);

// Leadership (advisor, president, VP)
import { requireLeadership } from '../middleware/auth';
router.post('/leadership-action', verifyAuth, requireLeadership, handler);
```

---

## Role-Based Access Control

### User Roles

Roles match the Move contract governance system:

| Role | Weight | Description |
|------|--------|-------------|
| `admin` | 100 | System administrators with full access |
| `advisor` | 3 | Faculty advisors with highest voting weight |
| `president` | 2 | Club president |
| `vice_president` | 2 | Vice president |
| `eboard_member` | 2 | E-board members |
| `member` | 1 | Regular club members |

### Access Control Matrix

| Endpoint | Required Auth | Required Role/Weight |
|----------|--------------|---------------------|
| `POST /auth/nonce` | No | None |
| `POST /auth/login` | No | None |
| `POST /auth/refresh` | No | None |
| `POST /auth/verify` | No | None |
| `GET /auth/me` | Yes | Any |
| `PUT /auth/profile` | Yes | Any |
| `POST /proposals/create` | Yes | E-board+ |
| `POST /proposals/:id/vote` | Yes | Any |
| `POST /treasury/reimbursements/submit` | Yes | Any |
| `POST /treasury/reimbursements/:id/approve` | Yes | Leadership |
| `POST /governance/vote` | Yes | Any |

---

## Security Features

### 1. Wallet Signature Verification

- Uses Ed25519 signature verification
- Validates public key matches claimed address
- Nonce-based replay attack prevention
- Message expiration (5 minutes)

### 2. JWT Security

- Separate secrets for access and refresh tokens
- Short-lived access tokens (15 minutes)
- Role validation on each request
- Token invalidation on role change

### 3. Rate Limiting

- Login attempts: 5 per 5 minutes
- Auth endpoints: 10 per 15 minutes
- Prevents brute force attacks

### 4. Database Security

- User role changes invalidate existing tokens
- Foreign key constraints
- Prepared statements prevent SQL injection
- Login attempt tracking

### 5. Environment Variables

Required environment variables:

```env
JWT_SECRET=<min-32-character-secret>
JWT_REFRESH_SECRET=<min-32-character-secret>
DOMAIN=nyu-aptos.app
APP_URL=https://nyu-aptos.app
```

**Important:** Use strong, randomly generated secrets in production.

---

## Integration Guide

### Frontend Integration (TypeScript/React)

#### 1. Install Dependencies

```bash
npm install @aptos-labs/ts-sdk
```

#### 2. Login Flow

```typescript
import { Aptos, AptosConfig, Network, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

// Step 1: Get wallet address
const account = // ... get from wallet

// Step 2: Request nonce
const nonceResponse = await fetch('/api/auth/nonce', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: account.accountAddress.toString() })
});
const { nonce, message } = await nonceResponse.json();

// Step 3: Sign message with wallet
const signature = await account.signMessage({ message });

// Step 4: Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: account.accountAddress.toString(),
    message,
    signature: signature.signature,
    publicKey: account.publicKey.toString()
  })
});
const { accessToken, refreshToken } = await loginResponse.json();

// Step 5: Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

#### 3. Making Authenticated Requests

```typescript
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // Handle token expiration
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry request with new token
      return makeAuthenticatedRequest(url, options);
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  }

  return response;
};
```

#### 4. Token Refresh

```typescript
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refreshToken');

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const { accessToken } = await response.json();
      localStorage.setItem('accessToken', accessToken);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  return false;
};
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid address",
  "message": "Please provide a valid Aptos address"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Access token has expired"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions",
  "requiredRoles": ["admin", "advisor"],
  "userRole": "member"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many login attempts",
  "message": "Please try again in 5 minutes"
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Login Attempts Table
```sql
CREATE TABLE login_attempts (
    id SERIAL PRIMARY KEY,
    address VARCHAR(66) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    ip_address VARCHAR(45),
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Blacklisted Tokens Table (Optional)
```sql
CREATE TABLE blacklisted_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    address VARCHAR(66) NOT NULL,
    reason VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Best Practices

1. **Always use HTTPS in production** - JWT tokens should never be transmitted over HTTP
2. **Store tokens securely** - Use httpOnly cookies or secure storage
3. **Implement token rotation** - Refresh tokens periodically
4. **Monitor login attempts** - Track failed authentications
5. **Validate on both client and server** - Don't trust client-side validation
6. **Use environment-specific secrets** - Different secrets for dev/staging/prod
7. **Implement logout cleanup** - Clear tokens on logout
8. **Handle token expiration gracefully** - Implement automatic token refresh

---

## Troubleshooting

### Token Verification Fails

**Symptom:** 401 Unauthorized on authenticated requests

**Solutions:**
- Check token hasn't expired (15 min for access tokens)
- Verify JWT_SECRET matches between token generation and verification
- Ensure user role hasn't changed since token issuance
- Check token format: `Authorization: Bearer <token>`

### Signature Verification Fails

**Symptom:** "Invalid signature" error on login

**Solutions:**
- Verify message matches exactly (including whitespace)
- Check public key format (should include 0x prefix)
- Ensure signature is from the correct account
- Verify nonce hasn't expired or been used

### Rate Limiting Issues

**Symptom:** 429 Too Many Requests

**Solutions:**
- Wait for rate limit window to reset
- Implement exponential backoff
- Cache tokens instead of re-authenticating
- Use refresh tokens instead of re-logging in

---

## Additional Resources

- [JWT.io](https://jwt.io/) - JWT debugger
- [Aptos TypeScript SDK](https://aptos.dev/sdks/ts-sdk) - Official SDK documentation
- [Ed25519 Signatures](https://ed25519.cr.yp.to/) - Signature algorithm details

---

## Support

For issues or questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the API documentation at `/` endpoint
