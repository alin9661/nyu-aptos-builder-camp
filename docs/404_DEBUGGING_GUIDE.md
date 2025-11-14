# 404 Error Loop - Debugging Guide

## Changes Made

### 1. Enhanced Request Logging
**File:** `src/index.ts` (lines 36-62)

The request logging middleware now:
- Tracks all request metadata (query params, user-agent, referer)
- Logs 4xx errors as **WARNINGS** (yellow in logs)
- Logs 5xx errors as **ERRORS** (red in logs)
- Logs successful requests as **INFO** (normal)

### 2. Static File Handlers
**File:** `src/index.ts` (lines 200-216)

Added handlers to prevent 404 spam from:
- `/favicon.ico` - Returns 204 No Content
- `/_next/*` - Next.js development routes (filtered silently)
- `/__nextjs*` - Next.js internal routes
- `/_error` - Next.js error page

### 3. Enhanced 404 Handler
**File:** `src/index.ts` (lines 218-249)

The 404 handler now logs:
- Full request path and URL
- HTTP method (GET, POST, etc.)
- Query parameters
- Request body (for POST requests)
- Referer and origin headers
- User agent
- Timestamp

### 4. Updated API Documentation
**File:** `src/index.ts` (lines 164-166)

Added invoice upload endpoints to root endpoint documentation:
- `POST /api/treasury/invoices/upload`
- `GET /api/treasury/invoices/:requestId`
- `GET /api/treasury/invoices/:requestId/download`

## How to Debug 404 Errors

### Step 1: Start the Backend
```bash
cd backend
npm run dev
```

### Step 2: Monitor the Logs
Watch for **YELLOW warnings** in your terminal. These indicate 404 errors:

```
[WARN] HTTP Request - Client Error {
  method: 'GET',
  path: '/api/some/wrong/path',
  statusCode: 404,
  referer: 'http://localhost:3000/dashboard'
}
```

### Step 3: Identify the Failing Endpoint
Look for the **path** field in the 404 logs. Common issues:

#### Example 1: Missing Endpoint
```
path: '/api/treasury/statistics'
```
**Fix:** The correct endpoint is `/api/treasury/stats` (not statistics)

#### Example 2: Wrong Route Mount
```
path: '/treasury/balance'
```
**Fix:** Missing `/api` prefix. Should be `/api/treasury/balance`

#### Example 3: Typo in Frontend
```
path: '/api/governance/electiosn'
```
**Fix:** Typo in frontend API call. Should be `/api/governance/elections`

### Step 4: Check the Referer
The `referer` field shows which frontend page is making the request:

```
referer: 'http://localhost:3000/dashboard'
```

This tells you that the Dashboard component is making the failing request.

### Step 5: Common Loop Scenarios

#### Scenario A: Auto-Refresh Hook
If you see the same 404 repeated every 30-60 seconds:
```
[10:00:00] path: '/api/treasury/stats', referer: 'http://localhost:3000/dashboard'
[10:00:30] path: '/api/treasury/stats', referer: 'http://localhost:3000/dashboard'
[10:01:00] path: '/api/treasury/stats', referer: 'http://localhost:3000/dashboard'
```

**Cause:** Auto-refresh hooks in the frontend (e.g., `useTreasuryStats(true)`)

**Check:**
- `frontend/components/DashboardStats.tsx` - Auto-refresh hooks
- `frontend/hooks/useTreasuryStats.ts` - Polling intervals

#### Scenario B: WebSocket Connection
If you see requests to `/socket.io/*`:
```
path: '/socket.io/?EIO=4&transport=polling'
```

**Cause:** Frontend trying to connect to Socket.IO

**Fix:** Ensure WebSocket service is running (it should be automatic)

#### Scenario C: Browser Requests
Requests for `/favicon.ico`, `/_next/*` should now be filtered silently.

## Available Endpoints

### Auth
- `POST /api/auth/nonce`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `POST /api/auth/logout`

### Treasury
- `GET /api/treasury/balance`
- `GET /api/treasury/transactions`
- `GET /api/treasury/stats`
- `GET /api/treasury/reimbursements`
- `GET /api/treasury/reimbursements/:id`
- `POST /api/treasury/reimbursements/submit`
- `POST /api/treasury/reimbursements/:id/approve`
- `POST /api/treasury/invoices/upload`
- `GET /api/treasury/invoices/:requestId`
- `GET /api/treasury/invoices/:requestId/download`

### Governance
- `GET /api/governance/elections`
- `GET /api/governance/elections/:electionId/:role`
- `POST /api/governance/vote`
- `GET /api/governance/roles`
- `GET /api/governance/members`
- `GET /api/governance/stats`

### Proposals
- `GET /api/proposals`
- `GET /api/proposals/:id`
- `POST /api/proposals/create`
- `POST /api/proposals/:id/vote`
- `GET /api/proposals/status/active`
- `GET /api/proposals/stats/overview`

### System
- `GET /health`
- `GET /api/websocket/metrics`
- `GET /` (API documentation)

## Next Steps

1. **Start the backend** with `npm run dev`
2. **Start the frontend** and navigate to the page with the issue
3. **Watch the backend logs** for YELLOW warnings
4. **Identify the failing endpoint** from the logs
5. **Check frontend API calls** in the component making the request
6. **Fix the endpoint path** to match the available endpoints above

## Log File Locations

Development logs are written to:
- `backend/logs/combined.log` - All logs
- `backend/logs/error.log` - Errors only

To watch logs in real-time:
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Watch logs
tail -f logs/combined.log | grep "WARN\|ERROR"
```

## Example Fix

### Before:
Frontend calling:
```typescript
const response = await fetch('/api/treasury/statistics');
```

Backend has:
```typescript
router.get('/stats', async (req, res) => { ... });
```

### After:
```typescript
const response = await fetch('/api/treasury/stats');
```

The endpoint paths must match exactly!
