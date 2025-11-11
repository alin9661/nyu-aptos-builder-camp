# Frontend-Backend Integration Quick Start Guide

This guide will help you get the integrated frontend and backend running quickly.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Backend API configured and seeded with data
- Petra wallet browser extension installed (for wallet features)

## Step 1: Configure Environment Variables

### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aptos_governance
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aptos_governance
DB_USER=your_user
DB_PASSWORD=your_password

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Aptos Network
APTOS_NETWORK=testnet
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1

# Module Addresses (replace with your deployed contract addresses)
TREASURY_MODULE=0x1::treasury
GOVERNANCE_MODULE=0x1::governance
PROPOSALS_MODULE=0x1::proposals
```

### Frontend (.env.local)

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Aptos Network
NEXT_PUBLIC_APTOS_NETWORK=testnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1

# Module Address
NEXT_PUBLIC_MODULE_ADDRESS=0x1
```

## Step 2: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
# or if using pnpm
pnpm install
```

## Step 3: Setup Database

```bash
cd backend

# Create database schema
npm run db:setup

# Seed with sample data
npm run db:seed
```

## Step 4: Start the Backend

```bash
cd backend
npm run dev
```

The backend should now be running on `http://localhost:3001`.

Verify it's working:
```bash
curl http://localhost:3001/health
```

You should see a response like:
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T...",
  "environment": "development",
  "database": "connected",
  "network": {
    "network": "testnet",
    "chainId": "2",
    "nodeUrl": "https://fullnode.testnet.aptoslabs.com/v1"
  },
  "version": "1.0.0"
}
```

## Step 5: Start the Frontend

```bash
cd frontend
npm run dev
# or if using pnpm
pnpm dev
```

The frontend should now be running on `http://localhost:3000`.

## Step 6: Access the Dashboard

1. Open your browser to `http://localhost:3000/dashboard`
2. You should see the governance dashboard with real data from the backend
3. Click "Connect Wallet" to connect your Petra wallet

## What You Should See

The dashboard should display:

1. **Stats Cards** showing:
   - Treasury Balance (from blockchain)
   - Reimbursement Requests count
   - Proposals count
   - Elections count

2. **Charts Section** (existing interactive charts)

3. **Treasury Balance Card** with:
   - Current vault balance
   - Auto-refresh every 30 seconds

4. **Tabbed Data Tables** showing:
   - Reimbursements with pagination
   - Elections with candidates and results
   - Proposals with voting status

## Verify Integration

### Test 1: Check API Connection

Open browser DevTools (F12) → Network tab:
- You should see requests to `http://localhost:3001/api/*`
- All requests should return status 200 OK
- Response data should match the UI

### Test 2: Check Real-Time Updates

1. The Treasury Balance card should show "Last updated: [timestamp]"
2. Wait 30 seconds
3. The timestamp should update automatically

### Test 3: Test Pagination

1. Go to the Reimbursements tab
2. Click "Next" to navigate pages
3. Data should update without page reload

### Test 4: Test Wallet Connection

1. Click "Connect Wallet" button
2. Petra wallet should prompt for connection
3. After connecting, button should show your address

## Troubleshooting

### Backend Won't Start

**Error: Database connection failed**
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Try: `psql -h localhost -U your_user -d aptos_governance`

**Error: Port 3001 already in use**
- Kill existing process: `lsof -ti:3001 | xargs kill -9`
- Or change PORT in `backend/.env`

### Frontend Shows "Network Error"

**Symptom: All components show error message**
- Verify backend is running: `curl http://localhost:3001/health`
- Check `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local`
- Check CORS_ORIGIN in `backend/.env` includes `http://localhost:3000`

**Symptom: CORS error in browser console**
- Update `CORS_ORIGIN` in `backend/.env` to `http://localhost:3000`
- Restart backend server

### Data Not Loading

**Symptom: Components show "No data found"**
- Verify database has data: Run seed script again
- Check backend logs for errors
- Check browser Network tab for failed requests

**Symptom: Loading forever**
- Check browser console for errors
- Verify API endpoints are returning data
- Try refreshing the page

### Wallet Won't Connect

**Error: Petra wallet not found**
- Install Petra wallet extension
- Refresh the page after installation

**Error: Wrong network**
- Open Petra wallet
- Switch to Testnet network
- Try connecting again

## Next Steps

Now that the integration is working:

1. **Explore the Components**
   - Check `frontend/components/` for all available components
   - Each component is documented with TypeScript props

2. **Use the Hooks**
   - See `frontend/hooks/` for data fetching hooks
   - All hooks support auto-refresh and pagination

3. **Review the Documentation**
   - Read `frontend/API_INTEGRATION.md` for complete documentation
   - Check code examples and best practices

4. **Customize the Dashboard**
   - Edit `frontend/app/dashboard/page.tsx` to modify layout
   - Add your own components using the provided hooks

5. **Deploy to Production**
   - Update environment variables for production
   - Set up proper database backups
   - Configure production CORS settings

## Available Scripts

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:setup     # Initialize database
npm run db:seed      # Seed with sample data
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Project Structure

```
NYUxAptos/
├── backend/
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── config/          # Configuration
│   │   └── index.ts         # Server entry point
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── dashboard/       # Dashboard page
│   │   └── layout.tsx       # Root layout
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/
│   │   ├── api/            # API client library
│   │   ├── types/          # TypeScript types
│   │   └── wallet/         # Wallet integration
│   └── package.json
└── contracts/
    └── sources/            # Move smart contracts
```

## Getting Help

If you encounter issues:

1. Check the logs:
   - Backend: Terminal running `npm run dev`
   - Frontend: Browser console (F12)

2. Review documentation:
   - `frontend/API_INTEGRATION.md` - Complete API integration guide
   - Backend API docs at `http://localhost:3001/`

3. Test individual components:
   - Each component can be tested in isolation
   - See component files for usage examples

4. Verify data flow:
   - Backend → Check database has data
   - API → Test endpoints with curl or Postman
   - Frontend → Check Network tab in DevTools

## Success Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Database connected and seeded
- [ ] Health check endpoint returns OK
- [ ] Dashboard displays real data
- [ ] Stats cards show correct numbers
- [ ] Tables show data with pagination
- [ ] Auto-refresh works (check timestamps)
- [ ] Wallet connects successfully
- [ ] No errors in browser console
- [ ] No errors in backend logs

Congratulations! Your frontend is now fully integrated with the backend API.
