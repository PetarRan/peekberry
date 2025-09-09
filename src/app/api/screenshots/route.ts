import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // Get total count
    const { count, error: countError } = await supabase
      .from('screenshots')
      .select('*', { count: 'exact', head: true })
      .eq('clerk_user_id', userId);

    if (countError) {
      console.error('Error counting screenshots:', countError);
      return NextResponse.json(
        { error: 'Failed to count screenshots' },
        { status: 500 }
      );
    }

    // Get paginated screenshots
    const { data: screenshots, error } = await supabase
      .from('screenshots')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching screenshots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch screenshots' },
        { status: 500 }
      );
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    return NextResponse.json({
      screenshots: screenshots || [],
      pagination: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in screenshots API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      filename,
      url,
      thumbnailUrl,
      pageUrl,
      pageTitle,
      editCount,
      width,
      height,
      fileSize,
    } = body;

    if (!filename || !url || !pageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('screenshots')
      .insert({
        clerk_user_id: userId,
        filename,
        url,
        thumbnail_url: thumbnailUrl,
        page_url: pageUrl,
        page_title: pageTitle || '',
        edit_count: editCount || 0,
        width: width || null,
        height: height || null,
        file_size: fileSize || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating screenshot:', error);
      return NextResponse.json(
        { error: 'Failed to create screenshot' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in screenshot creation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
