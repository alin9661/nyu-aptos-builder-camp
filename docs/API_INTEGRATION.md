# Frontend API Integration Documentation

This document describes the complete API integration between the Next.js frontend and the backend API.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Architecture](#architecture)
4. [API Client](#api-client)
5. [React Hooks](#react-hooks)
6. [Components](#components)
7. [Wallet Integration](#wallet-integration)
8. [Usage Examples](#usage-examples)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

## Overview

The frontend now integrates with the backend API to fetch real blockchain data instead of using mock data. The integration includes:

- Complete API client library
- React hooks for data fetching
- Reusable UI components
- Aptos wallet integration
- Loading and error states
- Real-time data refresh

## Setup

### 1. Environment Configuration

Create a `.env.local` file in the frontend directory:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Aptos Network Configuration
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1

# Module Addresses (replace with your deployed addresses)
NEXT_PUBLIC_MODULE_ADDRESS=0x1
```

### 2. Start the Backend API

Ensure the backend API is running on port 3001:

```bash
cd backend
npm run dev
```

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Architecture

### Directory Structure

```
frontend/
├── lib/
│   ├── api/
│   │   ├── client.ts          # Base API client
│   │   ├── treasury.ts        # Treasury API calls
│   │   ├── governance.ts      # Governance API calls
│   │   ├── proposals.ts       # Proposals API calls
│   │   └── auth.ts            # Auth & health checks
│   ├── types/
│   │   └── api.ts             # TypeScript type definitions
│   └── wallet/
│       └── AptosWalletProvider.tsx  # Wallet context
├── hooks/
│   ├── useTreasury.ts         # Treasury data hooks
│   ├── useGovernance.ts       # Governance data hooks
│   ├── useProposals.ts        # Proposals data hooks
│   └── useAuth.ts             # Auth hooks
├── components/
│   ├── TreasuryBalance.tsx    # Treasury balance card
│   ├── ReimbursementsList.tsx # Reimbursements table
│   ├── ElectionsList.tsx      # Elections table
│   ├── ProposalsList.tsx      # Proposals table
│   ├── DashboardStats.tsx     # Stats cards
│   └── WalletButton.tsx       # Wallet connect button
└── app/
    ├── layout.tsx             # Root layout with wallet provider
    └── dashboard/
        └── page.tsx           # Main dashboard page
```

## API Client

### Base Client (`lib/api/client.ts`)

The base API client provides:

- Automatic request/response handling
- Query parameter serialization
- Error handling with custom `ApiError` class
- Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH)

```typescript
import { apiClient } from '@/lib/api/client';

// GET request with query params
const response = await apiClient.get('/api/treasury/balance', {
  params: { page: 1, limit: 10 }
});

// POST request with body
const response = await apiClient.post('/api/proposals/create', {
  transactionHash: '0x123...'
});
```

### API Modules

Each domain has its own API module:

- **Treasury** (`lib/api/treasury.ts`): Balance, transactions, reimbursements
- **Governance** (`lib/api/governance.ts`): Elections, roles, members
- **Proposals** (`lib/api/proposals.ts`): Proposals, voting, statistics
- **Auth** (`lib/api/auth.ts`): Health checks, API info

## React Hooks

All hooks follow the same pattern and return:

```typescript
{
  data: T | null;           // The fetched data
  loading: boolean;         // Loading state
  error: string | null;     // Error message if any
  refetch: () => void;      // Function to manually refetch data
}
```

### Treasury Hooks

```typescript
import {
  useTreasuryBalance,
  useTreasuryTransactions,
  useTreasuryStats,
  useReimbursements,
  useReimbursementDetails,
} from '@/hooks/useTreasury';

// Auto-refresh balance every 30 seconds
const { data, loading, error } = useTreasuryBalance(true, 30000);

// Fetch transactions with pagination
const { data } = useTreasuryTransactions({ page: 1, limit: 20 });

// Get specific reimbursement details
const { data } = useReimbursementDetails(requestId);
```

### Governance Hooks

```typescript
import {
  useElections,
  useElectionDetails,
  useRoles,
  useMembers,
  useGovernanceStats,
} from '@/hooks/useGovernance';

// Fetch elections with filters
const { data } = useElections({
  role: 'president',
  status: 'active',
  page: 1,
  limit: 10
});

// Get election details
const { data } = useElectionDetails(electionId, roleName);
```

### Proposals Hooks

```typescript
import {
  useProposals,
  useProposalDetails,
  useActiveProposals,
  useProposalStats,
} from '@/hooks/useProposals';

// Fetch all proposals
const { data } = useProposals({ page: 1, limit: 20 });

// Get active proposals with auto-refresh
const { data } = useActiveProposals(true, 30000);

// Get proposal statistics
const { data } = useProposalStats(true, 60000);
```

## Components

### TreasuryBalance

Displays the current treasury balance with auto-refresh.

```tsx
import { TreasuryBalance } from '@/components/TreasuryBalance';

<TreasuryBalance
  autoRefresh={true}
  refreshInterval={30000}
  showCoinType={true}
/>
```

### ReimbursementsList

Displays reimbursement requests with pagination.

```tsx
import { ReimbursementsList } from '@/components/ReimbursementsList';

<ReimbursementsList
  pageSize={10}
  showPagination={true}
/>
```

### ElectionsList

Displays elections with filtering options.

```tsx
import { ElectionsList } from '@/components/ElectionsList';

<ElectionsList
  pageSize={10}
  showPagination={true}
  filterRole="president"
  filterStatus="active"
/>
```

### ProposalsList

Displays proposals with vote counts.

```tsx
import { ProposalsList } from '@/components/ProposalsList';

<ProposalsList
  pageSize={10}
  showPagination={true}
  filterStatus={1}  // 1 = active
/>
```

### DashboardStats

Displays overview statistics for all modules.

```tsx
import { DashboardStats } from '@/components/DashboardStats';

<DashboardStats />
```

## Wallet Integration

### Wallet Provider

The `AptosWalletProvider` wraps the entire application (in `app/layout.tsx`) and provides wallet context to all components.

```tsx
import { AptosWalletProvider } from '@/lib/wallet/AptosWalletProvider';

<AptosWalletProvider>
  {children}
</AptosWalletProvider>
```

### useWallet Hook

Use the wallet context in any component:

```tsx
import { useWallet } from '@/lib/wallet/AptosWalletProvider';

function MyComponent() {
  const {
    connected,
    address,
    network,
    connect,
    disconnect,
    signAndSubmitTransaction
  } = useWallet();

  // Connect wallet
  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  // Submit transaction
  const handleTransaction = async () => {
    if (!connected) return;

    const transaction = {
      type: "entry_function_payload",
      function: "0x1::aptos_account::transfer",
      type_arguments: [],
      arguments: [recipientAddress, amount]
    };

    const response = await signAndSubmitTransaction(transaction);
    return response;
  };
}
```

### WalletButton Component

Pre-built wallet connect button:

```tsx
import { WalletButton } from '@/components/WalletButton';

<WalletButton />
```

## Usage Examples

### Dashboard Page

The main dashboard page (`app/dashboard/page.tsx`) demonstrates the complete integration:

```tsx
'use client';

import { DashboardStats } from '@/components/DashboardStats';
import { TreasuryBalance } from '@/components/TreasuryBalance';
import { ReimbursementsList } from '@/components/ReimbursementsList';
import { ElectionsList } from '@/components/ElectionsList';
import { ProposalsList } from '@/components/ProposalsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Stats Overview */}
      <DashboardStats />

      {/* Treasury Balance */}
      <TreasuryBalance autoRefresh={true} refreshInterval={30000} />

      {/* Data Tables */}
      <Tabs defaultValue="reimbursements">
        <TabsList>
          <TabsTrigger value="reimbursements">Reimbursements</TabsTrigger>
          <TabsTrigger value="elections">Elections</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
        </TabsList>
        <TabsContent value="reimbursements">
          <ReimbursementsList pageSize={10} showPagination={true} />
        </TabsContent>
        <TabsContent value="elections">
          <ElectionsList pageSize={10} showPagination={true} />
        </TabsContent>
        <TabsContent value="proposals">
          <ProposalsList pageSize={10} showPagination={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Custom Component with API Integration

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useProposals } from '@/hooks/useProposals';
import { createProposal } from '@/lib/api/proposals';
import { useWallet } from '@/lib/wallet/AptosWalletProvider';

function CreateProposalForm() {
  const { connected, signAndSubmitTransaction } = useWallet();
  const { refetch } = useProposals();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) return;

    setSubmitting(true);
    try {
      // 1. Create transaction payload
      const transaction = {
        type: "entry_function_payload",
        function: `${process.env.NEXT_PUBLIC_MODULE_ADDRESS}::proposals::create_proposal`,
        type_arguments: [],
        arguments: [title, description, startTime, endTime]
      };

      // 2. Sign and submit to blockchain
      const txResponse = await signAndSubmitTransaction(transaction);

      // 3. Notify backend
      await createProposal(txResponse.hash);

      // 4. Refresh data
      refetch();

      // 5. Reset form
      setTitle('');
      setDescription('');
      alert('Proposal created successfully!');
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Failed to create proposal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Error Handling

All API calls are wrapped in try-catch blocks, and errors are handled gracefully:

```tsx
function MyComponent() {
  const { data, loading, error, refetch } = useTreasuryBalance();

  if (loading) {
    return <Skeleton />;
  }

  if (error) {
    return (
      <div>
        <p className="text-destructive">{error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return <div>{/* Render data */}</div>;
}
```

### API Error Types

The `ApiError` class provides structured error information:

```typescript
try {
  const response = await getTreasuryBalance();
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Status:', error.statusCode);
    console.error('Message:', error.message);
    console.error('Response:', error.response);
  }
}
```

## Best Practices

### 1. Use Auto-Refresh for Critical Data

```tsx
// Balance should auto-refresh every 30 seconds
const { data } = useTreasuryBalance(true, 30000);

// Active proposals should refresh every 30 seconds
const { data } = useActiveProposals(true, 30000);

// Stats can refresh less frequently (every minute)
const { data } = useTreasuryStats(true, 60000);
```

### 2. Handle Loading States

Always show loading indicators while fetching data:

```tsx
if (loading && !data) {
  return <Skeleton className="h-64 w-full" />;
}
```

### 3. Implement Error Retry

Allow users to retry failed requests:

```tsx
if (error) {
  return (
    <div>
      <p className="text-destructive">{error}</p>
      <button onClick={refetch}>Try again</button>
    </div>
  );
}
```

### 4. Use Pagination for Large Datasets

```tsx
const [page, setPage] = useState(1);
const { data } = useProposals({ page, limit: 20 });
```

### 5. Validate Wallet Connection

Always check wallet connection before submitting transactions:

```tsx
const { connected } = useWallet();

if (!connected) {
  return <p>Please connect your wallet</p>;
}
```

### 6. Type Safety

Always use TypeScript types from `lib/types/api.ts`:

```tsx
import type { Proposal, ProposalStats } from '@/lib/types/api';

const { data } = useProposals();
const proposals: Proposal[] = data?.proposals || [];
```

## API Endpoints Reference

### Treasury
- `GET /api/treasury/balance` - Get current vault balance
- `GET /api/treasury/transactions` - Get transaction history
- `GET /api/treasury/stats` - Get treasury statistics
- `GET /api/treasury/reimbursements` - Get all reimbursement requests
- `GET /api/treasury/reimbursements/:id` - Get reimbursement details
- `POST /api/treasury/reimbursements/submit` - Submit new reimbursement
- `POST /api/treasury/reimbursements/:id/approve` - Approve reimbursement

### Governance
- `GET /api/governance/elections` - Get all elections
- `GET /api/governance/elections/:id/:role` - Get election details
- `POST /api/governance/vote` - Cast vote in election
- `GET /api/governance/roles` - Get current role assignments
- `GET /api/governance/members` - Get e-board members
- `GET /api/governance/stats` - Get governance statistics

### Proposals
- `GET /api/proposals` - Get all proposals
- `GET /api/proposals/:id` - Get proposal details
- `POST /api/proposals/create` - Create new proposal
- `POST /api/proposals/:id/vote` - Vote on proposal
- `GET /api/proposals/status/active` - Get active proposals
- `GET /api/proposals/stats/overview` - Get proposal statistics

### Health
- `GET /health` - API health check
- `GET /` - API information

## Troubleshooting

### Backend Not Connected

If you see "Network error: Unable to connect to API":
1. Verify backend is running on port 3001
2. Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. Verify CORS settings in backend allow `http://localhost:3000`

### Wallet Not Connecting

If wallet connection fails:
1. Ensure Petra wallet extension is installed
2. Check that you're on the correct network (testnet/mainnet)
3. Try disconnecting and reconnecting the wallet

### Data Not Loading

If components show loading state indefinitely:
1. Check browser console for API errors
2. Verify backend API endpoints are responding
3. Check network tab in browser DevTools
4. Ensure database is properly seeded with data

### Type Errors

If you encounter TypeScript errors:
1. Ensure all types are imported from `lib/types/api.ts`
2. Run `npm run build` to check for type errors
3. Verify API responses match the expected types

## Next Steps

1. **Production Deployment**: Update environment variables for production
2. **Wallet Adapter**: Consider using `@aptos-labs/wallet-adapter-react` for multi-wallet support
3. **Caching**: Implement React Query or SWR for better caching
4. **Optimistic Updates**: Add optimistic UI updates for transactions
5. **WebSocket**: Add real-time updates via WebSocket connection
6. **Analytics**: Track user interactions and API performance
