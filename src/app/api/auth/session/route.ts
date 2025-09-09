import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate user session and return session information
 * This endpoint can be used by the extension to check if the user is still authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, sessionId } = await auth();

    if (!userId || !sessionId) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'No active session',
        },
        { status: 401 }
      );
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        id: sessionId,
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        lastSignInAt: user.lastSignInAt,
      },
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Error validating session:', error);
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
