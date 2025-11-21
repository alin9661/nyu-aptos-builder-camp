import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/server/utils/logger';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    const userAuth = await requireAuth(request);

    // Check if requireAuth returned an error response
    if (userAuth instanceof NextResponse) {
      return userAuth;
    }

    // In a stateless JWT system, logout is primarily client-side
    // The client should delete the tokens

    logger.info('User logged out', { address: userAuth.address });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Not authenticated' },
        { status: 401 }
      );
    }
    logger.error('Logout error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to logout' },
      { status: 500 }
    );
  }
}