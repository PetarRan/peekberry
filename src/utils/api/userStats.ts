import type { SupabaseClient } from '@supabase/supabase-js';
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
   * Get user statistics by clerk user ID
   */
  static async getUserStats(
    supabase: SupabaseClient,
    clerkUserId: string
  ): Promise<UserStats | null> {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No stats record exists yet, create one
        return this.createUserStats(supabase, clerkUserId);
      }
      throw new Error(`Failed to fetch user stats: ${error.message}`);
    }

    return transformUserStatsFromDB(data as UserStatsRow);
  }

  /**
   * Create initial user statistics record
   */
  static async createUserStats(
    supabase: SupabaseClient,
    clerkUserId: string
  ): Promise<UserStats> {
    const initialStats: UserStatsInsert = {
      clerk_user_id: clerkUserId,
      edits_this_month: 0,
      screenshots_this_month: 0,
      total_edits: 0,
      total_screenshots: 0,
    };

    const { data, error } = await supabase
      .from('user_stats')
      .insert(initialStats)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user stats: ${error.message}`);
    }

    return transformUserStatsFromDB(data as UserStatsRow);
  }

  /**
   * Increment edit count using database function
   */
  static async incrementEditCount(
    supabase: SupabaseClient,
    clerkUserId: string
  ): Promise<UserStats> {
    const { data, error } = await supabase
      .rpc('increment_edit_count', { user_id: clerkUserId })
      .single();

    if (error) {
      throw new Error(`Failed to increment edit count: ${error.message}`);
    }

    return transformUserStatsFromDB(data as UserStatsRow);
  }

  /**
   * Increment screenshot count using database function
   */
  static async incrementScreenshotCount(
    supabase: SupabaseClient,
    clerkUserId: string
  ): Promise<UserStats> {
    const { data, error } = await supabase
      .rpc('increment_screenshot_count', { user_id: clerkUserId })
      .single();

    if (error) {
      throw new Error(`Failed to increment screenshot count: ${error.message}`);
    }

    return transformUserStatsFromDB(data as UserStatsRow);
  }

  /**
   * Update user statistics manually
   */
  static async updateUserStats(
    supabase: SupabaseClient,
    clerkUserId: string,
    updates: Partial<UserStatsUpdate>
  ): Promise<UserStats> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_stats')
      .update(updateData)
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user stats: ${error.message}`);
    }

    return transformUserStatsFromDB(data as UserStatsRow);
  }

  /**
   * Reset monthly statistics (typically called at the beginning of each month)
   */
  static async resetMonthlyStats(
    supabase: SupabaseClient,
    clerkUserId: string
  ): Promise<UserStats> {
    const updates: Partial<UserStatsUpdate> = {
      edits_this_month: 0,
      screenshots_this_month: 0,
    };

    return this.updateUserStats(supabase, clerkUserId, updates);
  }

  /**
   * Get all user statistics (admin function)
   */
  static async getAllUserStats(
    supabase: SupabaseClient,
    page: number = 1,
    limit: number = 50
  ): Promise<{ stats: UserStats[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from('user_stats')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count user stats: ${countError.message}`);
    }

    // Get paginated data
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .order('total_screenshots', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch user stats: ${error.message}`);
    }

    const stats = data.map(transformUserStatsFromDB);
    const total = count || 0;
    const hasMore = offset + limit < total;

    return { stats, total, hasMore };
  }

  /**
   * Delete user statistics (for user account deletion)
   */
  static async deleteUserStats(
    supabase: SupabaseClient,
    clerkUserId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_stats')
      .delete()
      .eq('clerk_user_id', clerkUserId);

    if (error) {
      throw new Error(`Failed to delete user stats: ${error.message}`);
    }
  }
}
