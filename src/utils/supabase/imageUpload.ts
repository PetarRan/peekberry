import { supabase } from './client';
import { createClient } from '@supabase/supabase-js';

export interface UploadResult {
  url: string;
  path: string;
  fullPath: string;
}

export interface ThumbnailResult {
  url: string;
  path: string;
}

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'screenshots';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  private static readonly THUMBNAIL_WIDTH = 300;
  private static readonly THUMBNAIL_HEIGHT = 200;

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(
        `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds maximum allowed size of ${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB`
      );
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `File type ${file.type} is not allowed. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`
      );
    }
  }

  /**
   * Generate unique filename with timestamp
   */
  private static generateFilename(
    originalFilename: string,
    clerkUserId: string
  ): string {
    const timestamp = Date.now();
    const extension = originalFilename.split('.').pop() || 'png';
    const sanitizedName = originalFilename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);

    return `${clerkUserId}/${timestamp}_${sanitizedName}.${extension}`;
  }

  /**
   * Create thumbnail from image file
   */
  private static async createThumbnail(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate thumbnail dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let thumbWidth = this.THUMBNAIL_WIDTH;
        let thumbHeight = this.THUMBNAIL_HEIGHT;

        if (aspectRatio > thumbWidth / thumbHeight) {
          thumbHeight = thumbWidth / aspectRatio;
        } else {
          thumbWidth = thumbHeight * aspectRatio;
        }

        canvas.width = thumbWidth;
        canvas.height = thumbHeight;

        // Draw resized image
        ctx?.drawImage(img, 0, 0, thumbWidth, thumbHeight);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const thumbnailFile = new File([blob], `thumb_${file.name}`, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(thumbnailFile);
            } else {
              reject(new Error('Failed to create thumbnail'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () =>
        reject(new Error('Failed to load image for thumbnail'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload screenshot file to Supabase storage
   */
  static async uploadScreenshot(
    file: File,
    clerkUserId: string,
    originalFilename?: string
  ): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const filename = this.generateFilename(
        originalFilename || file.name,
        clerkUserId
      );
      const filePath = `${clerkUserId}/${filename}`;

      // Upload main image
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath,
        fullPath: data.path,
      };
    } catch (error) {
      console.error('Screenshot upload error:', error);
      throw error;
    }
  }

  /**
   * Upload thumbnail for screenshot
   */
  static async uploadThumbnail(
    originalFile: File,
    clerkUserId: string,
    originalFilename?: string
  ): Promise<ThumbnailResult> {
    try {
      // Create thumbnail
      const thumbnailFile = await this.createThumbnail(originalFile);

      // Generate thumbnail filename
      const baseFilename = originalFilename || originalFile.name;
      const timestamp = Date.now();
      const extension = 'jpg';
      const sanitizedName = baseFilename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 50);

      const thumbnailFilename = `${clerkUserId}/thumbnails/${timestamp}_thumb_${sanitizedName}.${extension}`;

      // Upload thumbnail
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(thumbnailFilename, thumbnailFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Thumbnail upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(thumbnailFilename);

      return {
        url: urlData.publicUrl,
        path: thumbnailFilename,
      };
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      throw error;
    }
  }

  /**
   * Delete screenshot and thumbnail from storage
   */
  static async deleteScreenshot(
    filePath: string,
    thumbnailPath?: string
  ): Promise<void> {
    try {
      const filesToDelete = [filePath];
      if (thumbnailPath) {
        filesToDelete.push(thumbnailPath);
      }

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filesToDelete);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Screenshot delete error:', error);
      throw error;
    }
  }

  /**
   * Get image dimensions from file
   */
  static async getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    // Check if we're on the server side
    if (typeof window === 'undefined') {
      // Server-side: use sharp
      const sharp = require('sharp');
      
      try {
        const buffer = await file.arrayBuffer();
        const metadata = await sharp(Buffer.from(buffer)).metadata();
        
        return {
          width: metadata.width || 0,
          height: metadata.height || 0,
        };
      } catch (error) {
        throw new Error('Failed to get image dimensions');
      }
    } else {
      // Client-side: use Image element
      return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
          URL.revokeObjectURL(img.src);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
          URL.revokeObjectURL(img.src);
        };
        
        img.src = URL.createObjectURL(file);
      });
    }
  }
}
