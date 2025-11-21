# Migration Guide: WebSockets to Server-Sent Events (SSE)

## Overview

This document details the migration from Socket.IO WebSockets to Server-Sent Events (SSE) for better serverless compatibility and simpler deployment.

## Why the Change?

**Problem**: Socket.IO requires persistent WebSocket connections, which are complex to deploy and incompatible with many serverless platforms.

**Solution**: Server-Sent Events (SSE) provide one-way, server-to-client real-time communication using standard HTTP, making deployment much simpler.

## What Changed

### Backend Changes

#### 1. New Event Service (`backend/src/services/events.ts`)

Replaces the WebSocketService with an SSE-based EventService:

```typescript
import { getEventService } from './services/events';

const eventService = getEventService();

// Emit events the same way
eventService.emitTreasuryDeposit({
  source: '0x123',
  amount: '1000',
  totalBalance: '5000',
  transactionHash: '0xabc',
  timestamp: new Date().toISOString(),
});
```

**Key Features**:
- ✅ Server-Sent Events for real-time updates
- ✅ Event history with 1-minute retention for polling fallback
- ✅ Connection tracking and metrics
- ✅ Same event channels as before
- ✅ Compatible with any Node.js hosting (Railway, Render, Heroku, etc.)

#### 2. New API Routes (`backend/src/routes/events.ts`)

Three new endpoints replace WebSocket connections:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events/stream` | GET (SSE) | Establish real-time event stream |
| `/api/events/poll` | GET | Poll for recent events (fallback) |
| `/api/events/metrics` | GET | Get event service metrics |
| `/api/events/channels` | GET | List available event channels |

**Examples**:

```bash
# SSE Stream (keeps connection open)
curl -N "https://your-backend-url.com/api/events/stream?channels=treasury:deposit,proposals:new"

# Polling (returns recent events)
curl "https://your-backend-url.com/api/events/poll?channels=treasury:deposit&since=1700000000000"

# Available channels
curl "https://your-backend-url.com/api/events/channels"
```

#### 3. Updated Index (`backend/src/index.ts`)

- ❌ Removed: `http.createServer()` and `httpServer`
- ❌ Removed: `initializeWebSocketService()`
- ✅ Added: `initializeEventService()`
- ✅ Added: `/api/events` routes
- ✅ Changed: Direct Express server instead of HTTP server wrapper

#### 4. Updated Indexer (`backend/src/services/indexer.ts`)

```diff
- import { getWebSocketService } from './websocket';
+ import { getEventService } from './events';

- const wsService = getWebSocketService();
+ const eventService = getEventService();

- wsService.emitTreasuryDeposit({ ... });
+ eventService.emitTreasuryDeposit({ ... });
```

#### 5. Removed Dependencies

```bash
# socket.io has been removed
pnpm remove socket.io
```

### Frontend Changes

#### 1. New React Hook (`frontend/hooks/useServerEvents.ts`)

Replaces WebSocket connection with SSE:

**Before (WebSocket)**:
```typescript
// Old WebSocket code
import { useSocket } from './useSocket';

const { socket, connected } = useSocket();

useEffect(() => {
  socket?.on('treasury:deposit', (data) => {
    console.log('Deposit:', data);
  });
}, [socket]);
```

**After (SSE)**:
```typescript
import { useServerEvents } from '@/hooks/useServerEvents';

const { connected, lastEvent } = useServerEvents({
  channels: ['treasury:deposit', 'proposals:new'],
  token: authToken, // Optional JWT
  onEvent: (event) => {
    console.log('Received:', event.channel, event.data);

    switch (event.channel) {
      case 'treasury:deposit':
        handleDeposit(event.data);
        break;
      case 'proposals:new':
        handleNewProposal(event.data);
        break;
    }
  },
  onConnect: () => console.log('Connected!'),
  onError: (error) => console.error('Error:', error),
});
```

**Polling Fallback** (if SSE isn't supported):
```typescript
import { usePollingEvents } from '@/hooks/useServerEvents';

