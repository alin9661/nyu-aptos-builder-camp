# API Reference

Complete API documentation for the NYU Aptos Builder Camp backend.

## Base URL

```
Development: http://localhost:3001
Production:  https://api.your-domain.com
```

## Authentication

The API implements JWT-based authentication with Aptos wallet signature verification. All authentication endpoints use wallet signatures for secure, decentralized login.

### Authentication Flow
1. Request a nonce from `POST /api/auth/nonce`
2. Sign the nonce message with your Aptos wallet
3. Submit signature to `POST /api/auth/login` to receive JWT tokens
4. Use access token for authenticated requests via `Authorization: Bearer <token>` header
5. Refresh access token with `POST /api/auth/refresh` using refresh token

## Response Format

All endpoints return JSON with the following structure:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Common Query Parameters

### Pagination
```
?page=1           # Page number (default: 1)
?limit=20         # Items per page (default: 20, max: 100)
?sort=desc        # Sort order: asc or desc (default: desc)
```

---

# Authentication Endpoints

## Request Authentication Nonce

Request a nonce for wallet signature authentication.

**Endpoint:** `POST /api/auth/nonce`

**Request Body:**
```json
{
  "address": "0x1234567890abcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nonce": "a1b2c3d4...",
    "message": "nyu-aptos.app wants you to sign in...",
    "address": "0x1234567890abcdef..."
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"address": "0x1234567890abcdef"}'
```

---

## Login with Wallet Signature

Authenticate using wallet signature and receive JWT tokens.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "address": "0x1234567890abcdef...",
  "message": "nyu-aptos.app wants you to sign in...",
  "signature": "0xabcdef01...",
  "publicKey": "0x9876543210..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "address": "0x1234567890abcdef...",
      "role": "member",
      "displayName": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x1234567890abcdef",
    "message": "...",
    "signature": "0x...",
    "publicKey": "0x..."
  }'
```

---

## Refresh Access Token

Obtain a new access token using a refresh token.

**Endpoint:** `POST /api/auth/refresh`

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

---

## Get Current User

Get authenticated user's information.

**Endpoint:** `GET /api/auth/me`

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
      "address": "0x1234567890abcdef...",
      "role": "member",
      "displayName": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-11-07T10:00:00.000Z"
    }
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

# Invoice Upload Endpoints

## Upload Invoice to IPFS

Upload an invoice file to IPFS and store hash on blockchain.

**Endpoint:** `POST /api/ipfs/upload`

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
- `file`: Binary file (PDF, PNG, JPG, DOC, DOCX)

**Response:**
```json
{
  "success": true,
  "data": {
    "ipfsHash": "QmXyz123...",
    "sha256Hash": "abc123def456...",
    "fileSize": 102400,
    "mimeType": "application/pdf",
    "fileName": "invoice.pdf",
    "gatewayUrl": "https://ipfs.io/ipfs/QmXyz123..."
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/ipfs/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@invoice.pdf"
```

---

## Get Invoice Metadata

Retrieve invoice metadata and IPFS hash.

**Endpoint:** `GET /api/ipfs/invoice/:requestId`

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": 1,
    "ipfsHash": "QmXyz123...",
    "sha256Hash": "abc123def456...",
    "fileSize": 102400,
    "mimeType": "application/pdf",
    "fileName": "invoice.pdf",
    "uploadedAt": "2024-11-07T12:00:00.000Z"
  }
}
```

---

# Treasury Endpoints

## Get Treasury Balance

Get the current vault balance from the blockchain.

**Endpoint:** `GET /api/treasury/balance`

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": "100000000000",
    "balanceFormatted": "1000.00",
    "coinType": "0x1::aptos_coin::AptosCoin",
    "timestamp": "2024-11-07T12:00:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3001/api/treasury/balance
```

---

## Get Treasury Transactions

Get deposit transaction history with pagination.

**Endpoint:** `GET /api/treasury/transactions`

**Query Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 20)
- `sort` (string, optional) - Sort order: asc or desc (default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "source": "SPONSOR",
        "amount": "50000000000",
        "total_balance": "100000000000",
        "transaction_hash": "0xabc123...",
        "version": "12345",
        "block_height": "10000",
        "timestamp": "2024-11-07T12:00:00.000Z",
        "amountFormatted": "500.00",
        "totalBalanceFormatted": "1000.00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

**cURL Example:**
```bash
curl "http://localhost:3001/api/treasury/transactions?page=1&limit=10"
```

---

## Get Treasury Statistics

Get aggregate treasury statistics.

**Endpoint:** `GET /api/treasury/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "deposits": {
      "sponsorTotal": "300000000000",
      "merchTotal": "100000000000",
      "totalDeposits": "400000000000",
      "depositCount": 25,
      "sponsorTotalFormatted": "3000.00",
      "merchTotalFormatted": "1000.00",
      "totalDepositsFormatted": "4000.00"
    },
    "reimbursements": {
      "totalRequests": 10,
      "paidRequests": 5,
      "pendingRequests": 5,
      "totalPaid": "50000000000",
      "totalPending": "25000000000",
      "totalPaidFormatted": "500.00",
      "totalPendingFormatted": "250.00"
    }
  }
}
```

---

## Get Reimbursement Requests

Get all reimbursement requests with pagination.

**Endpoint:** `GET /api/treasury/reimbursements`

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `sort` (string, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": 1,
        "payer": "0x123...",
        "payee": "0x123...",
        "amount": "10000000000",
        "invoice_uri": "https://ipfs.io/ipfs/Qm...",
        "invoice_hash": "0xabc...",
        "created_ts": "1699000000",
        "approved_advisor": true,
        "approved_president": true,
        "approved_vice": false,
        "paid_out": false,
        "payer_name": "John Doe",
        "payee_name": "John Doe",
        "amountFormatted": "100.00"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

---

## Get Reimbursement Details

Get detailed information about a specific reimbursement request.

**Endpoint:** `GET /api/treasury/reimbursements/:id`

**Path Parameters:**
- `id` (number) - Reimbursement request ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "payer": "0x123...",
    "payee": "0x123...",
    "amount": "10000000000",
    "invoice_uri": "https://ipfs.io/ipfs/Qm...",
    "invoice_hash": "0xabc...",
    "created_ts": "1699000000",
    "approved_advisor": true,
    "approved_president": true,
    "approved_vice": false,
    "paid_out": false,
    "payer_name": "John Doe",
    "payee_name": "John Doe",
    "amountFormatted": "100.00",
    "ipfs_hash": "Qm...",
    "file_name": "invoice.pdf",
    "file_size": 102400,
    "mime_type": "application/pdf",
    "approvals": [
      {
        "approver": "0x456...",
        "role": "ADVISOR",
        "timestamp": "2024-11-07T12:00:00.000Z",
        "approver_name": "Jane Smith"
      }
    ]
  }
}
```

