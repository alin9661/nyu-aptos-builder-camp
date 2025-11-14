# Retroactive Wallet Assignment Documentation

## Overview

The Retroactive Wallet Assignment script is designed to assign Aptos wallets to existing users who don't currently have one. This is particularly useful after implementing a new wallet generation system or migrating users from an external wallet system to auto-generated wallets.

## Features

- **Batch Processing**: Process users in configurable batches to prevent system overload
- **Safety Mechanisms**: Dry-run mode, confirmation prompts, and state persistence
- **Automatic Retry**: Exponential backoff retry logic for transient failures
- **Progress Tracking**: Real-time progress bar and detailed logging
- **Resume Capability**: Resume interrupted executions from the last processed user
- **Comprehensive Logging**: Detailed logs, summary reports, and error CSV files
- **Audit Trail**: JSONL audit log for compliance and tracking
- **Wallet Funding**: Automatic funding of wallets on testnet (1 APT)
- **Priority Processing**: SSO users (Google, NYU SSO) are processed first

## Installation

The script is already part of the backend codebase. To use it, ensure you have:

1. Node.js 18+ installed
2. PostgreSQL database configured
3. Environment variables set (see `.env.example`)
4. Required dependencies installed:

```bash
cd backend
npm install
```

## Usage

### Command Line Interface

```bash
# Basic usage (will prompt for confirmation)
npm run assign-wallets

# Dry run (no changes made - recommended first run)
npm run assign-wallets -- --dry-run

# Process with custom batch size and delay
npm run assign-wallets -- --batch-size=100 --delay=5000

# Process only SSO users (Google and NYU SSO)
npm run assign-wallets -- --sso-only

# Resume from previous interrupted execution
npm run assign-wallets -- --resume

# Process specific user addresses
npm run assign-wallets -- --addresses=0xabc123,0xdef456

# Combine options
npm run assign-wallets -- --dry-run --batch-size=25 --sso-only
```

### Command Line Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--dry-run` | Flag | `false` | Simulate execution without making changes |
| `--batch-size=N` | Number | `50` | Number of users to process per batch |
| `--delay=N` | Number | `2000` | Delay in milliseconds between batches |
| `--sso-only` | Flag | `false` | Process only users with Google or NYU SSO |
| `--resume` | Flag | `false` | Resume from last interrupted execution |
| `--addresses=A,B,C` | String | `[]` | Process only specific addresses (comma-separated) |

### Alternative Execution Methods

#### Using ts-node directly:
```bash
npx ts-node src/scripts/assign-wallets-retroactive.ts --dry-run
```

#### Using npm script (add to package.json):
```json
{
  "scripts": {
    "assign-wallets": "ts-node src/scripts/assign-wallets-retroactive.ts"
  }
}
```

## Workflow

### Recommended First-Time Execution

1. **Dry Run**: Always start with a dry run to verify the script will work correctly:
   ```bash
   npm run assign-wallets -- --dry-run
   ```

2. **Test with Small Batch**: Run with a small batch of specific users:
   ```bash
   npm run assign-wallets -- --batch-size=5 --addresses=0xuser1,0xuser2
   ```

3. **Full Execution**: Run the full script after verification:
   ```bash
   npm run assign-wallets
   ```

### Standard Execution Flow

1. **Script Start**: Displays configuration and warnings
2. **Database Connection Test**: Verifies database connectivity
3. **Confirmation Prompt**: Asks for user confirmation (unless dry-run or specific addresses)
4. **User Query**: Fetches all users without wallets (prioritizing SSO users)
5. **Batch Processing**: Processes users in configurable batches
   - Generate Ed25519 wallet
   - Encrypt private key with AES-256-GCM
   - Update database
   - Fund wallet on testnet (1 APT)
   - Log audit entry
6. **Progress Reporting**: Displays progress bar and statistics
7. **Summary Generation**: Creates detailed summary report
8. **Log File Creation**: Writes logs, summary, and error CSV

## Processing Logic

### User Selection Query

Users are selected based on the following criteria:

```sql
SELECT address, sso_id, sso_provider, email, first_name, last_name
FROM users
WHERE (wallet_public_key IS NULL OR wallet_generated = false)
ORDER BY
  CASE
    WHEN sso_provider IN ('google', 'nyu_sso') THEN 0
    ELSE 1
  END,
  created_at ASC
```

**Priority Order:**
1. SSO users (Google, NYU SSO) - processed first
2. Non-SSO users - processed after SSO users
3. Within each group, users are processed by creation date (oldest first)

