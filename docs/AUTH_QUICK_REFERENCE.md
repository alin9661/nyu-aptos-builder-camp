# Authentication Quick Reference

Quick reference guide for using the authentication system in the NYU Aptos Builder Camp backend.

## Table of Contents
- [Environment Setup](#environment-setup)
- [Middleware Usage](#middleware-usage)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)
- [Common Patterns](#common-patterns)

## Environment Setup

### Required Environment Variables
```env
JWT_SECRET=<random-32-char-secret>
JWT_REFRESH_SECRET=<random-32-char-secret>
DOMAIN=nyu-aptos.app
APP_URL=https://nyu-aptos.app
```

### Generate Secrets
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Middleware Usage

### Import Middleware
```typescript
import {
  verifyAuth,
  optionalAuth,
  requireRole,
  requireMinWeight,
  requireWalletOwnership,
  requireAdmin,
  requireEboard,
  requireLeadership,
  UserRole,
  AuthenticatedRequest
} from '../middleware/auth';
```

### Basic Authentication
```typescript
// Require authentication
router.get('/protected', verifyAuth, async (req: AuthenticatedRequest, res) => {
  const { address, role } = req.user;
  // User is authenticated
});

// Optional authentication
router.get('/public', optionalAuth, async (req: AuthenticatedRequest, res) => {
  if (req.user) {
    // Authenticated user
  } else {
    // Anonymous user
  }
});
```

### Role-Based Authorization
```typescript
// Single role
router.post('/admin', verifyAuth, requireAdmin, handler);

// Multiple roles
router.post('/vote', verifyAuth, requireRole([
  UserRole.ADVISOR,
  UserRole.PRESIDENT,
  UserRole.VICE_PRESIDENT
]), handler);

// E-board or higher
router.post('/create', verifyAuth, requireEboard, handler);

// Leadership
router.post('/approve', verifyAuth, requireLeadership, handler);
```

### Weight-Based Authorization
```typescript
// Require minimum weight (E-board and above have weight >= 2)
router.post('/vote', verifyAuth, requireMinWeight(2), handler);
```

### Wallet Ownership
```typescript
// Ensure user owns the wallet address in params
router.get('/user/:address/profile',
  verifyAuth,
  requireWalletOwnership('address'),
  handler
);

// Or from request body
router.post('/update',
  verifyAuth,
  requireWalletOwnership('walletAddress'),
  handler
);
```

## API Endpoints

### Authentication Flow
```bash
# 1. Request nonce
curl -X POST /api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"address": "0x123..."}'

# 2. Sign message with wallet
# (Use Aptos SDK in frontend)

# 3. Login
curl -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x123...",
    "message": "...",
    "signature": "0xabc...",
    "publicKey": "0x456..."
  }'

# 4. Use access token
curl -X GET /api/auth/me \
  -H "Authorization: Bearer <access-token>"

# 5. Refresh when needed
curl -X POST /api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refresh-token>"}'
```

### Endpoint Reference
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/nonce` | POST | No | Request nonce |
| `/api/auth/login` | POST | No | Login with signature |
| `/api/auth/refresh` | POST | No | Refresh access token |
| `/api/auth/verify` | POST | No | Verify token |
| `/api/auth/me` | GET | Yes | Get user info |
| `/api/auth/profile` | PUT | Yes | Update profile |
| `/api/auth/logout` | POST | Yes | Logout |

## Frontend Integration

### React/TypeScript Example

#### 1. Install SDK
```bash
npm install @aptos-labs/ts-sdk
```

#### 2. Auth Context
```typescript
import { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: User | null;
  login: (account: Account) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );

  const login = async (account: Account) => {
    // 1. Request nonce
    const nonceRes = await fetch('/api/auth/nonce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: account.accountAddress.toString()
      })
    });
    const { nonce, message } = await nonceRes.json();

    // 2. Sign message
    const signature = await account.sign(message);

    // 3. Login
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: account.accountAddress.toString(),
        message,
        signature: signature.toString(),
        publicKey: account.publicKey.toString()
      })
    });
    const { user, accessToken, refreshToken } = await loginRes.json();

    // 4. Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setAccessToken(accessToken);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!accessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 3. API Client with Auto-Refresh
