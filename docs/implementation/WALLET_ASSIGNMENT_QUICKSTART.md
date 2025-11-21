# Retroactive Wallet Assignment - Quick Start Guide

## Overview

This guide helps you quickly assign Aptos wallets to existing users who don't have one.

## Prerequisites

1. PostgreSQL database running with users table
2. Node.js 18+ installed
3. Environment variables configured in `.env`

## Quick Setup

### 1. Verify Your Setup

First, verify everything is configured correctly:

```bash
cd backend
npm run verify-setup
```

This will check:
- Environment variables are set
- Database connection works
- Database schema is correct
- Encryption is working
- Log directory exists and is writable
- Script files exist

**Fix any issues before proceeding!**

### 2. Run a Dry Run

Test the script without making any changes:

```bash
npm run assign-wallets -- --dry-run
```

This shows you:
- How many users will be processed
- Estimated time
- Any potential issues

### 3. Run the Script

If the dry run looks good, run the actual script:

```bash
npm run assign-wallets
```

The script will:
- Prompt for confirmation
- Process users in batches
- Show progress bar
- Generate detailed reports

## Common Use Cases

### Process Only SSO Users (Google, NYU SSO)

```bash
npm run assign-wallets -- --sso-only
```

### Process Specific Users

```bash
npm run assign-wallets -- --addresses=0xabc123,0xdef456
```

### Adjust Performance Settings

```bash
# Smaller batches with longer delay (safer)
npm run assign-wallets -- --batch-size=25 --delay=5000

# Larger batches with shorter delay (faster)
npm run assign-wallets -- --batch-size=100 --delay=1000
```

### Resume Interrupted Execution

If the script was interrupted:

```bash
npm run assign-wallets -- --resume
```

## What Happens During Execution?

1. **Wallet Generation**: Creates Ed25519 key pair for each user
2. **Encryption**: Encrypts private key with AES-256-GCM
3. **Database Update**: Stores public key and encrypted private key
4. **Funding**: Sends 1 APT to wallet on testnet (optional)
5. **Audit Logging**: Records every assignment

## Output Files

All files are in `backend/logs/`:

- `wallet-assignment-exec_[timestamp].log` - Detailed execution log
- `wallet-assignment-exec_[timestamp]-summary.json` - Summary report
- `wallet-assignment-errors-[timestamp].csv` - List of errors (if any)
- `wallet-assignment-audit.jsonl` - Audit trail

## Progress Monitoring

During execution, you'll see:

```
📦 Processing batch 1/3 (50 users)...

   [=============>           ] 33% (50/150)
   Success: 48 | Failed: 2
```

## After Completion

Check the summary:

```
==============================================
EXECUTION SUMMARY
==============================================

Total Time: 450.25s
Total Users: 150
Processed: 150
✅ Successful: 147
❌ Failed: 3
Success Rate: 98.00%
Avg Time/Wallet: 3001.67ms

==============================================
```

## Verify Results

Check database:

```sql
-- Count users with wallets
SELECT COUNT(*) FROM users WHERE wallet_generated = true;

-- View recently assigned wallets
SELECT address, wallet_public_key, wallet_created_at
FROM users
WHERE wallet_generated = true
ORDER BY wallet_created_at DESC
LIMIT 10;
```

## Troubleshooting

### Error: Database connection failed

Check your `.env` file:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nyu_aptos
DB_USER=postgres
DB_PASSWORD=your_password
```

### Error: WALLET_ENCRYPTION_SECRET not set

Generate and add to `.env`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:
```
WALLET_ENCRYPTION_SECRET=<generated_secret_here>
```

### Script is too slow

Increase batch size and reduce delay:
```bash
npm run assign-wallets -- --batch-size=100 --delay=1000
```

### Script was interrupted

Resume from last processed user:
```bash
npm run assign-wallets -- --resume
```

## Safety Features

- **Dry Run Mode**: Test without making changes
- **Confirmation Prompt**: Must confirm before execution
- **Idempotent**: Safe to run multiple times
- **State Persistence**: Can resume if interrupted
- **Comprehensive Logging**: Full audit trail
- **Graceful Error Handling**: Continues on individual failures

## Command Reference

```bash
# Verify setup
npm run verify-setup

# Dry run
npm run assign-wallets -- --dry-run

# Full execution
npm run assign-wallets

# Options
--dry-run              # Test mode
--batch-size=N         # Users per batch (default: 50)
--delay=N              # Delay in ms (default: 2000)
--sso-only             # Only Google/NYU SSO users
--resume               # Resume from interruption
--addresses=A,B,C      # Specific addresses only
```

## Complete Workflow Example

```bash
# 1. Verify setup
cd backend
npm run verify-setup

# 2. Dry run to see what will happen
npm run assign-wallets -- --dry-run

# 3. Run with SSO users first (smaller batch)
npm run assign-wallets -- --sso-only --batch-size=25

# 4. Run remaining users
npm run assign-wallets

# 5. Verify results
psql -d nyu_aptos -c "SELECT COUNT(*) FROM users WHERE wallet_generated = true;"
```

## Need More Help?

- **Comprehensive Docs**: See `docs/RETROACTIVE_WALLET_ASSIGNMENT.md`
- **Script Source**: `backend/src/scripts/assign-wallets-retroactive.ts`
- **Logs**: Check `backend/logs/` directory

## Best Practices

1. **Always start with verify-setup**: Catch issues early
2. **Always do a dry run first**: See what will happen
3. **Start with small batches**: Test with `--batch-size=5 --addresses=0xtest1,0xtest2`
4. **Monitor progress**: Watch for high failure rates
5. **Keep logs**: Archive for compliance and debugging
6. **Test wallets**: Verify a few can actually sign transactions
7. **Notify users**: Let them know they have new wallets

## Security Notes

- Private keys are encrypted with AES-256-GCM
- Never share `WALLET_ENCRYPTION_SECRET`
- Keep `.env` out of version control
- Archive logs securely (contain wallet addresses)
- Limit database access

---

**Ready to start?** Run `npm run verify-setup` first!
