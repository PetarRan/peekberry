import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAuthToken, validateAuthToken } from '@/utils/auth';

/**
 * Generate an auth token for the Chrome extension
 * This endpoint creates a JWT token that the extension can use to authenticate API requests
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const token = createAuthToken(user.id, email);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Error generating auth token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate an existing auth token
 */
export async function GET(request: NextRequest) {
  try {
    const validation = validateAuthToken(request);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 401 });
    }

    // For token validation, we don't need to verify against Clerk
    // since the token contains the user info and expiration
    return NextResponse.json({
      valid: true,
      userId: validation.tokenData!.userId,
      email: validation.tokenData!.email,
    });
  } catch (error) {
    console.error('Error validating auth token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
