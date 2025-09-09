import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        userId: payload.userId,
      },
    });
  } catch (error) {
    console.error('Error verifying extension token:', error);
    return NextResponse.json(
      { error: 'Invalid token', valid: false },
      { status: 401 }
    );
  }
}
