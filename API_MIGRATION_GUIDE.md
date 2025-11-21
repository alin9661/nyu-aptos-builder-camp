# Backend to Vercel Serverless Migration Guide

## Overview

This guide explains how to migrate the remaining Express.js backend API routes to Next.js serverless functions on Vercel.

## ✅ Completed Infrastructure

The following infrastructure is **already set up** and ready to use:

1. **Database Client** - `frontend/lib/server/db/client.ts`
   - Vercel Postgres integration
   - Query helpers with error handling
   - Transaction support

2. **Authentication Utilities** - `frontend/lib/server/middleware/auth.ts` & `frontend/lib/server/utils/jwt.ts`
   - JWT token generation and verification
   - User authentication helpers
   - Role-based authorization
   - Wallet ownership verification

3. **Frontend API Client** - `frontend/lib/api/client.ts`
   - Updated to use `/api` instead of external backend
   - All existing frontend code will work with new API routes

4. **Deployment Configuration**
   - `vercel.json` - Configured for monorepo
   - `next.config.mjs` - Optimized for Vercel
   - `.vercelignore` - Excludes backend directory

## 📁 Directory Structure

```
frontend/
├── app/
│   └── api/
│       ├── health/
│       │   └── route.ts          # ✅ Example route (completed)
│       ├── auth/                  # 🔨 Needs migration (10 endpoints)
│       ├── treasury/              # 🔨 Needs migration (7 endpoints)
│       ├── governance/            # 🔨 Needs migration (6 endpoints)
│       ├── proposals/             # 🔨 Needs migration (6 endpoints)
│       ├── notifications/         # 🔨 Needs migration (9 endpoints)
│       ├── compliance/            # 🔨 Needs migration (10 endpoints)
│       └── events/                # 🔨 Needs migration (3 endpoints, polling only)
└── lib/
    └── server/
        ├── db/
        │   └── client.ts          # ✅ Database client (completed)
        ├── middleware/
        │   └── auth.ts            # ✅ Auth middleware (completed)
        ├── utils/
        │   └── jwt.ts             # ✅ JWT utilities (completed)
        ├── services/              # 🔨 Needs migration
        └── config/                # 🔨 Needs migration
```

## 🔄 Migration Pattern

### Express Route → Next.js API Route

**Before (Express):**
```typescript
// backend/src/routes/example.ts
import { Router } from 'express';
import { verifyAuth } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

router.get('/data', verifyAuth, async (req, res) => {
  try {
    const data = await query('SELECT * FROM table WHERE id = $1', [req.user.address]);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: 'Failed' });
  }
});

export default router;
```

**After (Next.js):**
```typescript
// frontend/app/api/data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/middleware/auth';
import { rawQuery } from '@/lib/server/db/client';

export async function GET(req: NextRequest) {
  // Authenticate user
  const user = await requireAuth(req);
  if (user instanceof NextResponse) return user; // Auth failed

  try {
    const data = await rawQuery('SELECT * FROM table WHERE id = $1', [user.address]);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed' },
      { status: 500 }
    );
  }
}
```

### Key Differences

1. **No Router** - Each route is a separate file with HTTP method exports
2. **NextRequest/NextResponse** - Instead of Express req/res
3. **Async Functions** - Always async, export named functions (GET, POST, etc.)
4. **Auth Pattern** - Call `requireAuth()` instead of middleware
5. **Return Responses** - Always return `NextResponse.json()`

## 📝 Step-by-Step Migration

### Step 1: Create Route Directory

```bash
mkdir -p frontend/app/api/your-route
```

### Step 2: Create route.ts File

```typescript
// frontend/app/api/your-route/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ success: true, data: body });
}
```

### Step 3: Add Authentication (if needed)

```typescript
import { requireAuth, EBOARD_ROLES } from '@/lib/server/middleware/auth';

export async function GET(req: NextRequest) {
  // Require authentication
  const user = await requireAuth(req);
  if (user instanceof NextResponse) return user;

  // Optional: Require specific role
  const authorized = requireRole(user, EBOARD_ROLES);
  if (authorized !== true) return authorized;

  // Your logic here
  return NextResponse.json({ success: true, user });
}
```

### Step 4: Add Database Queries

```typescript
import { query, rawQuery } from '@/lib/server/db/client';

// Using template literals (recommended)
const users = await query<User>`SELECT * FROM users WHERE address = ${address}`;

// Using raw SQL with parameters
const data = await rawQuery('SELECT * FROM table WHERE id = $1', [id]);
```

### Step 5: Handle Errors

```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    if (!body.required_field) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      );
    }

    // Process request
    const result = await someOperation(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[API Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🎯 Priority Migration Order

Migrate routes in this order to get core functionality working first:

### Phase 1: Authentication (Highest Priority)
```
frontend/app/api/auth/
├── nonce/route.ts              # POST - Generate nonce
├── login/route.ts              # POST - Wallet login
├── sso-login/route.ts          # POST - Auth0 SSO
├── refresh/route.ts            # POST - Refresh token
├── verify/route.ts             # POST - Verify token
├── me/route.ts                 # GET - Current user
├── profile/route.ts            # PUT - Update profile
├── create-wallet/route.ts      # POST - Create wallet
├── wallet-info/route.ts        # GET - Wallet info
└── webhook/
    ├── create-wallet/route.ts  # POST - Auth0 webhook
    └── health/route.ts         # GET - Webhook health
