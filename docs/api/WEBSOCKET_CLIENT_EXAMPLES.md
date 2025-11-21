# WebSocket Client Connection Examples

This document provides comprehensive examples for connecting to the NYU Aptos Backend WebSocket service from various client environments.

## Table of Contents

1. [JavaScript/TypeScript Browser Client](#javascripttypescript-browser-client)
2. [React.js Client](#reactjs-client)
3. [Node.js Client](#nodejs-client)
4. [Python Client](#python-client)
5. [Authentication](#authentication)
6. [Channel Subscription](#channel-subscription)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## JavaScript/TypeScript Browser Client

### Basic Connection

```javascript
import { io } from 'socket.io-client';

// Connect to WebSocket server
const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

### With Authentication

```javascript
import { io } from 'socket.io-client';

// Assuming you have a JWT token from authentication
const token = localStorage.getItem('authToken');

const socket = io('http://localhost:3001', {
  auth: {
    token: token,
  },
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('Authenticated connection established');
});
```

### Subscribe to Channels

```javascript
// Subscribe to specific channels
socket.on('connect', () => {
  // Subscribe to treasury events
  socket.emit('subscribe', [
    'treasury:deposit',
    'treasury:balance',
  ]);

  // Subscribe to reimbursement events
  socket.emit('subscribe', [
    'reimbursements:new',
    'reimbursements:approved',
    'reimbursements:paid',
  ]);
});

// Handle subscription confirmation
socket.on('subscribed', (data) => {
  console.log('Subscribed to channels:', data.channels);
});
```

### Listen to Events

```javascript
// Treasury deposit event
socket.on('treasury:deposit', (data) => {
  console.log('New deposit received:', {
    source: data.source,
    amount: data.amount,
    totalBalance: data.totalBalance,
    transactionHash: data.transactionHash,
    timestamp: data.timestamp,
  });

  // Update UI with new deposit
  updateTreasuryBalance(data.totalBalance);
});

// Reimbursement new event
socket.on('reimbursements:new', (data) => {
  console.log('New reimbursement request:', {
    id: data.id,
    payer: data.payer,
    payee: data.payee,
    amount: data.amount,
    invoiceUri: data.invoiceUri,
  });

  // Show notification
  showNotification('New reimbursement request submitted');
});

// Reimbursement approved event
socket.on('reimbursements:approved', (data) => {
  console.log('Reimbursement approved:', {
    id: data.id,
    role: data.role,
    approver: data.approver,
    fullyApproved: data.fullyApproved,
  });

  // Update reimbursement status in UI
  updateReimbursementStatus(data.id, data.approved);
});

// Election vote event
socket.on('elections:vote', (data) => {
  console.log('New vote cast:', {
    electionId: data.electionId,
    roleName: data.roleName,
    candidate: data.candidate,
    weight: data.weight,
  });

  // Update vote count in real-time
  updateVoteCount(data.electionId, data.candidate);
});

// Proposal vote event
socket.on('proposals:vote', (data) => {
  console.log('Proposal vote:', {
    proposalId: data.proposalId,
    voter: data.voter,
    vote: data.vote ? 'YES' : 'NO',
    yayVotes: data.yayVotes,
    nayVotes: data.nayVotes,
  });

  // Update proposal vote counts
  updateProposalVotes(data.proposalId, data.yayVotes, data.nayVotes);
});
```

---

## React.js Client

### Custom Hook for WebSocket

```typescript
// hooks/useWebSocket.ts
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketConfig {
  url: string;
  token?: string;
  channels?: string[];
}

export const useWebSocket = ({ url, token, channels = [] }: WebSocketConfig) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(url, {
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setError(null);

      // Subscribe to channels on connect
      if (channels.length > 0) {
        newSocket.emit('subscribe', channels);
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      setError(err.message);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [url, token]);

  const subscribe = useCallback((newChannels: string | string[]) => {
    if (socket && connected) {
      socket.emit('subscribe', newChannels);
    }
  }, [socket, connected]);

  const unsubscribe = useCallback((channelsToRemove: string | string[]) => {
    if (socket && connected) {
      socket.emit('unsubscribe', channelsToRemove);
    }
  }, [socket, connected]);

  return { socket, connected, error, subscribe, unsubscribe };
};
```

### Using the Hook in Components

```typescript
// components/TreasuryDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface TreasuryData {
  balance: string;
  deposits: any[];
}

export const TreasuryDashboard: React.FC = () => {
  const [treasuryData, setTreasuryData] = useState<TreasuryData>({
    balance: '0',
    deposits: [],
  });

  const { socket, connected } = useWebSocket({
    url: 'http://localhost:3001',
    token: localStorage.getItem('authToken') || undefined,
    channels: ['treasury:deposit', 'treasury:balance'],
  });

  useEffect(() => {
    if (!socket) return;

    // Listen for deposit events
    socket.on('treasury:deposit', (data) => {
      console.log('New deposit:', data);

      setTreasuryData((prev) => ({
        balance: data.totalBalance,
        deposits: [data, ...prev.deposits],
      }));

      // Show toast notification
      toast.success(`New deposit: ${data.amount} from ${data.source}`);
    });

    // Listen for balance updates
    socket.on('treasury:balance', (data) => {
      console.log('Balance updated:', data);
      setTreasuryData((prev) => ({
        ...prev,
        balance: data.balance,
      }));
    });

    return () => {
      socket.off('treasury:deposit');
      socket.off('treasury:balance');
    };
  }, [socket]);

  return (
    <div>
      <h2>Treasury Dashboard</h2>
      <div>
        Connection Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      <div>
        <h3>Balance: {treasuryData.balance}</h3>
      </div>
      <div>
        <h3>Recent Deposits</h3>
        <ul>
          {treasuryData.deposits.map((deposit, idx) => (
            <li key={idx}>
              {deposit.amount} from {deposit.source}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

### Proposal Voting Component

```typescript
// components/ProposalVoting.tsx
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface ProposalVotes {
  [proposalId: string]: {
    yayVotes: string;
    nayVotes: string;
  };
}

export const ProposalVoting: React.FC<{ proposalId: string }> = ({ proposalId }) => {
  const [votes, setVotes] = useState<ProposalVotes>({});

  const { socket, connected } = useWebSocket({
    url: 'http://localhost:3001',
    channels: ['proposals:vote', 'proposals:finalized'],
  });

  useEffect(() => {
    if (!socket) return;

    socket.on('proposals:vote', (data) => {
      if (data.proposalId === proposalId) {
        setVotes((prev) => ({
          ...prev,
          [data.proposalId]: {
            yayVotes: data.yayVotes,
            nayVotes: data.nayVotes,
          },
        }));
      }
    });

    socket.on('proposals:finalized', (data) => {
      if (data.proposalId === proposalId) {
        alert(`Proposal ${data.passed ? 'PASSED' : 'REJECTED'}`);
      }
    });

    return () => {
      socket.off('proposals:vote');
      socket.off('proposals:finalized');
    };
  }, [socket, proposalId]);

  const currentVotes = votes[proposalId] || { yayVotes: '0', nayVotes: '0' };

  return (
    <div>
      <h3>Real-time Voting</h3>
      <div>Status: {connected ? 'Live' : 'Offline'}</div>
      <div>
        <div>✅ Yay: {currentVotes.yayVotes}</div>
        <div>❌ Nay: {currentVotes.nayVotes}</div>
      </div>
    </div>
  );
};
```

---

## Node.js Client

```javascript
// node-client.js
const { io } = require('socket.io-client');

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  reconnection: true,
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');

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
  console.log('Subscribed to channels:', data.channels);
});

// Listen to all events
socket.onAny((eventName, data) => {
  console.log(`Event: ${eventName}`, JSON.stringify(data, null, 2));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Disconnecting...');
  socket.close();
  process.exit(0);
});
```

---

## Python Client

```python
# python_client.py
import socketio
import json

# Create Socket.IO client
sio = socketio.Client()

@sio.event
def connect():
    print('Connected to WebSocket server')

    # Subscribe to channels
    sio.emit('subscribe', [
        'treasury:deposit',
        'reimbursements:new',
        'proposals:vote',
    ])

@sio.event
def disconnect():
    print('Disconnected from server')

@sio.on('subscribed')
def on_subscribed(data):
    print(f"Subscribed to channels: {data['channels']}")

@sio.on('treasury:deposit')
def on_deposit(data):
    print(f"New deposit: {json.dumps(data, indent=2)}")

@sio.on('reimbursements:new')
def on_reimbursement(data):
    print(f"New reimbursement: {json.dumps(data, indent=2)}")

@sio.on('proposals:vote')
def on_proposal_vote(data):
    print(f"Proposal vote: {json.dumps(data, indent=2)}")

# Connect to server
try:
    sio.connect('http://localhost:3001', transports=['websocket'])
    sio.wait()
except KeyboardInterrupt:
    print('Disconnecting...')
    sio.disconnect()
```

---

## Authentication

### JWT Token Authentication

```javascript
// Generate JWT token (backend)
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { address: '0x1234...', role: 'user' },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Use token in client
const socket = io('http://localhost:3001', {
  auth: {
    token: token,
  },
});

// Or via query parameter
const socket = io('http://localhost:3001', {
  query: {
    token: token,
  },
});
```

---

## Channel Subscription

### Available Channels

- `treasury:deposit` - New treasury deposits
- `treasury:balance` - Treasury balance changes
- `reimbursements:new` - New reimbursement requests
- `reimbursements:approved` - Reimbursement approvals
- `reimbursements:paid` - Reimbursement payments
- `elections:vote` - Election votes
- `elections:finalized` - Election results
- `proposals:new` - New proposals created
- `proposals:vote` - Proposal votes
- `proposals:finalized` - Proposal finalization

### Dynamic Subscription

```javascript
// Subscribe to additional channels after connection
socket.emit('subscribe', 'proposals:new');

// Subscribe to multiple channels
socket.emit('subscribe', ['elections:vote', 'elections:finalized']);

// Unsubscribe from channels
socket.emit('unsubscribe', 'treasury:deposit');
socket.emit('unsubscribe', ['reimbursements:new', 'reimbursements:approved']);
```

---

## Error Handling

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);

  // Retry logic
  setTimeout(() => {
    socket.connect();
  }, 5000);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Handle subscription errors
socket.on('error', (data) => {
  if (data.message.includes('Invalid channel')) {
    console.error('Invalid channel:', data);
  }
});

// Rate limit handling
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server disconnected due to rate limit or policy
    console.warn('Disconnected by server, possibly rate limited');
  }
});
```

---

## Best Practices

### 1. Connection Management

```javascript
class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.socket = io(this.url, {
      ...this.options,
      reconnection: false, // Handle reconnection manually
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);

      if (reason === 'io server disconnect') {
        // Server disconnected, attempt reconnection
        this.attemptReconnect();
      }
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}
```

### 2. Event Batching

```javascript
// Batch updates to prevent UI thrashing
let updateQueue = [];
let updateTimeout = null;

socket.on('proposals:vote', (data) => {
  updateQueue.push(data);

  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  updateTimeout = setTimeout(() => {
    processBatchUpdates(updateQueue);
    updateQueue = [];
  }, 100);
});

function processBatchUpdates(updates) {
  // Process all updates at once
  updates.forEach((update) => {
    updateProposalVotes(update.proposalId, update.yayVotes, update.nayVotes);
  });
}
```

### 3. Memory Management

```javascript
// Clean up event listeners when component unmounts
useEffect(() => {
  if (!socket) return;

  const handleDeposit = (data) => {
    // Handle event
  };

  socket.on('treasury:deposit', handleDeposit);

  return () => {
    socket.off('treasury:deposit', handleDeposit);
  };
}, [socket]);
```

### 4. Health Check

```javascript
// Implement ping/pong for connection health
setInterval(() => {
  if (socket && socket.connected) {
    socket.emit('ping');

    const timeout = setTimeout(() => {
      console.warn('Ping timeout, connection may be dead');
      socket.disconnect();
      socket.connect();
    }, 5000);

    socket.once('pong', () => {
      clearTimeout(timeout);
    });
  }
}, 30000);
```

---

## Testing

### Test Client

```javascript
// test-client.js
const { io } = require('socket.io-client');

const socket = io('http://localhost:3001');

let eventCount = 0;

socket.onAny((eventName, data) => {
  eventCount++;
  console.log(`[${eventCount}] ${eventName}:`, JSON.stringify(data, null, 2));
});

setTimeout(() => {
  console.log(`Received ${eventCount} events`);
  socket.close();
  process.exit(0);
}, 60000); // Run for 1 minute
```

---

## Troubleshooting

### Connection Issues

1. **CORS Errors**: Ensure `CORS_ORIGIN` environment variable matches your client URL
2. **Connection Refused**: Check that the backend server is running on the correct port
3. **Authentication Failures**: Verify JWT token is valid and not expired
4. **Rate Limiting**: Reduce event emission frequency or increase rate limits

### Performance Issues

1. **High Latency**: Use WebSocket transport instead of polling
2. **Memory Leaks**: Ensure event listeners are properly cleaned up
3. **Too Many Updates**: Implement event batching or throttling

---

## Additional Resources

- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [WebSocket API Documentation](./WEBSOCKET_API.md)
- [Backend Architecture](./ARCHITECTURE.md)