---

## Submit Reimbursement

Record a reimbursement submission transaction.

**Endpoint:** `POST /api/treasury/reimbursements/submit`

**Request Body:**
```json
{
  "transactionHash": "0xabc123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0xabc123...",
    "version": "12345",
    "success": true
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/treasury/reimbursements/submit \
  -H "Content-Type: application/json" \
  -d '{"transactionHash": "0xabc123..."}'
```

---

## Approve Reimbursement

Record a reimbursement approval transaction.

**Endpoint:** `POST /api/treasury/reimbursements/:id/approve`

**Path Parameters:**
- `id` (number) - Reimbursement request ID

**Request Body:**
```json
{
  "transactionHash": "0xdef456..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0xdef456...",
    "version": "12346",
    "success": true
  }
}
```

---

# Governance Endpoints

## Get Elections

Get all elections with optional filtering.

**Endpoint:** `GET /api/governance/elections`

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `sort` (string, optional)
- `role` (string, optional) - Filter by role name
- `status` (string, optional) - Filter by status: "finalized" or "active"

**Response:**
```json
{
  "success": true,
  "data": {
    "elections": [
      {
        "election_id": 1,
        "role_name": "president",
        "start_ts": "1699000000",
        "end_ts": "1699100000",
        "finalized": true,
        "winner": "0x123...",
        "winner_name": "John Doe",
        "is_tie": false,
        "candidates": [
          {
            "candidate": "0x123...",
            "display_name": "John Doe",
            "timestamp": "2024-11-07T12:00:00.000Z"
          }
        ],
        "tallies": [
          {
            "candidate": "0x123...",
            "total_weight": "10",
            "vote_count": "5"
          }
        ]
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

**cURL Example:**
```bash
curl "http://localhost:3001/api/governance/elections?status=finalized"
```

---

## Get Election Details

Get detailed information about a specific election.

**Endpoint:** `GET /api/governance/elections/:electionId/:role`

**Path Parameters:**
- `electionId` (number) - Election ID
- `role` (string) - Role name

**Response:**
```json
{
  "success": true,
  "data": {
    "election_id": 1,
    "role_name": "president",
    "start_ts": "1699000000",
    "end_ts": "1699100000",
    "finalized": true,
    "winner": "0x123...",
    "winner_name": "John Doe",
    "is_tie": false,
    "candidates": [ /* ... */ ],
    "votes": [
      {
        "voter": "0x789...",
        "candidate": "0x123...",
        "weight": "2",
        "timestamp": "2024-11-07T12:00:00.000Z",
        "voter_name": "Alice",
        "candidate_name": "John Doe"
      }
    ],
    "tallies": [ /* ... */ ]
  }
}
```

---

## Cast Vote (Governance)

Record a governance vote transaction.

**Endpoint:** `POST /api/governance/vote`

**Request Body:**
```json
{
  "transactionHash": "0xghi789..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0xghi789...",
    "version": "12347",
    "success": true
  }
}
```

---

## Get Roles

Get current role assignments.

**Endpoint:** `GET /api/governance/roles`

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": {
      "admin": {
        "address": "0x1...",
        "displayName": "Admin User"
      },
      "advisor": {
        "address": "0x2...",
        "displayName": "Advisor Name"
      },
      "president": {
        "address": "0x3...",
        "displayName": "President Name"
      },
      "vice_president": {
        "address": "0x4...",
        "displayName": "VP Name"
      }
    }
  }
}
```

