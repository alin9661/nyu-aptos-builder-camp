import { WalletService } from '../services/walletService';
import { pool, query, transaction } from '../config/database';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

/**
 * Retroactive Aptos Wallet Assignment Script
 *
 * This script assigns Aptos wallets to existing users who don't have one.
 * It processes users in configurable batches with safety features like
 * dry-run mode, state persistence, and comprehensive error handling.
 */

// =====================================================
// INTERFACES
// =====================================================

interface UserWithoutWallet {
  address: string;
  sso_id: string | null;
  sso_provider: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface WalletAssignmentResult {
  address: string;
  publicKey?: string;
  success: boolean;
  error?: string;
  fundingTxHash?: string | null;
}

interface ScriptConfig {
  dryRun: boolean;
  batchSize: number;
  delay: number;
  ssoOnly: boolean;
  resume: boolean;
  addresses: string[];
}

interface ProcessingState {
  totalProcessed: number;
  successCount: number;
  failCount: number;
  lastProcessedAddress: string | null;
  errors: Array<{
    address: string;
    error: string;
    timestamp: string;
  }>;
  timestamp: string;
}

interface AuditLogEntry {
  executionId: string;
  address: string;
  walletPublicKey?: string;
  timestamp: string;
  success: boolean;
  error?: string;
  fundingTxHash?: string | null;
}

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_DELAY_MS = 2000;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 1000;
const LOGS_DIR = path.join(__dirname, '../../logs');
const STATE_FILE_PATH = path.join(LOGS_DIR, 'wallet-assignment-state.json');
const AUDIT_LOG_PATH = path.join(LOGS_DIR, 'wallet-assignment-audit.jsonl');

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Parse command line arguments
 */
function parseCommandLineArgs(): ScriptConfig {
  const args = process.argv.slice(2);
  const config: ScriptConfig = {
    dryRun: false,
    batchSize: DEFAULT_BATCH_SIZE,
    delay: DEFAULT_DELAY_MS,
    ssoOnly: false,
    resume: false,
    addresses: [],
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      config.dryRun = true;
    } else if (arg === '--sso-only') {
      config.ssoOnly = true;
    } else if (arg === '--resume') {
      config.resume = true;
    } else if (arg.startsWith('--batch-size=')) {
      config.batchSize = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--delay=')) {
      config.delay = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--addresses=')) {
      config.addresses = arg.split('=')[1].split(',').map(a => a.trim());
    }
  }

  return config;
}

/**
 * Ensure logs directory exists
 */
function ensureLogsDirectory(): void {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    logger.info('Created logs directory', { path: LOGS_DIR });
  }
}

/**
 * Load processing state from previous interrupted execution
 */
function loadProcessingState(): ProcessingState | null {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = fs.readFileSync(STATE_FILE_PATH, 'utf8');
      const state = JSON.parse(data) as ProcessingState;
      logger.info('Loaded processing state', {
        totalProcessed: state.totalProcessed,
        lastProcessedAddress: state.lastProcessedAddress
      });
      return state;
    }
  } catch (error) {
    logger.warn('Failed to load processing state', { error });
  }
  return null;
}

/**
 * Save processing state for resumption
 */
function saveProcessingState(state: ProcessingState): void {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    logger.error('Failed to save processing state', { error });
  }
}

/**
 * Delete processing state file
 */
function deleteProcessingState(): void {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      fs.unlinkSync(STATE_FILE_PATH);
      logger.info('Deleted processing state file');
    }
  } catch (error) {
    logger.warn('Failed to delete processing state file', { error });
  }
}

/**
 * Query users without wallets
 */
