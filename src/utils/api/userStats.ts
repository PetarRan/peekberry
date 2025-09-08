import { supabaseAdmin } from '@/utils/supabase/server';
import type {
  UserStatsRow,
  UserStatsInsert,
  UserStatsUpdate,
} from '@/types/database';
import {
  transformUserStatsFromDB,
  transformUserStatsToDB,
} from '@/types/database';
import type { UserStats } from '@/schema';

export class UserStatsService {
  /**
   * Get user statistics by Clerk user ID
   */
  static async getUserStats(clerkUserId: string): Promise<UserStats | null> {
    const { data, error } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch user stats: ${error.message}`);
    }

    return transformUserStatsFromDB(data);
  }

  /**
   * Create initial user statistics record
   */
  static async createUserStats(clerkUserId: string): Promise<UserStats> {
    const insertData: UserStatsInsert = {
      clerk_user_id: clerkUserId,
      edits_this_month: 0,
      screenshots_this_month: 0,
      total_edits: 0,
      total_screenshots: 0,
    };

    const { data, error } = await supabaseAdmin
      .from('user_stats')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user stats: ${error.message}`);
    }

    return transformUserStatsFromDB(data);
  }

  /**
   * Get or create user statistics (ensures stats exist)
   */
  static async getOrCreateUserStats(clerkUserId: string): Promise<UserStats> {
    let stats = await this.getUserStats(clerkUserId);

    if (!stats) {
      stats = await this.createUserStats(clerkUserId);
    }

    return stats;
  }

  /**
   * Increment edit count for a user
   */
  static async incrementEditCount(clerkUserId: string): Promise<UserStats> {
    // First ensure user stats exist
    await this.getOrCreateUserStats(clerkUserId);

    // Use RPC function for atomic increment
    const { data, error } = await supabaseAdmin.rpc('increment_edit_count', {
      user_id: clerkUserId,
    });

    if (error) {
      // Fallback to manual increment if RPC doesn't exist
      const currentStats = await this.getUserStats(clerkUserId);
      if (!currentStats) {
        throw new Error('User stats not found');
      }

      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('user_stats')
        .update({
          edits_this_month: currentStats.editsThisMonth + 1,
          total_edits: currentStats.totalEdits + 1,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', clerkUserId)
        .select()
        .single();

      if (updateError) {
        throw new Error(
          `Failed to increment edit count: ${updateError.message}`
        );
      }

      return transformUserStatsFromDB(updateData);
    }

    return transformUserStatsFromDB(data);
  }

  /**
   * Increment screenshot count for a user
   */
  static async incrementScreenshotCount(
    clerkUserId: string
  ): Promise<UserStats> {
    // First ensure user stats exist
    await this.getOrCreateUserStats(clerkUserId);

    // Use RPC function for atomic increment
    const { data, error } = await supabaseAdmin.rpc(
      'increment_screenshot_count',
      {
        user_id: clerkUserId,
      }
    );

    if (error) {
      // Fallback to manual increment if RPC doesn't exist
      const currentStats = await this.getUserStats(clerkUserId);
      if (!currentStats) {
        throw new Error('User stats not found');
      }

      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('user_stats')
        .update({
          screenshots_this_month: currentStats.screenshotsThisMonth + 1,
          total_screenshots: currentStats.totalScreenshots + 1,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', clerkUserId)
        .select()
        .single();

      if (updateError) {
        throw new Error(
          `Failed to increment screenshot count: ${updateError.message}`
        );
      }

      return transformUserStatsFromDB(updateData);
    }

    return transformUserStatsFromDB(data);
  }

  /**
   * Reset monthly counters (typically called at the beginning of each month)
   */
  static async resetMonthlyCounters(clerkUserId: string): Promise<UserStats> {
    const { data, error } = await supabaseAdmin
      .from('user_stats')
      .update({
        edits_this_month: 0,
        screenshots_this_month: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reset monthly counters: ${error.message}`);
    }

    return transformUserStatsFromDB(data);
  }

  /**
   * Update user activity timestamp
   */
  static async updateLastActivity(clerkUserId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_stats')
      .update({
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', clerkUserId);

    if (error) {
      throw new Error(`Failed to update last activity: ${error.message}`);
    }
  }

  /**
   * Get user statistics for multiple users (admin function)
   */
  static async getAllUserStats(limit: number = 100): Promise<UserStats[]> {
    const { data, error } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .order('last_activity', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch all user stats: ${error.message}`);
    }

    return data.map(transformUserStatsFromDB);
  }
}