```typescript
class APIClient {
  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (res.ok) {
        const { accessToken } = await res.json();
        localStorage.setItem('accessToken', accessToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  async request(url: string, options: RequestInit = {}) {
    const accessToken = localStorage.getItem('accessToken');

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Auto-refresh on 401
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry request
        return this.request(url, options);
      } else {
        // Redirect to login
        window.location.href = '/login';
      }
    }

    return response;
  }
}

export const apiClient = new APIClient();
```

#### 4. Protected Route
```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// Usage
<Route path="/admin" element={
  <ProtectedRoute requiredRole="admin">
    <AdminDashboard />
  </ProtectedRoute>
} />
```

## Common Patterns

### Pattern 1: Public Endpoint with Optional User Context
```typescript
router.get('/proposals', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const proposals = await getProposals();

  // Add user-specific data if authenticated
  if (req.user) {
    const userVotes = await getUserVotes(req.user.address);
    proposals.forEach(p => {
      p.userVoted = userVotes.includes(p.id);
    });
  }

  res.json({ proposals });
});
```

### Pattern 2: Role-Specific Behavior
```typescript
router.get('/data', verifyAuth, async (req: AuthenticatedRequest, res) => {
  const data = await getData();

  // Filter based on role
  if (req.user.role === 'admin') {
    // Return all data including sensitive info
    return res.json({ data });
  } else {
    // Return filtered data
    return res.json({
      data: data.map(d => ({ ...d, sensitive: undefined }))
    });
  }
});
```

### Pattern 3: Owner-Only Access
```typescript
router.put('/reimbursement/:id',
  verifyAuth,
  async (req: AuthenticatedRequest, res) => {
    const reimbursement = await getReimbursement(req.params.id);

    // Check ownership
    if (reimbursement.payer !== req.user.address) {
      return res.status(403).json({
        error: 'You can only edit your own reimbursements'
      });
    }

    // Update reimbursement
    await updateReimbursement(req.params.id, req.body);
    res.json({ success: true });
  }
);
```

### Pattern 4: Hierarchical Authorization
```typescript
router.delete('/proposal/:id',
  verifyAuth,
  async (req: AuthenticatedRequest, res) => {
    const proposal = await getProposal(req.params.id);

    // Allow creator to delete
    if (proposal.creator === req.user.address) {
      await deleteProposal(req.params.id);
      return res.json({ success: true });
    }

    // Allow admin to delete
    if (req.user.role === 'admin') {
      await deleteProposal(req.params.id);
      return res.json({ success: true });
    }

    return res.status(403).json({ error: 'Unauthorized' });
  }
);
```

## User Roles

### Role Hierarchy
```
Admin (100)
  └─ Advisor (3)
      ├─ President (2)
      ├─ Vice President (2)
      └─ E-board Member (2)
          └─ Member (1)
```

### Role Enum
```typescript
enum UserRole {
  ADMIN = 'admin',
  ADVISOR = 'advisor',
  PRESIDENT = 'president',
  VICE_PRESIDENT = 'vice_president',
  EBOARD_MEMBER = 'eboard_member',
  MEMBER = 'member',
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Access token has expired"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions",
  "requiredRoles": ["admin"],
  "userRole": "member"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many login attempts",
  "message": "Please try again in 5 minutes"
}
```

## Debugging

### Check Token
```bash
# Decode JWT (without verification)
node -e "console.log(JSON.stringify(JSON.parse(Buffer.from('TOKEN'.split('.')[1], 'base64')), null, 2))"
```

### Test Auth Flow
```bash
# Set variables
ADDRESS="0x123..."
API="http://localhost:3001"

# 1. Get nonce
NONCE_RESPONSE=$(curl -s -X POST $API/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d "{\"address\": \"$ADDRESS\"}")

echo "Nonce: $NONCE_RESPONSE"

# 2. Sign with wallet (manual step)
# 3. Login (manual step with signature)
# 4. Use token
TOKEN="your-access-token"

curl -X GET $API/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (httpOnly cookies or secure storage)
3. **Implement token refresh** before expiration
4. **Handle 401 errors** gracefully with auto-refresh
5. **Clear tokens on logout**
6. **Validate tokens server-side** - never trust client
7. **Use role checks** for sensitive operations
8. **Log authentication events** for security monitoring

## Quick Links

- [Full Documentation](./AUTHENTICATION.md)
- [Setup Guide](./AUTH_SETUP.md)
- [Implementation Summary](./AUTH_IMPLEMENTATION_SUMMARY.md)
- [API Reference](./API_REFERENCE.md)
