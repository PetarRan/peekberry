import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

async function verifyExtensionToken(
  request: NextRequest
): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyExtensionToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement screenshot retrieval logic
    // For now, return empty array
    return NextResponse.json({
      success: true,
      data: {
        screenshots: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          hasMore: false,
          totalPages: 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyExtensionToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement screenshot upload logic
    const body = await request.json();

    return NextResponse.json({
      success: true,
      data: {
        id: 'temp-id',
        message: 'Screenshot upload endpoint ready',
      },
    });
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
