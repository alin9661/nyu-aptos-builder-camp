# Administrative Scripts

This directory contains administrative and maintenance scripts for the NYU Aptos platform.

## Available Scripts

### Retroactive Wallet Assignment

**File**: `assign-wallets-retroactive.ts`

Assigns Aptos wallets to existing users who don't have one. Supports batch processing, state persistence, and comprehensive error handling.

**Quick Start**:
```bash
# Dry run (recommended first)
npm run assign-wallets -- --dry-run

# Full execution
npm run assign-wallets

# Process only SSO users
npm run assign-wallets -- --sso-only

# Resume interrupted execution
npm run assign-wallets -- --resume
```

**Documentation**: See `/docs/RETROACTIVE_WALLET_ASSIGNMENT.md` for comprehensive documentation.

**Options**:
- `--dry-run` - Test without making changes
- `--batch-size=N` - Number of users per batch (default: 50)
- `--delay=N` - Delay between batches in ms (default: 2000)
- `--sso-only` - Process only Google/NYU SSO users
- `--resume` - Resume from last interrupted execution
- `--addresses=A,B,C` - Process specific addresses only

**Output Files**:
- `logs/wallet-assignment-exec_[timestamp].log` - Detailed log
- `logs/wallet-assignment-exec_[timestamp]-summary.json` - Summary report
- `logs/wallet-assignment-errors-[timestamp].csv` - Error list
- `logs/wallet-assignment-audit.jsonl` - Audit trail

## Adding New Scripts

When adding a new administrative script:

1. **Create the script file** in this directory
2. **Add npm script** in `package.json`:
   ```json
   "script-name": "ts-node src/scripts/your-script.ts"
   ```
3. **Add documentation** to this README
4. **Create detailed docs** in `/docs/` if complex
5. **Follow best practices**:
   - Use TypeScript strict mode
   - Include comprehensive error handling
   - Add dry-run mode for destructive operations
   - Log all operations
   - Create audit trails
   - Use existing services (WalletService, database utils, etc.)

## Script Development Guidelines

### Required Features for Administrative Scripts

- **Dry Run Mode**: Allow testing without side effects
- **Progress Reporting**: Show what's happening
- **Error Handling**: Graceful degradation
- **Logging**: Comprehensive audit trail
- **State Persistence**: Allow resumption if interrupted
- **Confirmation Prompts**: For destructive operations
- **Idempotency**: Safe to run multiple times

### Example Script Structure

```typescript
import { logger } from '../utils/logger';
import { pool, query } from '../config/database';

interface ScriptConfig {
  dryRun: boolean;
  // ... other options
}

function parseArgs(): ScriptConfig {
  // Parse command line arguments
}

async function main(): Promise<void> {
  const config = parseArgs();

  if (config.dryRun) {
    logger.warn('Running in DRY RUN mode');
  }

  // Script logic here

  logger.info('Script completed successfully');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Script failed', { error });
      process.exit(1);
    });
}

export { main };
```

## Maintenance

- **Log Rotation**: Archive logs older than 90 days
- **State Cleanup**: Remove old state files
- **Performance Monitoring**: Track execution times
- **Error Analysis**: Review error patterns monthly

## Support

For issues with scripts:
1. Check script-specific documentation in `/docs/`
2. Review error logs in `logs/` directory
3. Enable debug mode: `LOG_LEVEL=debug npm run script-name`
4. Contact development team with execution ID and error logs

---

**Last Updated**: 2025-01-15
