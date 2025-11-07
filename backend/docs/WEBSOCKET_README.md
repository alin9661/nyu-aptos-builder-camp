# WebSocket Real-Time Updates - Implementation Guide

## Overview

This implementation provides comprehensive WebSocket support for real-time blockchain event updates in the NYU Aptos Backend. It enables clients to receive instant notifications when blockchain events are indexed, eliminating the need for polling.

## Architecture

```
┌─────────────────┐
│   Blockchain    │
│   (Aptos)       │
└────────┬────────┘
         │
         │ Events
         ▼
┌─────────────────┐
│   Indexer       │◄─── Polls blockchain
│   Service       │
└────────┬────────┘
         │
         │ Emit Events
         ▼
┌─────────────────┐
│   WebSocket     │◄─── Manages connections
│   Service       │      and channels
└────────┬────────┘
         │
         │ Push Events
         ▼
┌─────────────────┐
│   Clients       │
│   (Web/Mobile)  │
└─────────────────┘
```

## Features

### 1. Real-Time Event Broadcasting
- **Treasury Events:** Deposits and balance changes
- **Reimbursement Events:** New requests, approvals, and payments
- **Election Events:** Votes and results
- **Proposal Events:** Creation, voting, and finalization

### 2. Authentication & Authorization
- Optional JWT-based authentication
- Anonymous connections supported
- Per-connection identity tracking

### 3. Channel Management
- Subscribe/unsubscribe to specific event channels
- Room-based event distribution
- Efficient subscriber tracking

### 4. Rate Limiting
- Per-connection rate limiting (100 events/minute default)
- Prevents abuse and ensures fair resource usage
- Configurable limits

### 5. Connection Management
- Automatic reconnection support
- Ping/pong health checks
- Graceful shutdown handling
- Connection metrics tracking

### 6. Monitoring & Observability
- Active connection tracking
- Per-channel subscriber counts
- Event emission metrics
- Health check endpoints

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install socket.io
npm install --save-dev @types/socket.io
```

### 2. Environment Configuration

Add to your `.env` file:

```bash
# WebSocket Configuration
WS_PING_TIMEOUT=60000
WS_PING_INTERVAL=25000
WS_MAX_EVENTS_PER_MINUTE=100
WS_RATE_LIMIT_WINDOW=60000

# JWT Secret (required for authentication)
JWT_SECRET=your_jwt_secret_here_min_32_characters_recommended
```

### 3. Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The WebSocket server will be available at:
- Development: `ws://localhost:3001`
- Production: `wss://your-domain.com`

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── websocket.ts          # WebSocket service implementation
│   │   └── indexer.ts             # Updated with WebSocket emissions
│   ├── index.ts                   # Updated with WebSocket integration
│   └── ...
├── docs/
│   ├── WEBSOCKET_README.md        # This file
│   ├── WEBSOCKET_API.md           # Complete API documentation
│   └── WEBSOCKET_CLIENT_EXAMPLES.md  # Client integration examples
└── .env.example                   # Environment configuration template
```

## Quick Start

### Server-Side (Already Implemented)

The WebSocket service is automatically initialized when the server starts. No additional configuration needed!

### Client-Side (Basic Example)

```javascript
import { io } from 'socket.io-client';

// Connect to WebSocket server
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token', // Optional
  },
});

// Subscribe to channels
socket.on('connect', () => {
  socket.emit('subscribe', [
    'treasury:deposit',
    'proposals:vote',
  ]);
});

// Listen for events
socket.on('treasury:deposit', (data) => {
  console.log('New deposit:', data.amount);
  // Update your UI
});

socket.on('proposals:vote', (data) => {
  console.log('Proposal vote:', data);
  // Update vote counts in real-time
});
```

## Available Channels

| Channel | Description |
|---------|-------------|
| `treasury:deposit` | New treasury deposits |
| `treasury:balance` | Treasury balance changes |
| `reimbursements:new` | New reimbursement requests |
| `reimbursements:approved` | Reimbursement approvals |
| `reimbursements:paid` | Reimbursement payments |
| `elections:vote` | Election votes |
| `elections:finalized` | Election results |
| `proposals:new` | New proposals |
| `proposals:vote` | Proposal votes |
| `proposals:finalized` | Proposal results |

## Monitoring

### Health Check

Check WebSocket status:

```bash
curl http://localhost:3001/health
```

Response includes WebSocket metrics:
```json
{
  "websocket": {
    "connected": true,
    "activeConnections": 25,
    "totalConnections": 150,
    "totalEvents": 5000
  }
}
```

### Detailed Metrics

Get comprehensive WebSocket metrics:

```bash
curl http://localhost:3001/api/websocket/metrics
```

Response:
```json
{
  "success": true,
  "metrics": {
    "activeConnections": 25,
    "totalConnections": 150,
    "totalEvents": 5000,
    "eventsByChannel": {
      "treasury:deposit": 250,
      "proposals:vote": 1500
    },
    "channelSubscribers": {
      "treasury:deposit": 10,
      "proposals:vote": 15
    }
  }
}
```

## Testing

### Test WebSocket Connection

```javascript
// test-websocket.js
const { io } = require('socket.io-client');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');

  // Subscribe to all channels
  socket.emit('subscribe', [
    'treasury:deposit',
    'treasury:balance',
    'reimbursements:new',
    'reimbursements:approved',
    'reimbursements:paid',
    'elections:vote',
    'elections:finalized',
    'proposals:new',
    'proposals:vote',
    'proposals:finalized',
  ]);
});

