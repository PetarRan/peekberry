// Import the application types
import type { Screenshot, UserStats } from '../schema';

// Database types for Supabase integration
// These types match the database schema defined in the design document

export interface Database {
  public: {
    Tables: {
      screenshots: {
        Row: {
          id: string;
          clerk_user_id: string;
          filename: string;
          url: string;
          thumbnail_url: string | null;
          page_url: string;
          page_title: string | null;
          edit_count: number;
          width: number | null;
          height: number | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          filename: string;
          url: string;
          thumbnail_url?: string | null;
          page_url: string;
          page_title?: string | null;
          edit_count?: number;
          width?: number | null;
          height?: number | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          filename?: string;
          url?: string;
          thumbnail_url?: string | null;
          page_url?: string;
          page_title?: string | null;
          edit_count?: number;
          width?: number | null;
          height?: number | null;
          file_size?: number | null;
          created_at?: string;
        };
      };
      user_stats: {
        Row: {
          clerk_user_id: string;
          edits_this_month: number;
          screenshots_this_month: number;
          total_edits: number;
          total_screenshots: number;
          last_activity: string;
          updated_at: string;
        };
        Insert: {
          clerk_user_id: string;
          edits_this_month?: number;
          screenshots_this_month?: number;
          total_edits?: number;
          total_screenshots?: number;
          last_activity?: string;
          updated_at?: string;
        };
        Update: {
          clerk_user_id?: string;
          edits_this_month?: number;
          screenshots_this_month?: number;
          total_edits?: number;
          total_screenshots?: number;
          last_activity?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for database operations
export type ScreenshotRow = Database['public']['Tables']['screenshots']['Row'];
export type ScreenshotInsert =
  Database['public']['Tables']['screenshots']['Insert'];
export type ScreenshotUpdate =
  Database['public']['Tables']['screenshots']['Update'];

export type UserStatsRow = Database['public']['Tables']['user_stats']['Row'];
export type UserStatsInsert =
  Database['public']['Tables']['user_stats']['Insert'];
export type UserStatsUpdate =
  Database['public']['Tables']['user_stats']['Update'];

// Transformation functions to convert between database rows and application types
export const transformScreenshotFromDB = (row: ScreenshotRow): Screenshot => ({
  id: row.id,
  clerkUserId: row.clerk_user_id,
  filename: row.filename,
  url: row.url,
  thumbnailUrl: row.thumbnail_url || undefined,
  metadata: {
    pageUrl: row.page_url,
    pageTitle: row.page_title || '',
    editCount: row.edit_count,
    dimensions: {
      width: row.width || 0,
      height: row.height || 0,
    },
  },
  createdAt: new Date(row.created_at),
  size: row.file_size || 0,
});

export const transformScreenshotToDB = (
  screenshot: Omit<Screenshot, 'id' | 'createdAt'>
): ScreenshotInsert => ({
  clerk_user_id: screenshot.clerkUserId,
  filename: screenshot.filename,
  url: screenshot.url,
  thumbnail_url: screenshot.thumbnailUrl || null,
  page_url: screenshot.metadata.pageUrl,
  page_title: screenshot.metadata.pageTitle,
  edit_count: screenshot.metadata.editCount,
  width: screenshot.metadata.dimensions.width,
  height: screenshot.metadata.dimensions.height,
  file_size: screenshot.size,
});

export const transformUserStatsFromDB = (row: UserStatsRow): UserStats => ({
  clerkUserId: row.clerk_user_id,
  editsThisMonth: row.edits_this_month,
  screenshotsThisMonth: row.screenshots_this_month,
  totalEdits: row.total_edits,
  totalScreenshots: row.total_screenshots,
  lastActivity: new Date(row.last_activity),
});

export const transformUserStatsToDB = (
  stats: Omit<UserStats, 'lastActivity'>
): UserStatsInsert => ({
  clerk_user_id: stats.clerkUserId,
  edits_this_month: stats.editsThisMonth,
  screenshots_this_month: stats.screenshotsThisMonth,
  total_edits: stats.totalEdits,
  total_screenshots: stats.totalScreenshots,
});