---

## Get E-Board Members

Get all e-board members.

**Endpoint:** `GET /api/governance/members`

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "address": "0x123...",
        "role": "advisor",
        "display_name": "Jane Smith",
        "email": "jane@example.com",
        "created_at": "2024-11-07T12:00:00.000Z"
      }
    ]
  }
}
```

---

## Get Governance Statistics

Get governance statistics and metrics.

**Endpoint:** `GET /api/governance/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "elections": {
      "total": 5,
      "finalized": 3,
      "active": 2,
      "rolesWithElections": 3
    },
    "votes": {
      "uniqueVoters": 15,
      "totalVotes": 45,
      "totalWeight": "90"
    },
    "recentElections": [ /* ... */ ]
  }
}
```

---

# Proposal Endpoints

## Get Proposals

Get all proposals with optional filtering.

**Endpoint:** `GET /api/proposals`

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `sort` (string, optional)
- `status` (number, optional) - Filter by status (0-4)
- `creator` (string, optional) - Filter by creator address

**Response:**
```json
{
  "success": true,
  "data": {
    "proposals": [
      {
        "proposal_id": 1,
        "creator": "0x123...",
        "creator_name": "John Doe",
        "title": "Increase Budget",
        "description": "Proposal to increase...",
        "start_ts": "1699000000",
        "end_ts": "1699100000",
        "status": 2,
        "statusName": "Passed",
        "yay_votes": "15",
        "nay_votes": "5",
        "finalized": true,
        "executed": false,
        "voteStats": {
          "totalVoters": 10,
          "yayVoters": 7,
          "nayVoters": 3
        }
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

**cURL Example:**
```bash
curl "http://localhost:3001/api/proposals?status=1&page=1"
```

---

## Get Proposal Details

Get detailed information about a specific proposal.

**Endpoint:** `GET /api/proposals/:id`

**Path Parameters:**
- `id` (number) - Proposal ID

**Response:**
```json
{
  "success": true,
  "data": {
    "proposal_id": 1,
    "creator": "0x123...",
    "creator_name": "John Doe",
    "title": "Increase Budget",
    "description": "Proposal to increase...",
    "start_ts": "1699000000",
    "end_ts": "1699100000",
    "status": 2,
    "statusName": "Passed",
    "yay_votes": "15",
    "nay_votes": "5",
    "finalized": true,
    "executed": false,
    "votes": [
      {
        "voter": "0x456...",
        "voter_name": "Alice",
        "vote": true,
        "weight": "2",
        "timestamp": "2024-11-07T12:00:00.000Z"
      }
    ],
    "voteStats": {
      "totalVoters": 10,
      "yayVoters": 7,
      "nayVoters": 3,
      "yayWeight": "15",
      "nayWeight": "5"
    }
  }
}
```

---

## Create Proposal

Record a proposal creation transaction.

**Endpoint:** `POST /api/proposals/create`

**Request Body:**
```json
{
  "transactionHash": "0xjkl012..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0xjkl012...",
    "version": "12348",
    "success": true
  }
}
```

---

## Vote on Proposal

Record a proposal vote transaction.

**Endpoint:** `POST /api/proposals/:id/vote`

**Path Parameters:**
- `id` (number) - Proposal ID

**Request Body:**
```json
{
  "transactionHash": "0xmno345..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0xmno345...",
    "version": "12349",
    "success": true
  }
}
```

---

## Get Active Proposals

Get currently active proposals (voting open).

**Endpoint:** `GET /api/proposals/status/active`

**Response:**
```json
{
  "success": true,
  "data": {
    "proposals": [ /* array of active proposals */ ],
    "count": 3
  }
}
```

---

## Get Proposal Statistics

Get proposal statistics and metrics.

**Endpoint:** `GET /api/proposals/stats/overview`

**Response:**
```json
{
  "success": true,
  "data": {
    "proposals": {
      "total": 20,
      "active": 3,
      "passed": 10,
      "rejected": 5,
      "executed": 8
    },
    "votes": {
      "uniqueVoters": 25,
      "totalVotes": 150,
      "totalYay": 90,
      "totalNay": 60
    },
    "recentProposals": [ /* ... */ ]
  }
}
```

---

# System Endpoints

## Health Check

Check API and database health.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-07T12:00:00.000Z",
  "environment": "development",
  "database": "connected",
  "network": {
    "network": "testnet",
    "nodeUrl": "https://fullnode.testnet.aptoslabs.com/v1",
    "moduleAddress": "0x1",
    "coinType": "0x1::aptos_coin::AptosCoin"
  },
  "version": "1.0.0"
}
```

---

## Root Endpoint

Get API information and available endpoints.

**Endpoint:** `GET /`

**Response:**
```json
{
  "name": "NYU Aptos Builder Camp Backend",
  "version": "1.0.0",
  "description": "Backend API for governance and treasury management platform",
  "endpoints": { /* object with all endpoint paths */ }
}
```

---

# Error Codes

## HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Common Errors

### Validation Error
```json
{
  "error": "Validation error",
  "details": [
    "Invalid Aptos address format"
  ]
}
```

### Not Found
```json
{
  "error": "Reimbursement request not found"
}
```

### Database Error
```json
{
  "error": "Failed to fetch treasury balance",
  "message": "Database connection lost"
}
```

---

# Rate Limiting

Not currently implemented. Recommended for production:
- 100 requests per minute per IP
- 1000 requests per hour per API key

---

# Pagination

All list endpoints support pagination:

**Request:**
```
GET /api/treasury/reimbursements?page=2&limit=10
```

**Response includes pagination info:**
```json
{
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

# WebSocket Real-Time Updates

The backend provides real-time event streaming via Socket.IO for instant notifications of blockchain events.

## Connection

**Endpoint:** `ws://localhost:3001` (development) or `wss://your-domain.com` (production)

**Client Library:**
```bash
npm install socket.io-client
```

**Basic Connection:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-access-token' // Optional
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});
```

## Available Channels

Subscribe to these channels for real-time updates:

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
| `proposals:finalized` | Proposal finalization |

## Subscribing to Events

```javascript
// Subscribe to channels
socket.emit('subscribe', [
  'treasury:deposit',
  'proposals:vote',
  'reimbursements:new'
]);

// Listen for subscription confirmation
socket.on('subscribed', (data) => {
  console.log('Subscribed to:', data.channels);
});
```

## Event Examples

### Treasury Deposit Event
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

### Proposal Vote Event
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

## Health Check and Metrics

Get WebSocket metrics:

**Endpoint:** `GET /api/websocket/metrics`

**Response:**
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

## Full Documentation

For comprehensive WebSocket documentation including all event payloads, error handling, and client examples, see:
- **[WEBSOCKET_API.md](../docs/WEBSOCKET_API.md)** - Complete API reference
- **[WEBSOCKET_README.md](../docs/WEBSOCKET_README.md)** - Implementation guide
- **[WEBSOCKET_CLIENT_EXAMPLES.md](../docs/WEBSOCKET_CLIENT_EXAMPLES.md)** - Client code examples

---

# Examples

## Complete Flow: Submit Reimbursement

1. **Upload invoice to IPFS** (implement endpoint)
2. **Build transaction with Aptos SDK** (frontend)
3. **Sign and submit to blockchain** (frontend)
4. **Notify backend:**
```bash
curl -X POST http://localhost:3001/api/treasury/reimbursements/submit \
  -H "Content-Type: application/json" \
  -d '{"transactionHash": "0x..."}'
```
5. **Check status:**
```bash
curl http://localhost:3001/api/treasury/reimbursements/1
```

## Complete Flow: Vote on Proposal

1. **Get active proposals:**
```bash
curl http://localhost:3001/api/proposals/status/active
```
2. **Build vote transaction** (frontend)
3. **Submit vote:**
```bash
curl -X POST http://localhost:3001/api/proposals/1/vote \
  -H "Content-Type: application/json" \
  -d '{"transactionHash": "0x..."}'
```
4. **Check updated proposal:**
```bash
curl http://localhost:3001/api/proposals/1
```

---

# Postman Collection

Import this collection for testing:
```json
{
  "info": {
    "name": "NYU Aptos Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Treasury",
      "item": [
        {
          "name": "Get Balance",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/treasury/balance"
          }
        }
      ]
    }
  ]
}
```

Set variable: `base_url = http://localhost:3001`
