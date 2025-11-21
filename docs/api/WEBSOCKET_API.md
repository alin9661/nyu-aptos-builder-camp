# WebSocket API Documentation

This document provides comprehensive documentation for the NYU Aptos Backend WebSocket API, including event channels, payload formats, and usage guidelines.

## Table of Contents

1. [Connection](#connection)
2. [Authentication](#authentication)
3. [Client Events](#client-events)
4. [Server Events](#server-events)
5. [Event Payloads](#event-payloads)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Monitoring](#monitoring)

---

## Connection

### Endpoint

```
ws://localhost:3001
wss://your-domain.com (for production with SSL)
```

### Connection Options

```javascript
{
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  pingTimeout: 60000,
  pingInterval: 25000,
}
```

### CORS Configuration

The WebSocket server accepts connections from origins specified in the `CORS_ORIGIN` environment variable.

Default: `http://localhost:3000`

---

## Authentication

### Optional Authentication

Authentication is optional but recommended for personalized experiences and access control.

#### Method 1: Auth Token in Handshake

```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token',
  },
});
```

#### Method 2: Query Parameter

```javascript
const socket = io('http://localhost:3001', {
  query: {
    token: 'your-jwt-token',
  },
});
```

### JWT Token Format

```json
{
  "address": "0x1234567890abcdef...",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Authentication Status

After connection, the socket will have:
- `socket.data.authenticated`: `true` if token is valid, `false` otherwise
- `socket.data.address`: Wallet address or `'anonymous'`

---

## Client Events

Events that clients can emit to the server.

### `subscribe`

Subscribe to one or more event channels.

**Payload:**
```typescript
string | string[]
```

**Examples:**
```javascript
// Subscribe to single channel
socket.emit('subscribe', 'treasury:deposit');

// Subscribe to multiple channels
socket.emit('subscribe', [
  'treasury:deposit',
  'treasury:balance',
  'reimbursements:new',
]);
```

**Response:**
```json
{
  "channels": ["treasury:deposit", "treasury:balance"],
  "timestamp": 1234567890
}
```

---

### `unsubscribe`

Unsubscribe from one or more event channels.

**Payload:**
```typescript
string | string[]
```

**Examples:**
```javascript
// Unsubscribe from single channel
socket.emit('unsubscribe', 'treasury:deposit');

// Unsubscribe from multiple channels
socket.emit('unsubscribe', ['treasury:deposit', 'treasury:balance']);
```

**Response:**
```json
{
  "channels": ["treasury:deposit"],
  "timestamp": 1234567890
}
```

---

### `ping`

Send a ping to check connection health.

**Payload:** None

**Response:**
```json
{
  "timestamp": 1234567890
}
```

**Example:**
```javascript
socket.emit('ping');
socket.on('pong', (data) => {
  console.log('Latency:', Date.now() - data.timestamp, 'ms');
});
```

---

## Server Events

Events emitted by the server to subscribed clients.

### Treasury Events

#### `treasury:deposit`

Emitted when a new deposit is received by the treasury.

**Channel:** `treasury:deposit`

**Payload:**
```typescript
{
  source: string;           // Depositor address
  amount: string;           // Deposit amount
  totalBalance: string;     // New treasury balance
  transactionHash: string;  // Transaction hash
  timestamp: string;        // ISO 8601 timestamp
  channel: string;          // Event channel
  emittedAt: number;        // Emission timestamp (ms)
}
```

**Example:**
```json
{
  "source": "0x1234567890abcdef",
  "amount": "1000000000",
  "totalBalance": "5000000000",
  "transactionHash": "0xabcdef...",
  "timestamp": "2024-11-07T12:00:00.000Z",
  "channel": "treasury:deposit",
  "emittedAt": 1699358400000
}
```

---

#### `treasury:balance`

Emitted when treasury balance changes.

**Channel:** `treasury:balance`

**Payload:**
```typescript
{
  balance: string;          // Current balance
  changeAmount: string;     // Amount changed
  changeType: 'deposit' | 'withdrawal';
  timestamp: string;        // ISO 8601 timestamp
  channel: string;
  emittedAt: number;
}
```

**Example:**
```json
{
  "balance": "5000000000",
  "changeAmount": "1000000000",
  "changeType": "deposit",
  "timestamp": "2024-11-07T12:00:00.000Z",
  "channel": "treasury:balance",
  "emittedAt": 1699358400000
}
```

---

### Reimbursement Events

#### `reimbursements:new`

Emitted when a new reimbursement request is submitted.

**Channel:** `reimbursements:new`

**Payload:**
```typescript
{
  id: string;               // Request ID
  payer: string;            // Payer address
  payee: string;            // Payee address
  amount: string;           // Reimbursement amount
  invoiceUri: string;       // IPFS URI of invoice
  transactionHash: string;  // Transaction hash
  timestamp: string;        // ISO 8601 timestamp
  channel: string;
  emittedAt: number;
}
```

**Example:**
```json
{
  "id": "12345",
  "payer": "0xpayer...",
  "payee": "0xpayee...",
  "amount": "500000000",
  "invoiceUri": "ipfs://QmXyz...",
  "transactionHash": "0xabc...",
  "timestamp": "2024-11-07T12:00:00.000Z",
  "channel": "reimbursements:new",
  "emittedAt": 1699358400000
}
```

---

#### `reimbursements:approved`

Emitted when a reimbursement request receives an approval.

**Channel:** `reimbursements:approved`

**Payload:**
```typescript
{
  id: string;               // Request ID
  approver: string;         // Approver address
  role: string;             // Approver role (ADVISOR, PRESIDENT, VICE)
  approved: {
    advisor: boolean;
    president: boolean;
    vice: boolean;
  };
  fullyApproved: boolean;   // All three approvals received
  transactionHash: string;
  timestamp: string;
  channel: string;
  emittedAt: number;
}
```

**Example:**
```json
{
  "id": "12345",
  "approver": "0xadvisor...",
  "role": "ADVISOR",
  "approved": {
    "advisor": true,
    "president": false,
    "vice": false
  },
  "fullyApproved": false,
  "transactionHash": "0xdef...",
  "timestamp": "2024-11-07T12:05:00.000Z",
  "channel": "reimbursements:approved",
  "emittedAt": 1699358700000
}
```

---

#### `reimbursements:paid`

Emitted when a reimbursement is paid out.

**Channel:** `reimbursements:paid`

**Payload:**
```typescript
{
  id: string;               // Request ID
  payee: string;            // Payee address
  amount: string;           // Payment amount
  transactionHash: string;
  timestamp: string;
  channel: string;
  emittedAt: number;
}
```

**Example:**
```json
{
  "id": "12345",
  "payee": "0xpayee...",
  "amount": "500000000",
  "transactionHash": "0xghi...",
  "timestamp": "2024-11-07T12:10:00.000Z",
  "channel": "reimbursements:paid",
  "emittedAt": 1699359000000
}
```

---

### Election Events

#### `elections:vote`

Emitted when a vote is cast in an election.

**Channel:** `elections:vote`

**Payload:**
```typescript
{
  electionId: string;       // Election ID
  roleName: string;         // Role being elected
  voter: string;            // Voter address
  candidate: string;        // Candidate address
  weight: string;           // Vote weight
  timestamp: string;
  channel: string;
  emittedAt: number;
}
```

**Example:**
```json
{
  "electionId": "1",
  "roleName": "PRESIDENT",
  "voter": "0xvoter...",
  "candidate": "0xcandidate...",
  "weight": "100",
  "timestamp": "2024-11-07T12:00:00.000Z",
  "channel": "elections:vote",
  "emittedAt": 1699358400000
}
```

---

#### `elections:finalized`

Emitted when an election is finalized.

**Channel:** `elections:finalized`

**Payload:**
```typescript
{
  electionId: string;       // Election ID
  roleName: string;         // Role being elected
  winner: string | null;    // Winner address or null if tie
  isTie: boolean;           // Whether election ended in tie
  totalVotes: number;       // Total votes cast
  timestamp: string;
  channel: string;
  emittedAt: number;
}
```

**Example:**
```json
{
  "electionId": "1",
  "roleName": "PRESIDENT",
  "winner": "0xwinner...",
  "isTie": false,
  "totalVotes": 150,
  "timestamp": "2024-11-07T18:00:00.000Z",
  "channel": "elections:finalized",
  "emittedAt": 1699380000000
}
```

---

### Proposal Events

#### `proposals:new`

Emitted when a new proposal is created.

**Channel:** `proposals:new`

**Payload:**
```typescript
{
  proposalId: string;       // Proposal ID
  creator: string;          // Creator address
  title: string;            // Proposal title
  description: string;      // Proposal description
  startTs: string;          // Start timestamp
  endTs: string;            // End timestamp
  transactionHash: string;
  timestamp: string;
  channel: string;
  emittedAt: number;
}
```

**Example:**
```json
{
  "proposalId": "42",
  "creator": "0xcreator...",
  "title": "Increase Treasury Budget",
  "description": "",
  "startTs": "1699358400000",
  "endTs": "1699444800000",
  "transactionHash": "0xjkl...",
  "timestamp": "2024-11-07T12:00:00.000Z",
  "channel": "proposals:new",
  "emittedAt": 1699358400000
}
```

---

#### `proposals:vote`

Emitted when a vote is cast on a proposal.

**Channel:** `proposals:vote`

**Payload:**
```typescript
{
  proposalId: string;       // Proposal ID
  voter: string;            // Voter address
  vote: boolean;            // true = yay, false = nay
  weight: string;           // Vote weight
  yayVotes: string;         // Updated yay vote count
  nayVotes: string;         // Updated nay vote count
  timestamp: string;
  channel: string;
  emittedAt: number;
}
```

**Example:**
```json
{
  "proposalId": "42",
  "voter": "0xvoter...",
  "vote": true,
  "weight": "100",
  "yayVotes": "500",
  "nayVotes": "200",
  "timestamp": "2024-11-07T12:30:00.000Z",
  "channel": "proposals:vote",
  "emittedAt": 1699360200000
}
```

---

#### `proposals:finalized`

Emitted when a proposal is finalized.

**Channel:** `proposals:finalized`

**Payload:**
```typescript
{
  proposalId: string;       // Proposal ID
  status: number;           // Proposal status (1=Pending, 2=Approved, 3=Rejected, 4=Executed)
  yayVotes: string;         // Final yay votes
  nayVotes: string;         // Final nay votes
  passed: boolean;          // Whether proposal passed
  timestamp: string;
  channel: string;
  emittedAt: number;
}
```

**Example:**
```json
{
  "proposalId": "42",
  "status": 2,
  "yayVotes": "1500",
  "nayVotes": "500",
  "passed": true,
  "timestamp": "2024-11-08T12:00:00.000Z",
  "channel": "proposals:finalized",
  "emittedAt": 1699444800000
}
```

---

### System Events

#### `system:message`

Broadcast system messages to all connected clients.

**Payload:**
```typescript
{
  message: string;
  data?: any;
  timestamp: number;
}
```

**Example:**
```json
{
  "message": "Server is shutting down",
  "timestamp": 1699358400000
}
```

---

#### `subscribed`

Confirmation of channel subscription.

**Payload:**
```typescript
{
  channels: string[];
  timestamp: number;
}
```

---

#### `unsubscribed`

Confirmation of channel unsubscription.

**Payload:**
```typescript
{
  channels: string[];
  timestamp: number;
}
```

---

#### `pong`

Response to ping event.

**Payload:**
```typescript
{
  timestamp: number;
}
```

---

## Error Handling

### Error Event

**Event:** `error`

**Payload:**
```typescript
{
  message: string;
  validChannels?: string[];
}
```

**Example:**
```json
{
  "message": "Invalid channel: invalid:channel",
  "validChannels": [
    "treasury:deposit",
    "treasury:balance",
    "reimbursements:new",
    "..."
  ]
}
```

### Common Errors

1. **Invalid Channel**
   - Emitted when subscribing to non-existent channel
   - Check `validChannels` in error response

2. **Authentication Failed**
   - Connection continues but marked as unauthenticated
   - Check JWT token validity

3. **Rate Limit Exceeded**
   - Server may disconnect socket
   - Implement exponential backoff for reconnection

---

## Rate Limiting

### Configuration

- **Max Events per Client:** 100 events per minute
- **Window:** 60 seconds (rolling)
- **Action on Exceed:** Warning logged, future implementation may disconnect

### Best Practices

1. **Batch Updates:** Group rapid updates on client side
2. **Throttle Subscriptions:** Don't subscribe/unsubscribe rapidly
3. **Event Filtering:** Only subscribe to needed channels
4. **Connection Pooling:** Reuse connections instead of creating new ones

---

## Monitoring

### Health Check Endpoint

**HTTP GET** `/health`

```json
{
  "status": "ok",
  "websocket": {
    "connected": true,
    "activeConnections": 25,
    "totalConnections": 150,
    "totalEvents": 5000
  }
}
```

---

### Metrics Endpoint

**HTTP GET** `/api/websocket/metrics`

```json
{
  "success": true,
  "metrics": {
    "activeConnections": 25,
    "totalConnections": 150,
    "totalEvents": 5000,
    "eventsByChannel": {
      "treasury:deposit": 250,
      "proposals:vote": 1500,
      "elections:vote": 800
    },
    "channelSubscribers": {
      "treasury:deposit": 10,
      "proposals:vote": 15,
      "elections:vote": 8
    }
  }
}
```

---

## Channel Summary

| Channel | Event Type | Description |
|---------|-----------|-------------|
| `treasury:deposit` | Treasury | New deposits received |
| `treasury:balance` | Treasury | Balance changes |
| `reimbursements:new` | Reimbursement | New requests submitted |
| `reimbursements:approved` | Reimbursement | Approval received |
| `reimbursements:paid` | Reimbursement | Payment executed |
| `elections:vote` | Election | Vote cast |
| `elections:finalized` | Election | Election completed |
| `proposals:new` | Proposal | New proposal created |
| `proposals:vote` | Proposal | Vote cast |
| `proposals:finalized` | Proposal | Proposal finalized |

---

## Example Usage Flow

```javascript
// 1. Connect
const socket = io('http://localhost:3001', {
  auth: { token: 'jwt-token' },
});

// 2. Wait for connection
socket.on('connect', () => {
  console.log('Connected');

  // 3. Subscribe to channels
  socket.emit('subscribe', [
    'treasury:deposit',
    'proposals:vote',
  ]);
});

// 4. Listen for subscription confirmation
socket.on('subscribed', (data) => {
  console.log('Subscribed to:', data.channels);
});

// 5. Listen for events
socket.on('treasury:deposit', (data) => {
  console.log('New deposit:', data);
});

socket.on('proposals:vote', (data) => {
  console.log('Proposal vote:', data);
});

// 6. Handle errors
socket.on('error', (error) => {
  console.error('Error:', error);
});

// 7. Clean up on disconnect
socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

---

## Performance Considerations

### Client-Side

1. **Selective Subscription:** Only subscribe to channels you need
2. **Event Batching:** Batch rapid UI updates
3. **Memory Management:** Clean up event listeners
4. **Reconnection Strategy:** Implement exponential backoff

### Server-Side

1. **Event Emission:** Events are emitted only to subscribed clients
2. **Connection Tracking:** Per-channel subscriber tracking
3. **Rate Limiting:** Per-connection rate limiting
4. **Graceful Shutdown:** Clean disconnect of all clients

---

## Security

### Transport Security

- Use WSS (WebSocket Secure) in production
- Configure proper CORS origins
- Implement JWT authentication

### Data Validation

- All event payloads are validated before emission
- Channel names are validated against whitelist
- Rate limiting prevents abuse

### Best Practices

1. **Token Expiry:** Use short-lived JWT tokens
2. **Token Rotation:** Implement token refresh mechanism
3. **Connection Limits:** Monitor per-user connection counts
4. **Audit Logging:** Log security-relevant events

---

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to WebSocket server

**Solutions:**
- Check server is running on correct port
- Verify CORS_ORIGIN includes your client URL
- Check firewall/network settings
- Try both websocket and polling transports

---

### Authentication Issues

**Problem:** Authentication fails despite valid token

**Solutions:**
- Verify JWT_SECRET matches server configuration
- Check token expiry
- Ensure token format includes required fields
- Check server logs for detailed error

---

### No Events Received

**Problem:** Connected but not receiving events

**Solutions:**
- Verify you're subscribed to correct channels
- Check channel names for typos
- Ensure indexer service is running
- Check server logs for event emission

---

### High Latency

**Problem:** Significant delay in receiving events

**Solutions:**
- Use websocket transport exclusively
- Check network connection quality
- Monitor server load and resources
- Consider geographic proximity to server

---

## Additional Resources

- [Client Examples](./WEBSOCKET_CLIENT_EXAMPLES.md)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Backend Architecture](./ARCHITECTURE.md)
