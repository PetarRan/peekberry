import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ScreenshotRow,
  ScreenshotInsert,
  ScreenshotUpdate,
} from '@/types/database';
import {
  transformScreenshotFromDB,
  transformScreenshotToDB,
} from '@/types/database';
import type { Screenshot } from '@/schema';

export class ScreenshotService {
  /**
   * Get all screenshots for a user
   */
  static async getScreenshotsByUserId(
    supabase: SupabaseClient,
    clerkUserId: string
  ): Promise<Screenshot[]> {
    const { data, error } = await supabase
      .from('screenshots')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch screenshots: ${error.message}`);
    }

    return data.map(transformScreenshotFromDB);
  }

  /**
   * Get a single screenshot by ID
   */
  static async getScreenshotById(
    supabase: SupabaseClient,
    id: string,
    clerkUserId: string
  ): Promise<Screenshot | null> {
    const { data, error } = await supabase
      .from('screenshots')
      .select('*')
      .eq('id', id)
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch screenshot: ${error.message}`);
    }

    return transformScreenshotFromDB(data);
  }

  /**
   * Create a new screenshot record
   */
  static async createScreenshot(
    supabase: SupabaseClient,
    screenshot: Omit<Screenshot, 'id' | 'createdAt'>
  ): Promise<Screenshot> {
    const insertData = transformScreenshotToDB(screenshot);

    const { data, error } = await supabase
      .from('screenshots')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create screenshot: ${error.message}`);
    }

    return transformScreenshotFromDB(data);
  }

  /**
   * Update a screenshot record
   */
  static async updateScreenshot(
    supabase: SupabaseClient,
    id: string,
    clerkUserId: string,
    updates: Partial<ScreenshotUpdate>
  ): Promise<Screenshot> {
    const { data, error } = await supabase
      .from('screenshots')
      .update(updates)
      .eq('id', id)
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update screenshot: ${error.message}`);
    }

    return transformScreenshotFromDB(data);
  }

  /**
   * Delete a screenshot record
   */
  static async deleteScreenshot(
    supabase: SupabaseClient,
    id: string,
    clerkUserId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('screenshots')
      .delete()
      .eq('id', id)
      .eq('clerk_user_id', clerkUserId);

    if (error) {
      throw new Error(`Failed to delete screenshot: ${error.message}`);
    }
  }

  /**
   * Get screenshots with pagination
   */
  static async getScreenshotsPaginated(
    supabase: SupabaseClient,
    clerkUserId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ screenshots: Screenshot[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from('screenshots')
      .select('*', { count: 'exact', head: true })
      .eq('clerk_user_id', clerkUserId);

    if (countError) {
      throw new Error(`Failed to count screenshots: ${countError.message}`);
    }

    // Get paginated data
    const { data, error } = await supabase
      .from('screenshots')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch screenshots: ${error.message}`);
    }

    const screenshots = data.map(transformScreenshotFromDB);
    const total = count || 0;
    const hasMore = offset + limit < total;

    return { screenshots, total, hasMore };
  }
}
