// Client-side stats API
import type { UserStats } from '@/schema';
import { UserStatsService } from '@/utils/api/userStats';
import { supabase } from '@/utils/supabase/client';

export interface StatsAPI {
  getUserStats(clerkUserId: string): Promise<UserStats>;
  incrementEditCount(clerkUserId: string): Promise<UserStats>;
  incrementScreenshotCount(clerkUserId: string): Promise<UserStats>;
}

export const statsAPI: StatsAPI = {
  async getUserStats(clerkUserId: string): Promise<UserStats> {
    const stats = await UserStatsService.getUserStats(supabase, clerkUserId);

    if (!stats) {
      // Create initial stats if none exist
      return await UserStatsService.createUserStats(supabase, clerkUserId);
    }

    return stats;
  },

  async incrementEditCount(clerkUserId: string): Promise<UserStats> {
    return await UserStatsService.incrementEditCount(supabase, clerkUserId);
  },

  async incrementScreenshotCount(clerkUserId: string): Promise<UserStats> {
    return await UserStatsService.incrementScreenshotCount(
      supabase,
      clerkUserId
    );
  },
};
