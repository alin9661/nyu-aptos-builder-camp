import { NextResponse } from 'next/server';
import { rawQuery } from '@/lib/server/db/client';
import { logger } from '@/lib/server/utils/logger';
import { generateTokenPair } from '@/lib/server/utils/jwt';
import { WalletService } from '@/lib/server/services/walletService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { auth0_id, email } = body;

    // Validate auth0_id
    if (!auth0_id || typeof auth0_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing required field', message: 'Please provide auth0_id' },
        { status: 400 }
      );
    }

    // Look up user by Auth0 ID
    let users = await rawQuery(
      'SELECT address, role, display_name, email FROM users WHERE sso_id = $1 AND sso_provider = $2',
      [auth0_id, 'google']
    );

    let user;
    let isNewUser = false;

    if (users.length === 0) {
      // Auto-register new user with Aptos wallet
      logger.info('SSO login - creating new user', { auth0_id, email });

      try {
        const walletResult = await WalletService.createWalletForUser(
          auth0_id,
          'google',
          email
        );

        logger.info('SSO login - new user created successfully', {
          auth0_id,
          address: walletResult.address,
          email: walletResult.email,
        });

        // Fetch the newly created user
        users = await rawQuery(
          'SELECT address, role, display_name, email FROM users WHERE sso_id = $1 AND sso_provider = $2',
          [auth0_id, 'google']
        );

        if (users.length === 0) {
          throw new Error('Failed to retrieve newly created user');
        }

        user = users[0];
        isNewUser = true;
      } catch (walletError) {
        logger.error('SSO login - failed to create user', {
          auth0_id,
          email,
          error: walletError,
        });

        return NextResponse.json(
          { success: false, error: 'Registration failed', message: 'Failed to create user account and wallet' },
          { status: 500 }
        );
      }
    } else {
      user = users[0];

      // Optional: Verify email matches if provided (only for existing users)
      if (email && user.email && user.email !== email) {
        logger.warn('SSO login - email mismatch', {
          auth0_id,
          providedEmail: email,
          storedEmail: user.email
        });
        return NextResponse.json(
          { success: false, error: 'Email mismatch', message: 'Email does not match user record' },
          { status: 400 }
        );
      }
    }

    // Generate JWT tokens
    const tokens = generateTokenPair(user.address, user.role);

    logger.info('SSO user logged in', {
      address: user.address,
      role: user.role,
      email: user.email,
      isNewUser,
    });

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
        isNewUser,
      },
    });
  } catch (error) {
    logger.error('SSO login error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to authenticate with SSO' },
      { status: 500 }
    );
  }
}