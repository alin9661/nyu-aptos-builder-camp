import { NextResponse } from 'next/server';
import { rawQuery } from '@/lib/server/db/client';
import { logger } from '@/lib/server/utils/logger';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/server/utils/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = extractTokenFromHeader(request.headers.get('authorization')) || body.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token', message: 'Please provide a token' },
        { status: 400 }
      );
    }

    try {
      const payload = verifyAccessToken(token);

      // Verify user still exists
      const users = await rawQuery(
        'SELECT address, role FROM users WHERE address = $1',
        [payload.address]
      );

      if (users.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid token', message: 'User not found' },
          { status: 401 }
        );
      }

      const user = users[0];

      // Check if role matches
      if (user.role !== payload.role) {
        return NextResponse.json(
          { success: false, error: 'Invalid token', message: 'User role has changed' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          valid: true,
          user: {
            address: user.address,
            role: user.role,
          },
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token', message: error instanceof Error ? error.message : 'Token verification failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error('Token verification error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to verify token' },
      { status: 500 }
    );
  }
}