socket.on('subscribed', (data) => {
  console.log('✅ Subscribed to channels:', data.channels);
});

// Log all events
socket.onAny((eventName, data) => {
  console.log(`📡 Event: ${eventName}`, data);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});
```

Run the test:
```bash
node test-websocket.js
```

## Performance Considerations

### Server-Side

1. **Event Emission:** Events are only sent to subscribed clients
2. **Memory Management:** Efficient subscriber tracking with Sets
3. **Connection Pooling:** Reuses HTTP server for WebSocket
4. **Rate Limiting:** Prevents resource exhaustion

### Client-Side Best Practices

1. **Selective Subscription:** Only subscribe to needed channels
2. **Event Batching:** Batch rapid UI updates
3. **Memory Cleanup:** Remove event listeners on unmount
4. **Reconnection Strategy:** Use exponential backoff

## Security

### Transport Security

- **Development:** Use WS (unencrypted)
- **Production:** Use WSS (TLS encrypted)
- **CORS:** Configure allowed origins in `CORS_ORIGIN`

### Authentication

- JWT tokens validated on connection
- Optional authentication (anonymous allowed)
- Per-connection identity tracking

### Rate Limiting

- Default: 100 events per minute per connection
- Configurable via `WS_MAX_EVENTS_PER_MINUTE`
- Window size: 60 seconds (configurable)

## Troubleshooting

### Issue: Cannot connect to WebSocket

**Solution:**
1. Check server is running: `curl http://localhost:3001/health`
2. Verify port is correct (default: 3001)
3. Check CORS_ORIGIN includes your client URL
4. Try both websocket and polling transports

### Issue: Not receiving events

**Solution:**
1. Verify subscription: Check `subscribed` event
2. Ensure indexer service is running: `npm run indexer`
3. Check server logs for event emission
4. Verify blockchain events are occurring

### Issue: Connection drops frequently

**Solution:**
1. Check network stability
2. Implement ping/pong health checks
3. Use exponential backoff for reconnection
4. Check server resources (CPU, memory)

### Issue: High latency

**Solution:**
1. Use websocket transport only (disable polling)
2. Check geographic proximity to server
3. Monitor server load
4. Consider CDN or edge deployment

## Scaling Considerations

### Horizontal Scaling

For multiple server instances, consider:

1. **Redis Adapter:** Use Socket.IO Redis adapter
   ```typescript
   import { createAdapter } from '@socket.io/redis-adapter';
   import { createClient } from 'redis';

   const pubClient = createClient({ url: 'redis://localhost:6379' });
   const subClient = pubClient.duplicate();

   io.adapter(createAdapter(pubClient, subClient));
   ```

2. **Sticky Sessions:** Use load balancer sticky sessions
3. **Shared State:** Use Redis for shared connection state

### Vertical Scaling

- Increase Node.js memory: `--max-old-space-size=4096`
- Use clustering: `pm2 start src/index.ts -i max`
- Monitor and optimize event emission frequency

## Advanced Features

### Custom Event Filtering

```typescript
// Server-side: Add user-specific filtering
socket.on('subscribe:filtered', ({ channel, filter }) => {
  socket.join(`${channel}:${filter}`);
});

// Emit to filtered room
io.to(`proposals:vote:${proposalId}`).emit('proposals:vote', data);
```

### Historical Events

```typescript
// Server-side: Send recent events on subscription
socket.on('subscribe:withHistory', async ({ channel, limit = 10 }) => {
  const history = await getRecentEvents(channel, limit);
  socket.emit(`${channel}:history`, history);
  socket.join(channel);
});
```

### Presence Tracking

```typescript
// Server-side: Track online users
socket.on('presence:join', ({ proposalId }) => {
  socket.join(`presence:${proposalId}`);
  io.to(`presence:${proposalId}`).emit('presence:update', {
    users: getOnlineUsers(proposalId),
  });
});
```

## Migration from Polling

If you're currently using polling:

### Before (Polling)
```javascript
// Poll every 5 seconds
setInterval(async () => {
  const data = await fetch('/api/treasury/balance');
  updateUI(data);
}, 5000);
```

### After (WebSocket)
```javascript
// Real-time updates
socket.on('treasury:balance', (data) => {
  updateUI(data);
});
```

**Benefits:**
- ✅ Instant updates (no delay)
- ✅ Reduced server load (no constant polling)
- ✅ Lower bandwidth usage
- ✅ Better user experience

## Documentation Links

- **[Complete API Documentation](./WEBSOCKET_API.md)** - Comprehensive API reference
- **[Client Examples](./WEBSOCKET_CLIENT_EXAMPLES.md)** - Integration examples for all platforms
- **[Socket.IO Documentation](https://socket.io/docs/v4/)** - Official Socket.IO docs

## Support

For issues or questions:
1. Check the [API Documentation](./WEBSOCKET_API.md)
2. Review [Client Examples](./WEBSOCKET_CLIENT_EXAMPLES.md)
3. Check server logs for errors
4. Open an issue on GitHub

## License

MIT License - Same as parent project
