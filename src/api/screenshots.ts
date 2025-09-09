// Client-side screenshots API
import type { Screenshot, ScreenshotMetadata } from '@/schema';

// Re-export types for components
export type { Screenshot, ScreenshotMetadata };
import { ImageUploadService } from '@/utils/supabase/imageUpload';
import { ScreenshotService } from '@/utils/api/screenshots';
import { UserStatsService } from '@/utils/api/userStats';
import { supabase } from '@/utils/supabase/client';

export interface ScreenshotListResponse {
  screenshots: Screenshot[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

export interface ScreenshotsAPI {
  getScreenshots(
    clerkUserId: string,
    page?: number,
    limit?: number
  ): Promise<ScreenshotListResponse>;
  getScreenshot(id: string, clerkUserId: string): Promise<Screenshot>;
  uploadScreenshot(
    file: File,
    metadata: ScreenshotMetadata,
    clerkUserId: string
  ): Promise<Screenshot>;
  deleteScreenshot(id: string, clerkUserId: string): Promise<void>;
}

export const screenshotsAPI: ScreenshotsAPI = {
  async getScreenshots(
    clerkUserId: string,
    page = 1,
    limit = 20
  ): Promise<ScreenshotListResponse> {
    const result = await ScreenshotService.getScreenshotsPaginated(
      supabase,
      clerkUserId,
      page,
      limit
    );

    return {
      screenshots: result.screenshots,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
        hasMore: result.hasMore,
      },
    };
  },

  async getScreenshot(id: string, clerkUserId: string): Promise<Screenshot> {
    const screenshot = await ScreenshotService.getScreenshotById(
      supabase,
      id,
      clerkUserId
    );

    if (!screenshot) {
      throw new Error('Screenshot not found');
    }

    return screenshot;
  },

  async uploadScreenshot(
    file: File,
    metadata: ScreenshotMetadata,
    clerkUserId: string
  ): Promise<Screenshot> {
    try {
      // Get image dimensions
      const dimensions = await ImageUploadService.getImageDimensions(file);

      // Upload main image
      const uploadResult = await ImageUploadService.uploadScreenshot(
        file,
        clerkUserId,
        file.name
      );

      // Upload thumbnail
      const thumbnailResult = await ImageUploadService.uploadThumbnail(
        file,
        clerkUserId,
        file.name
      );

      // Create screenshot record in database
      const screenshot = await ScreenshotService.createScreenshot(supabase, {
        clerkUserId,
        filename: file.name,
        url: uploadResult.url,
        thumbnailUrl: thumbnailResult.url,
        metadata: {
          ...metadata,
          dimensions,
        },
        size: file.size,
      });

      // Update user statistics
      await UserStatsService.incrementScreenshotCount(supabase, clerkUserId);

      return screenshot;
    } catch (error) {
      console.error('Screenshot upload error:', error);
      throw error;
    }
  },

  async deleteScreenshot(id: string, clerkUserId: string): Promise<void> {
    try {
      // Get screenshot to find file paths before deletion
      const screenshot = await ScreenshotService.getScreenshotById(
        supabase,
        id,
        clerkUserId
      );

      if (!screenshot) {
        throw new Error('Screenshot not found');
      }

      // Delete from database first
      await ScreenshotService.deleteScreenshot(supabase, id, clerkUserId);

      // Extract file paths from URLs for storage deletion
      try {
        const mainFilePath = screenshot.url.split('/').slice(-2).join('/'); // Get user_id/filename
        const thumbnailPath = screenshot.thumbnailUrl
          ? screenshot.thumbnailUrl.split('/').slice(-3).join('/') // Get user_id/thumbnails/filename
          : undefined;

        // Delete files from storage
        await ImageUploadService.deleteScreenshot(mainFilePath, thumbnailPath);
      } catch (storageError) {
        // Log storage deletion error but don't fail the request since DB deletion succeeded
        console.error('Storage deletion error:', storageError);
      }
    } catch (error) {
      console.error('Screenshot deletion error:', error);
      throw error;
    }
  },
};
