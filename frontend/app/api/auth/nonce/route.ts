import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { generateNonce, createLoginMessage, isValidAptosAddress } from '@/lib/server/utils/wallet';
import { logger } from '@/lib/server/utils/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address } = body;

    // Validate address
    if (!address || !isValidAptosAddress(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid address', message: 'Please provide a valid Aptos address' },
        { status: 400 }
      );
    }

    // Generate nonce
    const nonce = generateNonce();
    const timestamp = Date.now();

    // Store nonce in Vercel KV with 5-minute expiration
    const normalizedAddress = address.toLowerCase();
    try {
      await kv.set(
        `nonce:${normalizedAddress}`,
        JSON.stringify({ nonce, timestamp }),
        { ex: 300 } // 5 minutes expiration
      );
    } catch (kvError) {
      logger.warn('Failed to store nonce in KV, falling back to response only', { address, error: kvError });
      // Continue without storing - client will include nonce in signed message
    }

    // Create login message following Aptos signing standard
    const message = createLoginMessage(address, nonce);

    logger.info('Nonce generated', { address });

    return NextResponse.json({
      success: true,
      data: {
        nonce,
        message,
        address,
      },
    });
  } catch (error) {
    logger.error('Failed to generate nonce', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}