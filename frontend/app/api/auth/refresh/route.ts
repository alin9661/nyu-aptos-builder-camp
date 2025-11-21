import { NextResponse } from 'next/server';
import { rawQuery } from '@/lib/server/db/client';
import { logger } from '@/lib/server/utils/logger';
import { verifyRefreshToken, generateAccessToken } from '@/lib/server/utils/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Missing refresh token', message: 'Please provide a refresh token' },
        { status: 400 }
      );
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token', message: error instanceof Error ? error.message : 'Token verification failed' },
        { status: 401 }
      );
    }

    // Get current user role
    const users = await rawQuery(
      'SELECT address, role FROM users WHERE address = $1',
      [payload.address]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found', message: 'User no longer exists' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Generate new access token
    const accessToken = generateAccessToken(user.address, user.role);

    logger.info('Token refreshed', { address: user.address });

    return NextResponse.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    logger.error('Token refresh error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}