import { NextRequest, NextResponse } from 'next/server';
import { rawQuery } from '@/lib/server/db/client';
import { logger } from '@/lib/server/utils/logger';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const userAuth = await requireAuth(request);

    // Check if requireAuth returned an error response
    if (userAuth instanceof NextResponse) {
      return userAuth;
    }

    // Get full user details
    const users = await rawQuery(
      'SELECT address, role, display_name, email, created_at FROM users WHERE address = $1',
      [userAuth.address]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found', message: 'User does not exist' },
        { status: 404 }
      );
    }

    const user = users[0];

    return NextResponse.json({
      success: true,
      data: {
        user: {
          address: user.address,
          role: user.role,
          displayName: user.display_name,
          email: user.email,
          createdAt: user.created_at,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Not authenticated' },
        { status: 401 }
      );
    }
    logger.error('Failed to get user info', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to get user info' },
      { status: 500 }
    );
  }
}