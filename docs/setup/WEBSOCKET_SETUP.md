# WebSocket Setup Guide

Quick setup guide for the WebSocket real-time updates feature.

## Prerequisites

- Node.js 14+ installed
- Backend server configured and running
- PostgreSQL database set up

## Installation Steps

### 1. Install Dependencies

```bash
cd backend
npm install socket.io@^4.7.5
npm install --save-dev @types/socket.io@^3.0.0
```

### 2. Update Environment Configuration

Add these lines to your `.env` file:

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
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### 4. Verify Installation

Check the health endpoint:
```bash
curl http://localhost:3001/health
```

Expected response should include:
```json
{
  "websocket": {
    "connected": true,
    "activeConnections": 0,
    "totalConnections": 0,
    "totalEvents": 0
  }
}
```

### 5. Test WebSocket Connection

Run the test client:
```bash
node test-websocket.js
```

You should see:
```
✓ Connected to WebSocket server
✓ Subscribed to 10 channels
Listening for events...
```

## Quick Test

### Option 1: Using the Test Client

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run test client
node test-websocket.js http://localhost:3001
```

### Option 2: Using Browser Console

```javascript
// In browser console
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('subscribe', ['treasury:deposit', 'proposals:vote']);
});

socket.on('subscribed', (data) => {
  console.log('Subscribed to:', data.channels);
});

socket.on('treasury:deposit', (data) => {
  console.log('New deposit:', data);
});
```

## Troubleshooting

### Issue: npm install fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install socket.io @types/socket.io
```

### Issue: Cannot connect to WebSocket

**Solution:**
1. Check server is running: `curl http://localhost:3001/health`
2. Verify port is correct (default: 3001)
3. Check `.env` CORS_ORIGIN includes your client URL

### Issue: "WebSocket service not initialized" error

**Solution:**
- Ensure server restarted after adding socket.io
- Check for TypeScript compilation errors
- Verify imports are correct

## Next Steps

1. **Read Documentation:**
   - [WebSocket README](./docs/WEBSOCKET_README.md) - Complete guide
   - [API Documentation](./docs/WEBSOCKET_API.md) - API reference
   - [Client Examples](./docs/WEBSOCKET_CLIENT_EXAMPLES.md) - Integration examples

2. **Integrate with Frontend:**
   - Use examples from `WEBSOCKET_CLIENT_EXAMPLES.md`
   - Implement real-time UI updates
   - Add notification system

3. **Monitor Performance:**
   - Check metrics: `curl http://localhost:3001/api/websocket/metrics`
   - Monitor logs: `tail -f logs/combined.log | grep WebSocket`

## Production Deployment

### 1. Update Environment

```bash
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
JWT_SECRET=<strong-secret-key>
```

### 2. Enable WSS (WebSocket Secure)

Update your reverse proxy (nginx/Apache) to support WebSocket:

**Nginx Example:**
```nginx
location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

### 3. Monitor in Production

- Set up health checks
- Monitor connection counts
- Track event rates
- Set up alerts for anomalies

## Support

For detailed documentation and examples:
- [Complete Documentation](./docs/)
- [GitHub Issues](https://github.com/your-repo/issues)

---

**Setup Status:** Follow steps 1-5 above
**Time Required:** 5-10 minutes
**Difficulty:** Easy