async function queryUsersWithoutWallets(
  config: ScriptConfig,
  resumeFromAddress?: string
): Promise<UserWithoutWallet[]> {
  try {
    let queryText = `
      SELECT address, sso_id, sso_provider, email, first_name, last_name
      FROM users
      WHERE (wallet_public_key IS NULL OR wallet_generated = false)
    `;

    const params: any[] = [];

    if (config.ssoOnly) {
      queryText += ` AND sso_provider IN ('google', 'nyu_sso')`;
    }

    if (resumeFromAddress) {
      queryText += ` AND address > $${params.length + 1}`;
      params.push(resumeFromAddress);
    }

    if (config.addresses.length > 0) {
      queryText += ` AND address = ANY($${params.length + 1})`;
      params.push(config.addresses);
    }

    queryText += `
      ORDER BY
        CASE
          WHEN sso_provider IN ('google', 'nyu_sso') THEN 0
          ELSE 1
        END,
        created_at ASC
    `;

    logger.info('Querying users without wallets', {
      ssoOnly: config.ssoOnly,
      resumeFromAddress,
      specificAddresses: config.addresses.length
    });

    const users = await query<UserWithoutWallet>(queryText, params.length > 0 ? params : undefined);

    logger.info('Found users without wallets', { count: users.length });
    return users;
  } catch (error) {
    logger.error('Failed to query users', { error });
    throw new Error('Database query failed');
  }
}

/**
 * Assign wallet to a single user
 */
async function assignWalletToUser(
  user: UserWithoutWallet,
  dryRun: boolean
): Promise<WalletAssignmentResult> {
  if (dryRun) {
    logger.info('[DRY RUN] Would assign wallet to user', { address: user.address });
    return {
      address: user.address,
      publicKey: '0x1234567890abcdef',
      success: true,
      fundingTxHash: '0xmock_tx_hash',
    };
  }

  try {
    // Generate new wallet
    const wallet = await WalletService.generateWallet();

    // Update database with wallet information
    await transaction(async (client) => {
      await client.query(
        `UPDATE users
         SET wallet_public_key = $1,
             encrypted_private_key = $2,
             wallet_generated = true,
             wallet_created_at = NOW(),
             updated_at = NOW()
         WHERE address = $3`,
        [wallet.publicKey, wallet.encryptedPrivateKey, user.address]
      );
    });

    logger.info('Assigned wallet to user', {
      address: user.address,
      publicKey: wallet.publicKey.substring(0, 10) + '...'
    });

    // Fund wallet on testnet (non-critical, log warning on failure)
    let fundingTxHash: string | null = null;
    try {
      fundingTxHash = await WalletService.fundWallet(wallet.address);
      if (fundingTxHash) {
        logger.info('Funded wallet', { address: wallet.address, txHash: fundingTxHash });
      }
    } catch (fundingError) {
      logger.warn('Failed to fund wallet (non-critical)', {
        address: wallet.address,
        error: fundingError
      });
    }

    return {
      address: user.address,
      publicKey: wallet.publicKey,
      success: true,
      fundingTxHash,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to assign wallet to user', {
      address: user.address,
      error: errorMessage
    });

    // Check if it's a critical encryption error
    if (errorMessage.includes('Encryption failed')) {
      logger.error('CRITICAL: Encryption failure detected. Halting process.', { error });
      throw new Error('Critical encryption failure - process halted');
    }

    return {
      address: user.address,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number,
  currentAttempt: number = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    const delay = RETRY_BACKOFF_MS * currentAttempt;
    logger.warn('Retrying after failure', {
      attempt: currentAttempt,
      remainingRetries: retries,
      delayMs: delay
    });

    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, currentAttempt + 1);
  }
}

/**
 * Process a batch of users
 */
