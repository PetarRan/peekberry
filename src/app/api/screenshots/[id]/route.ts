import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: screenshot, error } = await supabase
      .from('screenshots')
      .select('*')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Screenshot not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching screenshot:', error);
      return NextResponse.json(
        { error: 'Failed to fetch screenshot' },
        { status: 500 }
      );
    }

    return NextResponse.json(screenshot);
  } catch (error) {
    console.error('Error in screenshot GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('screenshots')
      .delete()
      .eq('id', id)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('Error deleting screenshot:', error);
      return NextResponse.json(
        { error: 'Failed to delete screenshot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in screenshot DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
