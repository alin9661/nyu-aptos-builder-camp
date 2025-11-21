import { NextRequest, NextResponse } from 'next/server';
import { rawQuery } from '@/lib/server/db/client';
import { logger } from '@/lib/server/utils/logger';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function PUT(request: NextRequest) {
  try {
    const userAuth = await requireAuth(request);

    // Check if requireAuth returned an error response
    if (userAuth instanceof NextResponse) {
      return userAuth;
    }
    const body = await request.json();
    const { displayName, email } = body;

    // Validate inputs
    if (!displayName && !email) {
      return NextResponse.json(
        { success: false, error: 'Bad request', message: 'Please provide displayName or email to update' },
        { status: 400 }
      );
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (displayName) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(displayName);
    }

    if (email) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email', message: 'Please provide a valid email address' },
          { status: 400 }
        );
      }
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }

    values.push(userAuth.address);

    // Update user
    await rawQuery(
      `UPDATE users SET ${updates.join(', ')} WHERE address = $${paramIndex}`,
      values
    );

    // Get updated user
    const users = await rawQuery(
      'SELECT address, role, display_name, email FROM users WHERE address = $1',
      [userAuth.address]
    );

    logger.info('User profile updated', { address: userAuth.address });

    return NextResponse.json({
      success: true,
      data: {
        user: users[0],
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Not authenticated' },
        { status: 401 }
      );
    }
    logger.error('Failed to update profile', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}