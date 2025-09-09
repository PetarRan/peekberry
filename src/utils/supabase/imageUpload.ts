import { supabase } from './client';

export interface UploadResult {
  url: string;
  path: string;
  fullPath: string;
}

export class ImageUploadService {
  // Note: This service is currently not used in the MVP
  // Image upload functionality will be implemented when needed
  // TODO: Implement proper image upload with server-side Supabase client

  private static readonly BUCKET_NAME = 'screenshots';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  /**
   * Placeholder method - to be implemented when needed
   */
  static async uploadScreenshot(
    file: File,
    clerkUserId: string,
    originalFilename?: string
  ): Promise<UploadResult> {
    throw new Error('Image upload not yet implemented in MVP');
  }
}
