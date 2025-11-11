# Installation Guide - Blockchain Integration

## Quick Start

Follow these steps to integrate real blockchain data into the Nexus frontend:

### 1. Install Dependencies

```bash
cd frontend
npm install @aptos-labs/ts-sdk
```

### 2. Update Environment Variables

Edit `/frontend/.env.local`:

```bash
# Aptos Network Configuration
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1

# Replace with your deployed contract address
NEXT_PUBLIC_MODULE_ADDRESS=0xCAFE

# Optional: Remove if not using backend API
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### 3. Deploy Contracts (If Not Already Deployed)

```bash
cd contracts

# Initialize (if needed)
aptos init

# Compile contracts
aptos move compile

# Deploy to testnet
aptos move publish --named-addresses nyu_aptos_builder_camp=<YOUR_ADDRESS>
```

### 4. Initialize Contract Resources

After deployment, initialize the modules:

```bash
# Initialize governance roles
aptos move run \
  --function-id '<YOUR_ADDRESS>::governance::init_roles' \
  --args address:<ADVISOR_ADDRESS> \
  address:<PRESIDENT_ADDRESS> \
  address:<VICE_ADDRESS> \
  'address:<MEMBER1>,<MEMBER2>'

# Initialize proposals store
aptos move run \
  --function-id '<YOUR_ADDRESS>::proposals::init_proposals'

# Initialize treasury vault
aptos move run \
  --function-id '<YOUR_ADDRESS>::treasury::init_vault' \
  --type-args '0x1::aptos_coin::AptosCoin'
```

### 5. Start Development Server

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000/dashboard` to see your blockchain data!

## Verification Steps

### Check Treasury Balance
1. Open browser console
2. Navigate to Dashboard
3. Verify treasury balance displays
4. Check that it matches on-chain balance

### Check Proposals
1. Create a test proposal on-chain
2. Refresh the dashboard
3. Verify proposal appears in list
4. Check vote counts are accurate

### Check Elections
1. Create a test election on-chain
2. Add candidates
3. Verify election appears
4. Check candidates list is correct

### Check Reimbursements
1. Submit a test reimbursement
2. Verify it appears in list
3. Check amount formatting
4. Test approval flow

## Common Issues

### Issue: "Module address not found"
**Solution**: Update `NEXT_PUBLIC_MODULE_ADDRESS` with your deployed contract address

### Issue: "Resource not found"
**Solution**: Initialize contract resources using the scripts above

### Issue: "Network error"
**Solution**: Check your internet connection and RPC endpoint

### Issue: "No data showing"
**Solution**: Create some test data on-chain first

## Testing with Test Data

### Create Test Proposal
```bash
aptos move run \
  --function-id '<YOUR_ADDRESS>::proposals::create_proposal' \
  --args \
    string:"Test Proposal" \
    string:"This is a test proposal" \
    u64:<START_TIMESTAMP> \
    u64:<END_TIMESTAMP>
```

### Submit Test Reimbursement
```bash
aptos move run \
  --function-id '<YOUR_ADDRESS>::treasury::submit_reimbursement' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args \
    u64:1000000000 \
    string:"ipfs://test-invoice" \
    'vector<u8>:[...]' \
    u64:<TIMESTAMP>
```

### Deposit Test Funds
```bash
aptos move run \
  --function-id '<YOUR_ADDRESS>::treasury::deposit_sponsor' \
  --type-args '0x1::aptos_coin::AptosCoin' \
  --args u64:10000000000
```

## Production Deployment

### 1. Deploy to Mainnet
```bash
# Switch to mainnet
aptos init --network mainnet

# Deploy contracts
aptos move publish --named-addresses nyu_aptos_builder_camp=<MAINNET_ADDRESS>
```

### 2. Update Environment
```bash
NEXT_PUBLIC_APTOS_NETWORK=mainnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
NEXT_PUBLIC_MODULE_ADDRESS=<MAINNET_ADDRESS>
```

### 3. Build and Deploy Frontend
```bash
cd frontend
npm run build
npm start
```

## Advanced Configuration

### Custom RPC Endpoint
For better performance, use a dedicated RPC:

```bash
NEXT_PUBLIC_APTOS_NODE_URL=https://your-custom-rpc.com/v1
```

### Indexer Integration
For large datasets, consider using the Aptos Indexer:

```typescript
// In aptos.ts, add indexer endpoint
const INDEXER_URL = 'https://api.mainnet.aptoslabs.com/v1/graphql';
```

### Caching Strategy
Add React Query for better performance:

```bash
npm install @tanstack/react-query
```

Then wrap your app in QueryClientProvider.

## Next Steps

1. Test all features thoroughly
2. Add error monitoring (e.g., Sentry)
3. Implement analytics tracking
4. Add wallet integration for transactions
5. Deploy to production

## Support

For issues or questions:
- Check the BLOCKCHAIN_INTEGRATION_SUMMARY.md
- Review contract source code in `/contracts/sources/`
- Check Aptos documentation: https://aptos.dev
- Review SDK docs: https://github.com/aptos-labs/aptos-ts-sdk

## Complete!

Your frontend now uses real blockchain data instead of mock data. All components and hooks work exactly as before, but now fetch live data from the Aptos blockchain.
