import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user stats from database
    // Note: RLS policies should handle user isolation, but we filter by clerk_user_id as well
    const { data: userStats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found"
      console.error('Error fetching user stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    // If no stats exist, create default stats
    if (!userStats) {
      const { data: newStats, error: insertError } = await supabase
        .from('user_stats')
        .insert({
          clerk_user_id: userId,
          edits_this_month: 0,
          screenshots_this_month: 0,
          total_edits: 0,
          total_screenshots: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user stats:', insertError);
        return NextResponse.json(
          { error: 'Failed to create stats' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        editsThisMonth: newStats.edits_this_month,
        screenshotsThisMonth: newStats.screenshots_this_month,
        totalEdits: newStats.total_edits,
        totalScreenshots: newStats.total_screenshots,
        lastActivity: newStats.last_activity,
      });
    }

    return NextResponse.json({
      editsThisMonth: userStats.edits_this_month,
      screenshotsThisMonth: userStats.screenshots_this_month,
      totalEdits: userStats.total_edits,
      totalScreenshots: userStats.total_screenshots,
      lastActivity: userStats.last_activity,
    });
  } catch (error) {
    console.error('Error in stats API:', error);
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
    const { type } = body; // 'edit' or 'screenshot'

    if (!type || !['edit', 'screenshot'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const supabase = await createClient();

    // First, get current stats or create if doesn't exist
    let { data: currentStats, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching current stats:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch current stats' },
        { status: 500 }
      );
    }

    // If no stats exist, create default stats
    if (!currentStats) {
      const { data: newStats, error: insertError } = await supabase
        .from('user_stats')
        .insert({
          clerk_user_id: userId,
          edits_this_month: type === 'edit' ? 1 : 0,
          screenshots_this_month: type === 'screenshot' ? 1 : 0,
          total_edits: type === 'edit' ? 1 : 0,
          total_screenshots: type === 'screenshot' ? 1 : 0,
          last_activity: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user stats:', insertError);
        return NextResponse.json(
          { error: 'Failed to create stats' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        editsThisMonth: newStats.edits_this_month,
        screenshotsThisMonth: newStats.screenshots_this_month,
        totalEdits: newStats.total_edits,
        totalScreenshots: newStats.total_screenshots,
        lastActivity: newStats.last_activity,
      });
    }

    // Update existing stats
    const updatedStats = {
      edits_this_month:
        type === 'edit'
          ? currentStats.edits_this_month + 1
          : currentStats.edits_this_month,
      screenshots_this_month:
        type === 'screenshot'
          ? currentStats.screenshots_this_month + 1
          : currentStats.screenshots_this_month,
      total_edits:
        type === 'edit'
          ? currentStats.total_edits + 1
          : currentStats.total_edits,
      total_screenshots:
        type === 'screenshot'
          ? currentStats.total_screenshots + 1
          : currentStats.total_screenshots,
      last_activity: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_stats')
      .update(updatedStats)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user stats:', error);
      return NextResponse.json(
        { error: 'Failed to update stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      editsThisMonth: data.edits_this_month,
      screenshotsThisMonth: data.screenshots_this_month,
      totalEdits: data.total_edits,
      totalScreenshots: data.total_screenshots,
      lastActivity: data.last_activity,
    });
  } catch (error) {
    console.error('Error in stats update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
