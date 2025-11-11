#!/usr/bin/env ts-node
/**
 * Setup Verification Script
 *
 * Verifies that the environment is correctly configured for running
 * the retroactive wallet assignment script.
 */

import * as fs from 'fs';
import * as path from 'path';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

interface VerificationResult {
  check: string;
  passed: boolean;
  message: string;
}

const results: VerificationResult[] = [];

/**
 * Check if environment variable is set
 */
function checkEnvVar(name: string, required: boolean = true): boolean {
  const value = process.env[name];
  const exists = !!value && value.trim() !== '';

  results.push({
    check: `Environment variable: ${name}`,
    passed: exists || !required,
    message: exists
      ? `Set (${value.substring(0, 10)}...)`
      : required
      ? 'Missing - REQUIRED'
      : 'Not set (optional)'
  });

  return exists || !required;
}

/**
 * Check database connection
 */
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();

    results.push({
      check: 'Database connection',
      passed: true,
      message: `Connected successfully to PostgreSQL`
    });

    return true;
  } catch (error) {
    results.push({
      check: 'Database connection',
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return false;
  }
}

/**
 * Check database schema
 */
async function checkDatabaseSchema(): Promise<boolean> {
  try {
    const client = await pool.connect();

    // Check users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      ) as exists
    `);

    if (!tableCheck.rows[0].exists) {
      results.push({
        check: 'Database schema: users table',
        passed: false,
        message: 'Table "users" does not exist'
      });
      client.release();
      return false;
    }

    // Check required columns
    const columnsCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN (
          'address',
          'wallet_public_key',
          'encrypted_private_key',
          'wallet_generated',
          'wallet_created_at',
          'sso_provider',
          'sso_id'
        )
    `);

    const foundColumns = columnsCheck.rows.map(r => r.column_name);
    const requiredColumns = [
      'address',
      'wallet_public_key',
      'encrypted_private_key',
      'wallet_generated',
      'wallet_created_at',
      'sso_provider',
      'sso_id'
    ];

    const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));

    if (missingColumns.length > 0) {
      results.push({
        check: 'Database schema: users columns',
        passed: false,
        message: `Missing columns: ${missingColumns.join(', ')}`
      });
      client.release();
      return false;
    }

    // Count users without wallets
    const usersCount = await client.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE wallet_public_key IS NULL OR wallet_generated = false
    `);

    results.push({
      check: 'Database schema: users table',
      passed: true,
      message: `Valid schema. ${usersCount.rows[0].count} users without wallets`
    });

    client.release();
    return true;
  } catch (error) {
    results.push({
      check: 'Database schema',
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return false;
  }
}

/**
 * Check logs directory
 */
function checkLogsDirectory(): boolean {
  const logsDir = path.join(__dirname, '../../logs');

  if (!fs.existsSync(logsDir)) {
    try {
      fs.mkdirSync(logsDir, { recursive: true });
      results.push({
        check: 'Logs directory',
        passed: true,
        message: `Created directory at ${logsDir}`
      });
      return true;
    } catch (error) {
      results.push({
        check: 'Logs directory',
        passed: false,
        message: `Cannot create directory: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return false;
    }
  }

  // Check write permissions
  try {
    const testFile = path.join(logsDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    results.push({
      check: 'Logs directory',
      passed: true,
      message: `Exists and writable at ${logsDir}`
    });
    return true;
  } catch (error) {
    results.push({
      check: 'Logs directory',
      passed: false,
      message: `Directory exists but not writable`
    });
    return false;
  }
}

/**
 * Check script file exists
 */
function checkScriptExists(): boolean {
  const scriptPath = path.join(__dirname, 'assign-wallets-retroactive.ts');

  if (fs.existsSync(scriptPath)) {
    results.push({
      check: 'Script file',
      passed: true,
      message: `Found at ${scriptPath}`
    });
    return true;
  } else {
    results.push({
      check: 'Script file',
      passed: false,
      message: `Not found at ${scriptPath}`
    });
    return false;
  }
}

/**
 * Check encryption functionality
 */
function checkEncryption(): boolean {
  try {
    const { encrypt, decrypt } = require('../utils/encryption');
    const testData = 'test_private_key_12345';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);

    if (testData === decrypted) {
      results.push({
        check: 'Encryption/Decryption',
        passed: true,
        message: 'AES-256-GCM encryption working correctly'
      });
      return true;
    } else {
      results.push({
        check: 'Encryption/Decryption',
        passed: false,
        message: 'Decryption does not match original data'
      });
      return false;
    }
  } catch (error) {
    results.push({
      check: 'Encryption/Decryption',
      passed: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return false;
  }
}

/**
 * Display results
 */
function displayResults(): void {
  console.log('\n==============================================');
  console.log('Setup Verification Results');
  console.log('==============================================\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.check}`);
    console.log(`   ${result.message}\n`);
  });

  console.log('==============================================');
  console.log(`Total: ${results.length} checks`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('==============================================\n');

  if (failed === 0) {
    console.log('✅ All checks passed! You can run the wallet assignment script.\n');
    console.log('Run the script with:');
    console.log('  npm run assign-wallets -- --dry-run\n');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above before running the script.\n');
  }
}

/**
 * Main verification function
 */
async function main(): Promise<void> {
  console.log('\n🔍 Verifying setup for retroactive wallet assignment...\n');

  // Check environment variables
  checkEnvVar('WALLET_ENCRYPTION_SECRET', true);
  checkEnvVar('DB_HOST', true);
  checkEnvVar('DB_PORT', true);
  checkEnvVar('DB_NAME', true);
  checkEnvVar('DB_USER', true);
  checkEnvVar('DB_PASSWORD', true);
  checkEnvVar('APTOS_NETWORK', true);
  checkEnvVar('LOG_LEVEL', false);

  // Check database connection
  const dbConnected = await checkDatabaseConnection();

  // Check database schema (only if connected)
  if (dbConnected) {
    await checkDatabaseSchema();
  }

  // Check logs directory
  checkLogsDirectory();

  // Check script file
  checkScriptExists();

  // Check encryption
  checkEncryption();

  // Display results
  displayResults();

  // Close database connection
  await pool.end();

  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Run verification
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Verification failed with error:', error);
    logger.error('Verification script error', { error });
    process.exit(1);
  });
}

export { main };