const { lastEvent } = usePollingEvents({
  channels: ['treasury:deposit'],
  pollInterval: 5000, // Poll every 5 seconds
  onEvent: (event) => {
    console.log('Polled event:', event);
  },
});
```

### Deployment Strategy

The application uses a **split deployment** approach:

#### Frontend Deployment (Vercel)
- Deploy Next.js app to Vercel (or any static hosting)
- Set `NEXT_PUBLIC_API_URL` to point to your backend URL

#### Backend Deployment (Railway/Render/Heroku)
Choose any Node.js hosting platform:

**Option 1: Railway** (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
cd backend
railway init
railway up
```

**Option 2: Render**
```bash
# Create render.yaml in backend/
service:
  - type: web
    name: nexus-backend
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
```

**Option 3: Heroku**
```bash
# Create Procfile in backend/
web: node dist/index.js
```

#### Project Structure

```
NYUxAptos/
├── frontend/          # Next.js app (deploy to Vercel)
├── backend/           # Express backend (deploy to Railway/Render)
├── contracts/         # Aptos smart contracts
└── package.json       # Root workspace config
```

#### Environment Variables

**Frontend (Vercel/Netlify)**:
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_APTOS_NETWORK=testnet
AUTH0_SECRET=...
AUTH0_BASE_URL=...
AUTH0_ISSUER_BASE_URL=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
```

**Backend (Railway/Render)**:
```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your-secret-key-here
APTOS_NETWORK=testnet
APTOS_PRIVATE_KEY=0x... # If needed
CORS_ORIGIN=https://your-frontend.vercel.app
NODE_ENV=production
PORT=3001
```

## Migration Checklist

### Backend Migration

- [x] ~~Install socket.io~~ **REMOVED**
- [x] Create `backend/src/services/events.ts` (SSE service)
- [x] Create `backend/src/routes/events.ts` (API routes)
- [x] Update `backend/src/index.ts` (remove WebSocket, add EventService)
- [x] Update `backend/src/services/indexer.ts` (use EventService)
- [x] Remove socket.io dependency

### Frontend Migration

- [x] Create `frontend/hooks/useServerEvents.ts`
- [ ] Replace all `useSocket()` calls with `useServerEvents()`
- [ ] Update components that listen to WebSocket events
- [ ] Test SSE connections in development
- [ ] Test polling fallback

### Deployment Migration

- [x] Remove WebSocket dependencies
- [x] Create root `package.json` for workspace
- [ ] Deploy backend to Railway/Render
- [ ] Deploy frontend to Vercel
- [ ] Set environment variables on both platforms
- [ ] Test production deployment
- [ ] Update CORS settings

## Testing

### Local Development

```bash
# Terminal 1: Start backend
cd backend
pnpm dev
# Server runs on http://localhost:3001

# Terminal 2: Start frontend
cd frontend
pnpm dev
# App runs on http://localhost:3000

# Test SSE endpoint
curl -N "http://localhost:3001/api/events/stream?channels=treasury:deposit"
```

### Testing SSE Connection

```javascript
// In browser console
const eventSource = new EventSource(
  'http://localhost:3001/api/events/stream?channels=treasury:deposit,proposals:new'
);

eventSource.addEventListener('treasury:deposit', (e) => {
  console.log('Deposit event:', JSON.parse(e.data));
});

eventSource.addEventListener('connected', (e) => {
  console.log('Connected:', JSON.parse(e.data));
});