### Wallet Generation Process

For each user:

1. **Generate Wallet**: Create new Ed25519 key pair using `@aptos-labs/ts-sdk`
2. **Encrypt Private Key**: Encrypt private key using AES-256-GCM with PBKDF2 key derivation
3. **Database Update**: Store public key and encrypted private key in database
4. **Mark as Generated**: Set `wallet_generated = true` and `wallet_created_at = NOW()`
5. **Fund Wallet**: Call Aptos faucet to fund with 1 APT (testnet only)
6. **Audit Log**: Record successful/failed assignment

### Error Handling

| Error Type | Behavior | Recovery |
|------------|----------|----------|
| Database Connection Failure | Retry 3 times with exponential backoff | Fail if all retries exhausted |
| Wallet Generation Failure | Log error, skip user, continue | User remains in unprocessed state |
| Encryption Failure | **CRITICAL** - Halt entire process | Manual intervention required |
| Database Update Failure | Retry 3 times, skip user if failed | Can be resumed later |
| Funding Failure (Testnet) | Log warning, continue | Wallet still created successfully |
| Network Timeout | Retry with exponential backoff | Continue after retry |

## Output Files

All output files are written to `/backend/logs/` directory:

### 1. Detailed Log File
**Path**: `logs/wallet-assignment-exec_[timestamp].log`

Contains complete execution state and summary in JSON format.

```json
{
  "state": {
    "totalProcessed": 100,
    "successCount": 98,
    "failCount": 2,
    "lastProcessedAddress": "0x...",
    "errors": [...],
    "timestamp": "exec_1699999999999"
  },
  "summary": {
    "executionId": "exec_1699999999999",
    "startTime": "2025-01-15T10:30:00.000Z",
    "endTime": "2025-01-15T10:35:00.000Z",
    "totalTimeMs": 300000,
    "totalTimeSec": "300.00",
    "totalUsers": 100,
    "totalProcessed": 100,
    "successfulWallets": 98,
    "failedWallets": 2,
    "successRate": "98.00%",
    "averageTimePerWalletMs": "3000.00"
  }
}
```

### 2. Summary Report
**Path**: `logs/wallet-assignment-exec_[timestamp]-summary.json`

Simplified summary report for quick reference.

### 3. Error CSV
**Path**: `logs/wallet-assignment-errors-exec_[timestamp].csv`

CSV file containing all errors encountered during execution:

```csv
address,error,timestamp
0x123abc...,Wallet generation failed,2025-01-15T10:32:15.000Z
0x456def...,Database connection timeout,2025-01-15T10:34:20.000Z
```

### 4. Audit Log (JSONL)
**Path**: `logs/wallet-assignment-audit.jsonl`

Append-only JSONL file containing one entry per wallet assignment:

```jsonl
{"executionId":"exec_1699999999999","address":"0x123...","walletPublicKey":"0xabc...","timestamp":"2025-01-15T10:30:01.000Z","success":true,"fundingTxHash":"0xtx123..."}
{"executionId":"exec_1699999999999","address":"0x456...","walletPublicKey":"0xdef...","timestamp":"2025-01-15T10:30:04.000Z","success":true,"fundingTxHash":"0xtx456..."}
```

### 5. State File (Temporary)
**Path**: `logs/wallet-assignment-state.json`

Temporary state file used for resuming interrupted executions. Automatically deleted upon successful completion.

## Resume Functionality

If the script is interrupted (Ctrl+C, system crash, network failure), you can resume from where it left off:

```bash
npm run assign-wallets -- --resume
```

**How it works:**
1. The script saves state after processing each user
2. On interruption, the state file remains in `logs/wallet-assignment-state.json`
3. Using `--resume` flag loads the saved state
4. Processing continues from `lastProcessedAddress + 1`
5. State file is deleted upon successful completion

**Note**: The state file is tied to the execution configuration. If you change options (e.g., `--sso-only`), it's recommended to delete the state file and start fresh.

## Safety Features

### 1. Dry Run Mode
Test the script without making any database changes:
```bash
npm run assign-wallets -- --dry-run
```

### 2. Confirmation Prompt
For non-dry-run executions, the script prompts for confirmation before proceeding.

### 3. Idempotent Operations
Users who already have wallets are automatically skipped (checked in SQL query).

### 4. State Persistence
Processing state is saved after each user, allowing resumption on failure.

### 5. Critical Error Handling
Encryption failures (critical) halt the entire process to prevent data corruption.

