import { supabase } from './client';
import { supabaseAdmin } from './server';

export interface UploadResult {
  url: string;
  path: string;
  fullPath: string;
}

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'screenshots';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): void {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file type. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`
      );
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(
        `File too large. Maximum size: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
  }

  /**
   * Generate a unique file path for a user's screenshot
   */
  private static generateFilePath(
    clerkUserId: string,
    filename: string
  ): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = filename.split('.').pop();
    return `${clerkUserId}/${timestamp}-${randomSuffix}.${extension}`;
  }

  /**
   * Upload a screenshot file to Supabase storage
   */
  static async uploadScreenshot(
    file: File,
    clerkUserId: string,
    originalFilename?: string
  ): Promise<UploadResult> {
    this.validateFile(file);

    const filename = originalFilename || file.name;
    const filePath = this.generateFilePath(clerkUserId, filename);

    const { data, error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload screenshot: ${error.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
      fullPath: data.path,
    };
  }

  /**
   * Upload screenshot from blob (for extension use)
   */
  static async uploadScreenshotBlob(
    blob: Blob,
    clerkUserId: string,
    filename: string = 'screenshot.png'
  ): Promise<UploadResult> {
    // Convert blob to file
    const file = new File([blob], filename, { type: blob.type || 'image/png' });
    return this.uploadScreenshot(file, clerkUserId, filename);
  }

  /**
   * Delete a screenshot file from storage
   */
  static async deleteScreenshot(filePath: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete screenshot: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for private access (if needed)
   */
  static async getSignedUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(filePath: string): string {
    const { data } = supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Create thumbnail from image file
   */
  static async createThumbnail(
    file: File,
    maxWidth: number = 300,
    maxHeight: number = 200,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload both full image and thumbnail
   */
  static async uploadScreenshotWithThumbnail(
    file: File,
    clerkUserId: string,
    originalFilename?: string
  ): Promise<{ main: UploadResult; thumbnail: UploadResult }> {
    // Upload main image
    const mainUpload = await this.uploadScreenshot(
      file,
      clerkUserId,
      originalFilename
    );

    // Create and upload thumbnail
    const thumbnailBlob = await this.createThumbnail(file);
    const thumbnailFilename = `thumb_${originalFilename || file.name}`;
    const thumbnailUpload = await this.uploadScreenshotBlob(
      thumbnailBlob,
      clerkUserId,
      thumbnailFilename
    );

    return {
      main: mainUpload,
      thumbnail: thumbnailUpload,
    };
  }

  /**
   * List all files for a user (admin function)
   */
  static async listUserFiles(clerkUserId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin.storage
      .from(this.BUCKET_NAME)
      .list(clerkUserId);

    if (error) {
      throw new Error(`Failed to list user files: ${error.message}`);
    }

    return data || [];
  }
}