```

**Source:** `backend/src/routes/auth.ts` (lines 1-500)

### Phase 2: Treasury Management
```
frontend/app/api/treasury/
├── balance/route.ts            # GET - Vault balance
├── transactions/route.ts       # GET - Transaction history
├── stats/route.ts              # GET - Treasury stats
└── reimbursements/
    ├── route.ts                # GET - All reimbursements
    ├── submit/route.ts         # POST - Submit request
    └── [id]/
        ├── route.ts            # GET - Get by ID
        └── approve/route.ts    # POST - Approve
```

**Source:** `backend/src/routes/treasury.ts`

### Phase 3: Governance
```
frontend/app/api/governance/
├── elections/
│   ├── route.ts                # GET - All elections
│   └── [electionId]/
│       └── [role]/route.ts     # GET - Election details
├── vote/route.ts               # POST - Record vote
├── roles/route.ts              # GET - Current roles
├── members/route.ts            # GET - E-board members
└── stats/route.ts              # GET - Governance stats
```

**Source:** `backend/src/routes/governance.ts`

### Phase 4: Proposals
```
frontend/app/api/proposals/
├── route.ts                    # GET - All proposals
├── create/route.ts             # POST - Create proposal
├── status/
│   └── active/route.ts         # GET - Active proposals
├── stats/
│   └── overview/route.ts       # GET - Proposal stats
└── [id]/
    ├── route.ts                # GET - Get by ID
    └── vote/route.ts           # POST - Vote on proposal
```

**Source:** `backend/src/routes/proposals.ts`

### Phase 5: Notifications
```
frontend/app/api/notifications/
├── route.ts                    # GET - All notifications
├── unread-count/route.ts       # GET - Unread count
├── read-all/route.ts           # PUT - Mark all read
├── preferences/route.ts        # GET/PUT - Preferences
├── test/route.ts               # POST - Test notification
├── categories/route.ts         # GET - Categories
└── [id]/
    ├── read/route.ts           # PUT - Mark as read
    └── route.ts                # DELETE - Delete notification
```

**Source:** `backend/src/routes/notifications.ts`

### Phase 6: Compliance
```
frontend/app/api/compliance/
├── consent/
│   ├── route.ts                # POST - Grant consent
│   ├── status/route.ts         # GET - Consent status
│   └── [type]/route.ts         # DELETE - Revoke consent
├── data/
│   ├── export/
│   │   ├── route.ts            # GET - Export data
│   │   └── json/route.ts       # GET - Export JSON
│   ├── delete/route.ts         # POST - Delete data (GDPR)
│   └── rectify/route.ts        # PUT - Update data
├── audit-trail/route.ts        # GET - Audit trail
├── info/route.ts               # GET - Compliance info
└── consent-types/route.ts      # GET - Consent types
```

**Source:** `backend/src/routes/compliance.ts`

### Phase 7: Events (Polling Only)
```
frontend/app/api/events/
├── poll/route.ts               # GET - Poll for events
├── metrics/route.ts            # GET - Event metrics
└── channels/route.ts           # GET - Available channels
```

**Source:** `backend/src/routes/events.ts` (⚠️ Remove SSE streaming endpoint)

## 🔧 Common Patterns

### Dynamic Route Parameters

```typescript
// frontend/app/api/users/[id]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  // Use userId...
}
```

### Request Body

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { field1, field2 } = body;
}
```

### Query Parameters

```typescript
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';
}
```

### Headers

```typescript
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  const userAgent = req.headers.get('user-agent');
}
```

## 🚫 What NOT to Migrate

### SSE Streaming (Server-Sent Events)
- **Route:** `GET /api/events/stream`
- **Reason:** Incompatible with Vercel's 10s timeout
- **Alternative:** Use polling endpoint (`/api/events/poll`) already in frontend

### Blockchain Indexer
- **Service:** `backend/src/services/indexer.ts`
- **Reason:** Long-running process (continuous polling)
- **Alternative:**
  - Deploy to Railway/Render as separate service
  - OR use Vercel Cron (limited to 1 execution/minute)

## 🔑 Environment Variables

Set these in Vercel Dashboard (Settings → Environment Variables):

```bash
# Database
DATABASE_URL=postgresql://...                    # Vercel Postgres connection string

# JWT
JWT_SECRET=<32_char_random_string>
JWT_REFRESH_SECRET=<32_char_random_string>

# Aptos
APTOS_NETWORK=testnet
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
MODULE_ADDRESS=0x...

# Auth0 (if using SSO)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...

# Encryption
ENCRYPTION_KEY=<32_char_random_string>

# Webhooks
BACKEND_WEBHOOK_SECRET=<random_string>

# Vercel Blob (already configured)
BLOB_READ_WRITE_TOKEN=...

# Rate Limiting (Vercel KV)
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

## 🧪 Testing

### Local Development

```bash
# Start dev server
cd frontend
pnpm dev

# Test API route
curl http://localhost:3000/api/health
```

### Build Test

```bash
# Test production build
cd frontend
pnpm build

# Check for errors
# If successful, deploy to Vercel
```

## 📚 Additional Resources

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

## 🎉 Next Steps

1. Start with **Phase 1: Authentication** routes
2. Test each route locally before moving to next
3. Update services in `lib/server/services/` as needed
4. Deploy to Vercel preview environment for testing
5. Once all routes are migrated, deploy to production

## 💡 Tips

- Copy-paste the migration pattern - it's consistent across all routes
- Test database queries in isolation first
- Use console.log liberally during development
- Check Vercel deployment logs for serverless function errors
- Keep functions under 10s execution time
- Reuse utilities from `lib/server/` - don't duplicate code

---

**Status:** Infrastructure complete, ready for API route migration
**Estimated Time:** 2-3 hours for all routes (following this guide)