### 6. Non-Critical Error Handling
Funding failures (non-critical) are logged as warnings but don't stop the process.

### 7. Batch Processing
Configurable batch sizes and delays prevent database/network overload.

### 8. Retry Logic
Transient failures are automatically retried with exponential backoff (3 attempts).

## Monitoring and Debugging

### Real-Time Monitoring

During execution, the script displays:
- Current batch number and progress
- ASCII progress bar: `[=========>    ] 75% (75/100)`
- Success/failure counts
- Time estimates

### Log Levels

The script uses Winston logger with the following levels:
- `info`: Normal operation logs
- `warn`: Non-critical issues (e.g., funding failures)
- `error`: Critical errors (e.g., database failures)
- `debug`: Detailed debugging information (set `LOG_LEVEL=debug`)

### Console Output Example

```
==============================================
Retroactive Aptos Wallet Assignment Script
==============================================

Script configuration: { dryRun: false, batchSize: 50, delay: 2000, ... }

Testing database connection...
Database connection successful

⚠️  WARNING: This will modify user records in the database.
Do you want to continue? (yes/no): yes

📊 Found 150 users to process
   Batch size: 50
   Delay between batches: 2000ms

📦 Processing batch 1/3 (50 users)...

   [=============>           ] 33% (50/150)
   Success: 48 | Failed: 2

📦 Processing batch 2/3 (50 users)...

   [==========================>      ] 67% (100/150)
   Success: 97 | Failed: 3

📦 Processing batch 3/3 (50 users)...

   [========================================>] 100% (150/150)
   Success: 147 | Failed: 3

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

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
**Symptom**: `Database connection failed`

**Solution**:
- Check `.env` file for correct database credentials
- Verify PostgreSQL is running: `pg_isready`
- Test connection manually: `psql -h localhost -U postgres -d nyu_aptos`

#### 2. Encryption Key Not Set
**Symptom**: `WALLET_ENCRYPTION_SECRET must be set in environment variables`

**Solution**:
- Add `WALLET_ENCRYPTION_SECRET` to `.env` file
- Generate a secure key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### 3. Out of Memory (Large Batches)
**Symptom**: `JavaScript heap out of memory`

**Solution**:
- Reduce batch size: `--batch-size=25`
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run assign-wallets`

#### 4. Testnet Faucet Rate Limiting
**Symptom**: `Failed to fund wallet` (many times)

**Solution**:
- Funding failures are non-critical and logged as warnings
- Consider increasing delay between batches: `--delay=5000`
- Wallets are still created successfully even if funding fails

#### 5. Resume Not Working
**Symptom**: Resume starts from beginning instead of last processed

**Solution**:
- Check if `logs/wallet-assignment-state.json` exists
- Verify state file is not corrupted (valid JSON)
- Ensure you're using the same configuration options

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
LOG_LEVEL=debug npm run assign-wallets -- --dry-run
```

## Performance Considerations

### Recommended Settings by Scale

| Users | Batch Size | Delay | Est. Time |
|-------|------------|-------|-----------|
| < 100 | 50 | 2000ms | ~10 min |
| 100-500 | 50 | 2000ms | ~30 min |
| 500-1000 | 75 | 3000ms | ~1 hour |
| 1000-5000 | 100 | 5000ms | ~3 hours |
| 5000+ | 100 | 5000ms | ~6+ hours |

**Factors affecting performance:**
- Database connection latency
- Aptos testnet faucet response time
- Encryption overhead (CPU-intensive)
- Network bandwidth

### Optimization Tips

1. **Test First**: Always run dry-run to estimate time
2. **Off-Peak Hours**: Run during low-traffic periods
3. **Monitor Resources**: Watch CPU, memory, and database connections
4. **Adjust Delays**: Increase delay if seeing rate limiting or timeouts
5. **Use Resume**: For very large datasets, run in chunks and resume

## Security Considerations

### Private Key Encryption

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: Random 64-byte salt per encryption
- **IV**: Random 16-byte initialization vector per encryption
- **Authentication**: 16-byte authentication tag prevents tampering

### Environment Variables

**Required**:
- `WALLET_ENCRYPTION_SECRET`: 32-byte hex string for encrypting private keys
- `DB_PASSWORD`: PostgreSQL database password

**Important**:
- Never commit `.env` file to version control
- Use strong, random encryption secrets
- Rotate encryption keys periodically (requires re-encryption)

### Access Control

- **Database Access**: Script requires write access to `users` table
- **File System**: Requires write access to `logs/` directory
- **Network Access**: Requires access to Aptos testnet (if funding)

### Audit Trail

All wallet assignments are logged in:
1. **Database**: `updated_at`, `wallet_created_at` timestamps
2. **Audit Log**: JSONL file with immutable append-only entries
3. **Application Logs**: Winston logs with structured data

## Post-Execution Checklist

After running the script, verify:

- [ ] Review summary report for success rate
- [ ] Check error CSV for any failures
- [ ] Verify database records updated correctly:
  ```sql
  SELECT COUNT(*) FROM users WHERE wallet_generated = true;
  ```
- [ ] Review audit log for compliance
- [ ] Test a few wallets can sign transactions
- [ ] Notify users about their new wallets (if applicable)
- [ ] Archive log files for records
- [ ] Delete state file if manually interrupted

## Notification Integration (Future Enhancement)

The script is designed to be extended with notification capabilities:

```typescript
// After successful wallet creation
await notifyUser(user.email, {
  type: 'WALLET_CREATED',
  walletAddress: wallet.address,
  publicKey: wallet.publicKey,
});
```

**Notification methods to consider:**
- Email notification with wallet details
- In-app notification
- SMS notification for critical users
- Slack/Discord webhook for admin team

## Rollback Procedure

If you need to rollback wallet assignments:

```sql
-- View recently created wallets
SELECT address, wallet_public_key, wallet_created_at
FROM users
WHERE wallet_created_at > '2025-01-15 10:00:00'
  AND wallet_generated = true;

