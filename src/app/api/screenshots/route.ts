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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;

    if (!file || !metadataStr) {
      return NextResponse.json(
        { error: 'Missing file or metadata' },
        { status: 400 }
      );
    }

    // Parse metadata
    let metadata;
    try {
      metadata = JSON.parse(metadataStr);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid metadata format' },
        { status: 400 }
      );
    }

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Import the screenshots API
    const { screenshotsAPI } = await import('@/api/screenshots');

    // Upload screenshot
    const screenshot = await screenshotsAPI.uploadScreenshot(
      file,
      metadata,
      userId
    );

    return NextResponse.json({
      success: true,
      data: screenshot,
    });
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
