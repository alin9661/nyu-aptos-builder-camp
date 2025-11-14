# Petra Wallet Testing Guide - Testnet

## Quick Start: Test Petra Without Backend

Good news! **Petra wallet connection and transactions work WITHOUT the backend server.** The backend is only needed for the wallet-based authentication feature.

### Option 1: Test Petra Wallet Connection (No Backend Required) ✅

#### 1. Setup Petra Wallet
1. Install [Petra Wallet](https://petra.app/) browser extension
2. Create or import a wallet
3. Switch to Testnet:
   - Click Petra extension → Settings (gear icon) → Network → Testnet
4. Get test tokens:
   - Click "Faucet" button in Petra
   - Request test APT (requires Google/GitHub auth)

#### 2. Test Wallet Connection
1. Navigate to **http://localhost:3000**
2. Look for the "Connect Wallet" button in the header
3. Click "Connect Wallet"
4. Select "Petra" from the wallet list
5. Approve the connection in the Petra popup

**Expected Result:**
- ✅ Wallet address displays in the UI
- ✅ Network shows "testnet"
- ✅ Chain ID shows "2"

#### 3. Test Transactions on Testnet
1. Navigate to **Treasury** or **Governance** page
2. Try submitting a transaction (like creating a proposal)
3. Petra will prompt for approval
4. Review and approve the transaction
5. Check transaction on [Aptos Explorer](https://explorer.aptoslabs.com/?network=testnet)

**Example Transaction Flow:**
```
User Action → Petra Approval → Testnet Submission → Transaction Confirmed
```

### Option 2: Full Backend Setup (For Wallet-Based Authentication)

The `/auth/wallet` page you encountered requires the backend for wallet-based login. This is **optional** and not required for basic wallet operations.

#### Prerequisites
- PostgreSQL 14+
- Node.js 18+

#### Setup Steps

##### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Verify Installation:**
```bash
psql --version
pg_isready
```

##### 2. Create Database

```bash
# Connect as postgres user
psql postgres

# In psql prompt:
CREATE DATABASE nyu_aptos;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE nyu_aptos TO postgres;
\q
```

##### 3. Initialize Database Schema

```bash
cd /Users/aaronlin/Downloads/Projects/NYUxAptos/backend

# Run migrations (if available)
# Check backend/database/migrations/ directory
psql -U postgres -d nyu_aptos -f database/schema.sql
```

##### 4. Start Backend Server

```bash
cd /Users/aaronlin/Downloads/Projects/NYUxAptos/backend
npm install
npm run dev
```

**Expected Output:**
```
Server listening on port 3001
Database connected successfully
```

##### 5. Test Wallet Authentication

Now you can use the wallet-based login at:
**http://localhost:3000/auth/wallet**

## Current Application Status

### ✅ Working (No Backend Required)
- Petra wallet connection
- Transaction signing
- Testnet operations
- Wallet balance display
- Multi-wallet support (Petra, Martian, Pontem, Nightly)

### ⏳ Requires Backend
- Wallet-based authentication (`/auth/wallet`)
- User session management
- Backend API calls

### ✅ Alternative Authentication (Working)
Your app also has **Auth0 integration** which should work independently:
- Navigate to **http://localhost:3000/auth**
- Sign in with Google (via Auth0)
- This doesn't require the backend PostgreSQL setup

## Troubleshooting

### "Network error: Unable to connect to API"

This error appears when:
1. **You're on `/auth/wallet` page** - This requires the backend
   - **Solution:** Use `/auth` instead (Auth0) or set up PostgreSQL
   - **Or:** Just use the "Connect Wallet" button in the header (no backend needed)

2. **Backend is not running** - Check if server is on port 3001
   ```bash
   lsof -ti:3001
   ```

3. **Database not configured** - Follow PostgreSQL setup above

### Petra Wallet Not Showing Up

1. **Check extension is installed**
   - Visit [petra.app](https://petra.app/)
   - Click "Download" and install for your browser

2. **Refresh the page**
   - The wallet adapter auto-detects installed wallets
   - Try refreshing http://localhost:3000

3. **Check browser console**
   - Press F12 → Console tab
   - Look for wallet adapter errors

### Wrong Network

**Symptom:** Petra shows "mainnet" instead of "testnet"

**Solution:**
1. Open Petra extension
2. Click Settings (gear icon)
3. Select "Network"
4. Choose "Testnet"
5. Reconnect wallet in the app

### Transactions Failing

1. **Check you have testnet APT**
   - Open Petra → Click "Faucet" → Request tokens

2. **Verify network**
   - Wallet shows "testnet"
   - Chain ID is "2"

3. **Check transaction details**
   - Review in Petra before approving
   - Check browser console for errors

4. **View on Explorer**
   - Visit [Aptos Explorer](https://explorer.aptoslabs.com/?network=testnet)
   - Search for your wallet address
   - Check transaction status

## Testing Checklist

### Basic Wallet Connection ✅
- [ ] Install Petra extension
- [ ] Switch to testnet
- [ ] Get test tokens from faucet
- [ ] Navigate to http://localhost:3000
- [ ] Click "Connect Wallet"
- [ ] Select Petra
- [ ] Verify connection shows testnet

### Transaction Testing ✅
- [ ] Navigate to Treasury/Governance page
- [ ] Initiate a transaction
- [ ] Review in Petra popup
- [ ] Approve transaction
- [ ] Wait for confirmation
- [ ] Verify on Aptos Explorer

### Optional: Wallet Authentication
- [ ] Install PostgreSQL
- [ ] Create database
- [ ] Start backend server
- [ ] Test `/auth/wallet` page

## Quick Reference

| Feature | Requires Backend | Status |
|---------|-----------------|--------|
| Connect Petra Wallet | ❌ No | ✅ Working |
| Sign Transactions | ❌ No | ✅ Working |
| Testnet Operations | ❌ No | ✅ Working |
| Wallet Balance | ❌ No | ✅ Working |
| Auth0 Login | ❌ No | ✅ Working |
| Wallet-based Auth | ✅ Yes | ⏳ Needs PostgreSQL |
| Backend API | ✅ Yes | ⏳ Needs PostgreSQL |

## Recommended Testing Path

**For Petra Wallet & Testnet Testing:**
1. Skip backend setup for now
2. Use "Connect Wallet" button in header (not `/auth/wallet`)
3. Test transactions on Treasury/Governance pages
4. Verify on Aptos Explorer

**For Full Backend Features:**
1. Install PostgreSQL (see Option 2 above)
2. Set up database
3. Start backend server
4. Test wallet authentication

## Support

- **Petra Wallet Issues:** [Petra Discord](https://discord.gg/petrawallet)
- **Aptos Testnet:** [Aptos Discord](https://discord.gg/aptoslabs)
- **Faucet:** https://www.aptosfaucet.com/

---

**Bottom Line:** You can test Petra wallet connection and make testnet transactions **right now** at http://localhost:3000 - no database setup required! Just use the "Connect Wallet" button instead of the `/auth/wallet` page.