-- Rollback specific batch (CAUTION: Use with care)
UPDATE users
SET wallet_public_key = NULL,
    encrypted_private_key = NULL,
    wallet_generated = false,
    wallet_created_at = NULL
WHERE wallet_created_at > '2025-01-15 10:00:00'
  AND wallet_generated = true;
```

**⚠️ WARNING**: Rollback should only be performed in emergency situations, as users may have already started using their wallets.

## Support and Maintenance

### Logging Retention

Recommendation: Retain logs for at least 90 days for audit and compliance purposes.

```bash
# Archive old logs (Linux/macOS)
tar -czf wallet-assignment-logs-$(date +%Y%m%d).tar.gz logs/wallet-assignment-*.log logs/wallet-assignment-*.json logs/wallet-assignment-*.csv
mv wallet-assignment-logs-*.tar.gz archives/
```

### Monitoring

Set up monitoring for:
- Script execution failures (exit code != 0)
- Low success rate (< 90%)
- Long execution times (> expected)
- Disk space in logs directory

### Regular Maintenance

- **Weekly**: Review audit logs for anomalies
- **Monthly**: Archive and compress old logs
- **Quarterly**: Review and update error handling logic
- **Annually**: Rotate encryption keys (requires migration script)

## FAQ

**Q: Can I run this script multiple times?**
A: Yes, the script is idempotent. Users who already have wallets are automatically skipped.

**Q: What happens if I cancel the script mid-execution?**
A: Use `--resume` flag to continue from where you left off. The script saves state after each user.

**Q: Can I process only specific users?**
A: Yes, use `--addresses=0xabc,0xdef` to process only specific addresses.

**Q: How long does it take to process 1000 users?**
A: Approximately 1 hour with default settings (50 batch size, 2s delay). Use dry-run to estimate.

**Q: What if the Aptos faucet is down?**
A: Wallet creation will still succeed. Funding failures are logged as warnings but don't stop the process.

**Q: Can I run this on mainnet?**
A: Yes, but wallet funding is only available on testnet. On mainnet, wallets will be created but not funded.

**Q: How do I verify the script worked correctly?**
A: Check the summary report, review database records, and test a few wallets can sign transactions.

**Q: What if I see "Critical encryption failure"?**
A: This is a serious error. Check `WALLET_ENCRYPTION_SECRET` is set correctly and has proper permissions. Contact system administrator.

## Additional Resources

- [Aptos TypeScript SDK Documentation](https://aptos.dev/sdks/ts-sdk/)
- [AES-256-GCM Encryption Standards](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [Winston Logger Documentation](https://github.com/winstonjs/winston)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don't_Do_This)

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in `logs/` directory
3. Enable debug mode: `LOG_LEVEL=debug`
4. Contact development team with execution ID and error logs

---

**Version**: 1.0.0
**Last Updated**: 2025-01-15
**Maintainer**: NYU Aptos Development Team
