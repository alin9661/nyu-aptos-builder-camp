import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { rawQuery } from '@/lib/server/db/client';
import { logger } from '@/lib/server/utils/logger';
import { generateTokenPair } from '@/lib/server/utils/jwt';
import {
  verifyWalletSignature,
  validateLoginMessage,
  parseLoginMessage,
  isValidAptosAddress,
  SignatureVerificationRequest,
} from '@/lib/server/utils/wallet';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      address,
      message,
      signature,
      publicKey,
    }: SignatureVerificationRequest = body;

    // Validate inputs
    if (!address || !message || !signature || !publicKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields', message: 'Please provide address, message, signature, and publicKey' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!isValidAptosAddress(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid address', message: 'Please provide a valid Aptos address' },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    // Get and validate nonce from KV store
    let storedNonce: string | undefined;
    try {
      const stored = await kv.get<string>(`nonce:${normalizedAddress}`);
      if (stored) {
        const data = JSON.parse(stored);
        storedNonce = data.nonce;
      }
    } catch (kvError) {
      logger.warn('Failed to retrieve nonce from KV', { address, error: kvError });
      // Continue without nonce validation (nonce is in the message)
    }

    // Validate message structure and extract nonce
    const parsedMessage = parseLoginMessage(message);
    if (!validateLoginMessage(message, storedNonce)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message', message: 'Login message is invalid, expired, or nonce mismatch' },
        { status: 400 }
      );
    }

    // Verify signature using official Aptos signature verification
    const isValid = await verifyWalletSignature({
      address,
      message,
      signature,
      publicKey,
      nonce: parsedMessage.nonce,
    });

    if (!isValid) {
      logger.warn('Invalid signature attempt', { address });
      return NextResponse.json(
        { success: false, error: 'Invalid signature', message: 'Signature verification failed' },
        { status: 401 }
      );
    }

    // Delete used nonce from KV (prevent replay attacks)
    try {
      await kv.del(`nonce:${normalizedAddress}`);
    } catch (kvError) {
      logger.warn('Failed to delete nonce from KV', { address, error: kvError });
    }

    // Get or create user
    let users = await rawQuery(
      'SELECT address, role, display_name, email FROM users WHERE address = $1',
      [address]
    );

    let user;
    if (users.length === 0) {
      // Create new user with 'member' role
      await rawQuery(
        'INSERT INTO users (address, role) VALUES ($1, $2)',
        [address, 'member']
      );

      user = {
        address,
        role: 'member',
        display_name: null,
        email: null,
      };

      logger.info('New user registered', { address });
    } else {
      user = users[0];
      logger.info('User logged in', { address, role: user.role });
    }

    // Generate JWT tokens
    const tokens = generateTokenPair(user.address, user.role);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          address: user.address,
          role: user.role,
          displayName: user.display_name,
          email: user.email,
        },
        ...tokens,
      },
    });
  } catch (error) {
    logger.error('Login error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to authenticate' },
      { status: 500 }
    );
  }
}