async function processBatch(
  users: UserWithoutWallet[],
  config: ScriptConfig,
  state: ProcessingState
): Promise<void> {
  for (const user of users) {
    try {
      const result = await retryWithBackoff(
        () => assignWalletToUser(user, config.dryRun),
        MAX_RETRY_ATTEMPTS
      );

      if (result.success) {
        state.successCount++;
      } else {
        state.failCount++;
        state.errors.push({
          address: user.address,
          error: result.error || 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }

      state.lastProcessedAddress = user.address;
      state.totalProcessed++;

      // Log progress
      if (state.totalProcessed % 10 === 0 || state.totalProcessed === 1) {
        logger.info('Progress update', {
          processed: state.totalProcessed,
          success: state.successCount,
          failed: state.failCount,
        });
      }

      // Save state after each user (for recovery)
      saveProcessingState(state);

      // Create audit log entry
      await appendAuditLog({
        executionId: state.timestamp,
        address: user.address,
        walletPublicKey: result.publicKey,
        timestamp: new Date().toISOString(),
        success: result.success,
        error: result.error,
        fundingTxHash: result.fundingTxHash,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Critical error - halt execution
      if (errorMessage.includes('Critical encryption failure')) {
        throw error;
      }

      state.failCount++;
      state.errors.push({
        address: user.address,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
      state.totalProcessed++;
      saveProcessingState(state);
    }
  }
}

/**
 * Display progress bar
 */
function displayProgressBar(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  const barLength = 40;
  const filledLength = Math.round((current / total) * barLength);
  const emptyLength = barLength - filledLength;

  const filledBar = '='.repeat(Math.max(0, filledLength - 1)) + (filledLength > 0 ? '>' : '');
  const emptyBar = ' '.repeat(emptyLength);

  return `[${filledBar}${emptyBar}] ${percentage}% (${current}/${total})`;
}

/**
 * Generate summary report
 */
function generateSummaryReport(
  state: ProcessingState,
  startTime: Date,
  totalUsers: number
): Record<string, any> {
  const endTime = new Date();
  const totalTime = endTime.getTime() - startTime.getTime();
  const averageTimePerWallet = state.totalProcessed > 0
    ? totalTime / state.totalProcessed
    : 0;
  const successRate = state.totalProcessed > 0
    ? (state.successCount / state.totalProcessed) * 100
    : 0;

  return {
    executionId: state.timestamp,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    totalTimeMs: totalTime,
    totalTimeSec: (totalTime / 1000).toFixed(2),
    totalUsers,
    totalProcessed: state.totalProcessed,
    successfulWallets: state.successCount,
    failedWallets: state.failCount,
    successRate: successRate.toFixed(2) + '%',
    averageTimePerWalletMs: averageTimePerWallet.toFixed(2),
    errors: state.errors,
  };
}

/**
 * Write log files
 */
function writeLogFiles(
  state: ProcessingState,
  summary: Record<string, any>,
  executionId: string
): void {
  try {
    // Detailed log
    const detailedLogPath = path.join(LOGS_DIR, `wallet-assignment-${executionId}.log`);
    fs.writeFileSync(
      detailedLogPath,
      JSON.stringify({ state, summary }, null, 2),
      'utf8'
    );
    logger.info('Wrote detailed log', { path: detailedLogPath });

    // Summary JSON
    const summaryPath = path.join(LOGS_DIR, `wallet-assignment-${executionId}-summary.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    logger.info('Wrote summary report', { path: summaryPath });

    // Errors CSV
    if (state.errors.length > 0) {
      const errorsPath = path.join(LOGS_DIR, `wallet-assignment-errors-${executionId}.csv`);
      const csvHeader = 'address,error,timestamp\n';
      const csvRows = state.errors
        .map(e => `"${e.address}","${e.error.replace(/"/g, '""')}","${e.timestamp}"`)
        .join('\n');
      fs.writeFileSync(errorsPath, csvHeader + csvRows, 'utf8');
      logger.info('Wrote errors CSV', { path: errorsPath });
    }
  } catch (error) {
    logger.error('Failed to write log files', { error });
  }
}

/**
 * Append audit log entry
 */
async function appendAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(AUDIT_LOG_PATH, logLine, 'utf8');
  } catch (error) {
    logger.error('Failed to append audit log', { error });
  }
}

/**
 * Prompt user for confirmation
 */
async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Test database connection
 */
async function testDatabaseConnection(): Promise<void> {
  try {
    logger.info('Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection successful');
  } catch (error) {
    logger.error('Database connection failed', { error });
    throw new Error('Cannot connect to database');
  }
}

// =====================================================
// MAIN EXECUTION
// =====================================================

/**
 * Main execution function
 */
export async function main(): Promise<void> {
  console.log('\n==============================================');
  console.log('Retroactive Aptos Wallet Assignment Script');
  console.log('==============================================\n');

  // Parse configuration
  const config = parseCommandLineArgs();
  logger.info('Script configuration', config);

  // Ensure logs directory exists
  ensureLogsDirectory();

  // Generate execution ID
  const executionId = `exec_${Date.now()}`;
  logger.info('Execution ID', { executionId });

  // Display dry-run warning
  if (config.dryRun) {
    console.log('\n*** DRY RUN MODE - No changes will be made ***\n');
    logger.warn('Running in DRY RUN mode');
  }

  // Test database connection
  await testDatabaseConnection();

  // Prompt for confirmation (unless dry-run or specific addresses)
  if (!config.dryRun && config.addresses.length === 0) {
    console.log('\n⚠️  WARNING: This will modify user records in the database.');
    const confirmed = await promptConfirmation('Do you want to continue?');
    if (!confirmed) {
      console.log('Operation cancelled by user.\n');
      logger.info('Operation cancelled by user');
      return;
    }
  }

  // Load processing state if resuming
  let state: ProcessingState;
  let resumeFromAddress: string | undefined;

  if (config.resume) {
    const savedState = loadProcessingState();
    if (savedState) {
      state = savedState;
      resumeFromAddress = savedState.lastProcessedAddress || undefined;
      console.log(`\n📂 Resuming from previous execution...`);
      console.log(`   Previously processed: ${savedState.totalProcessed} users`);
      console.log(`   Last address: ${savedState.lastProcessedAddress}\n`);
    } else {
      logger.warn('No saved state found, starting fresh');
      state = {
        totalProcessed: 0,
        successCount: 0,
        failCount: 0,
        lastProcessedAddress: null,
        errors: [],
        timestamp: executionId,
      };
    }
  } else {
    state = {
      totalProcessed: 0,
      successCount: 0,
      failCount: 0,
      lastProcessedAddress: null,
      errors: [],
      timestamp: executionId,
    };
  }

  // Query users without wallets
  const users = await queryUsersWithoutWallets(config, resumeFromAddress);

  if (users.length === 0) {
    console.log('\n✅ No users found without wallets. All done!\n');
    logger.info('No users to process');
    return;
  }

  console.log(`\n📊 Found ${users.length} users to process`);
  console.log(`   Batch size: ${config.batchSize}`);
  console.log(`   Delay between batches: ${config.delay}ms\n`);

  const startTime = new Date();

  // Process users in batches
  const totalBatches = Math.ceil(users.length / config.batchSize);

  for (let i = 0; i < users.length; i += config.batchSize) {
    const batchNumber = Math.floor(i / config.batchSize) + 1;
    const batch = users.slice(i, i + config.batchSize);

    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} users)...`);
    logger.info('Processing batch', {
      batchNumber,
      totalBatches,
      batchSize: batch.length
    });

    await processBatch(batch, config, state);

    // Display progress bar
    const progressBar = displayProgressBar(state.totalProcessed, users.length);
    console.log(`\n   ${progressBar}`);
    console.log(`   Success: ${state.successCount} | Failed: ${state.failCount}\n`);

    // Delay between batches (except for last batch)
    if (i + config.batchSize < users.length) {
      logger.info('Waiting before next batch', { delayMs: config.delay });
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }
  }

  // Generate summary report
  const summary = generateSummaryReport(state, startTime, users.length);

  // Write log files
  writeLogFiles(state, summary, executionId);

  // Delete state file if completed successfully
  if (config.resume) {
    deleteProcessingState();
  }

  // Display final summary
  console.log('\n==============================================');
  console.log('EXECUTION SUMMARY');
  console.log('==============================================\n');
  console.log(`Total Time: ${summary.totalTimeSec}s`);
  console.log(`Total Users: ${summary.totalUsers}`);
  console.log(`Processed: ${summary.totalProcessed}`);
  console.log(`✅ Successful: ${summary.successfulWallets}`);
  console.log(`❌ Failed: ${summary.failedWallets}`);
  console.log(`Success Rate: ${summary.successRate}`);
  console.log(`Avg Time/Wallet: ${summary.averageTimePerWalletMs}ms`);
  console.log('\n==============================================\n');

  logger.info('Script completed', summary);
}

// =====================================================
// SCRIPT EXECUTION
// =====================================================

if (require.main === module) {
  main()
    .then(() => {
      logger.info('Script finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error during script execution', { error });
      console.error('\n❌ Fatal error:', error.message);
      process.exit(1);
    });
}
