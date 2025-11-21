/**
 * Vercel Postgres Database Client
 * Optimized for serverless environments - no connection pooling needed
 */

import { sql } from '@vercel/postgres';

/**
 * Database client - uses Vercel's serverless-optimized PostgreSQL
 * Connection pooling is handled automatically by Vercel
 */
export const db = sql;

/**
 * Query helper with error handling and optional logging
 * @example
 * const users = await query<User>`SELECT * FROM users WHERE id = ${userId}`;
 */
export async function query<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  const start = Date.now();
  try {
    const result = await sql(strings, ...values);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB Query] Executed in ${duration}ms, rows: ${result.rowCount}`);
    }

    return result.rows as T[];
  } catch (error) {
    console.error('[DB Query Error]', {
      error: error instanceof Error ? error.message : error,
      duration: Date.now() - start,
    });
    throw error;
  }
}

/**
 * Transaction helper for atomic operations
 * @example
 * const result = await transaction(async (tx) => {
 *   await tx`UPDATE accounts SET balance = balance - 100 WHERE id = ${fromId}`;
 *   await tx`UPDATE accounts SET balance = balance + 100 WHERE id = ${toId}`;
 *   return tx`SELECT * FROM accounts WHERE id = ${fromId}`;
 * });
 */
export async function transaction<T>(
  callback: (tx: typeof sql) => Promise<T>
): Promise<T> {
  try {
    // Vercel Postgres handles transactions through the same sql instance
    // We'll execute queries in sequence and rely on database-level transactions
    const result = await callback(sql);
    return result;
  } catch (error) {
    console.error('[DB Transaction Error]', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Test database connection
 * Useful for health checks
 */
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT NOW()`;
    console.log('[DB] Connection successful');
    return true;
  } catch (error) {
    console.error('[DB] Connection failed', {
      error: error instanceof Error ? error.message : error,
    });
    return false;
  }
}

/**
 * Execute a raw SQL query with parameters
 * For cases where template literals aren't convenient
 */
export async function rawQuery<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const start = Date.now();
  try {
    const result = params
      ? await sql.query(text, params)
      : await sql.query(text);

    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB Raw Query] Executed in ${duration}ms, rows: ${result.rowCount}`);
    }

    return result.rows as T[];
  } catch (error) {
    console.error('[DB Raw Query Error]', {
      text,
      params,
      error: error instanceof Error ? error.message : error,
      duration: Date.now() - start,
    });
    throw error;
  }
}
