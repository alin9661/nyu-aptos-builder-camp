/**
 * Health Check API Route
 * Example of a simple Next.js API route for Vercel serverless
 *
 * Endpoint: GET /api/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/server/db/client';

export async function GET(req: NextRequest) {
  try {
    // Test database connection
    const dbHealthy = await testConnection();

    // Return health status
    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbHealthy ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error('[Health Check] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