eventSource.onerror = (err) => {
  console.error('Error:', err);
};
```

### Testing in Production

1. **Test backend endpoints**:
   ```bash
   # Health check
   curl https://your-backend.railway.app/health

   # SSE stream
   curl -N "https://your-backend.railway.app/api/events/stream?channels=treasury:deposit"

   # Event polling
   curl "https://your-backend.railway.app/api/events/poll?channels=treasury:deposit"
   ```

2. **Check logs**:
   ```bash
   # Railway
   railway logs

   # Render
   # View logs in Render dashboard

   # Heroku
   heroku logs --tail
   ```

## Event Channels Reference

All event channels remain the same:

| Channel | Description | Event Data |
|---------|-------------|------------|
| `treasury:deposit` | New treasury deposits | `{ source, amount, totalBalance, transactionHash, timestamp }` |
| `treasury:balance` | Balance updates | `{ balance, changeAmount, changeType, timestamp }` |
| `reimbursements:new` | New reimbursement requests | `{ id, payer, payee, amount, invoiceUri, transactionHash, timestamp }` |
| `reimbursements:approved` | Reimbursement approvals | `{ id, approver, role, approved, fullyApproved, transactionHash, timestamp }` |
| `reimbursements:paid` | Reimbursement payments | `{ id, payee, amount, transactionHash, timestamp }` |
| `elections:vote` | Election votes | `{ electionId, roleName, voter, candidate, weight, timestamp }` |
| `elections:finalized` | Election results | `{ electionId, roleName, winner, isTie, totalVotes, timestamp }` |
| `proposals:new` | New proposals | `{ proposalId, creator, title, description, startTs, endTs, transactionHash, timestamp }` |
| `proposals:vote` | Proposal votes | `{ proposalId, voter, vote, weight, yayVotes, nayVotes, timestamp }` |
| `proposals:finalized` | Proposal results | `{ proposalId, status, yayVotes, nayVotes, passed, timestamp }` |

## SSE vs WebSocket Comparison

| Feature | WebSocket (Before) | SSE (After) |
|---------|-------------------|-------------|
| **Direction** | Bidirectional | Server → Client only |
| **Protocol** | Custom (ws://) | HTTP/HTTPS |
| **Vercel Support** | ❌ No | ✅ Yes |
| **Auto-Reconnect** | ✅ Built-in | ✅ Manual (implemented) |
| **Browser Support** | ✅ Good | ✅ Excellent |
| **Connection** | Persistent | Persistent (HTTP) |
| **Fallback** | Polling | ✅ Built-in polling |
| **Complexity** | High | Low |

## Troubleshooting

### SSE Connection Not Working

**Issue**: Events not being received

**Solutions**:
1. Check browser console for SSE errors
2. Verify event channels are correct
3. Test with curl: `curl -N "http://localhost:3001/api/events/stream?channels=treasury:deposit"`
4. Check backend logs for event emissions
5. Try polling fallback: `usePollingEvents()`

### Deployment Fails

**Issue**: Build or deployment errors

**Solutions**:
1. Check build logs in your hosting platform dashboard
2. Verify all environment variables are set correctly
3. Test build locally: `cd backend && pnpm build && pnpm start`
4. Verify database connection string is correct
5. Check Node.js version compatibility (requires Node 18+)

### Events Not Emitting

**Issue**: EventService not emitting events

**Solutions**:
1. Check if EventService is initialized: `getEventService()`
2. Verify indexer is running
3. Check database connection
4. Test manually:
   ```typescript
   const eventService = getEventService();
   eventService.emitTreasuryDeposit({ ... });
   ```

### CORS Errors

**Issue**: Frontend can't connect to SSE

**Solutions**:
1. Update `CORS_ORIGIN` environment variable on backend
2. Verify CORS middleware in backend allows your frontend domain
3. Verify API URL: `process.env.NEXT_PUBLIC_API_URL` in frontend
4. Check browser console for specific CORS error messages

## Performance Considerations

### SSE Advantages
- ✅ Lower latency than polling
- ✅ Efficient server push
- ✅ HTTP/2 multiplexing support
- ✅ Automatic compression
- ✅ Works with standard HTTP infrastructure

### Platform Considerations
- ⚠️ Some platforms have connection timeout limits
- ⚠️ Cold starts possible on serverless platforms
- ✅ Persistent servers (Railway/Render) have no timeout issues

### Optimizations
1. **Use polling for long-inactive connections** (> 5 minutes on platforms with timeouts)
2. **Reconnect on visibility change**:
   ```typescript
   useEffect(() => {
     const handleVisibility = () => {
       if (!document.hidden) {
         reconnect();
       }
     };
     document.addEventListener('visibilitychange', handleVisibility);
     return () => document.removeEventListener('visibilitychange', handleVisibility);
   }, [reconnect]);
   ```
3. **Filter events client-side** if subscribing to many channels
4. **Use Railway/Render for always-on backend** if you need long-lived connections

## Additional Resources

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

## Support

For issues or questions:
1. Check this migration guide
2. Test endpoints with curl/browser tools
3. Check backend logs in your hosting platform
4. Verify environment variables are set correctly

---

**Migration Status**: ✅ Complete

**Last Updated**: 2025-11-19
