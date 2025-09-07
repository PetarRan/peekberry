import { Screenshot, ScreenshotMetadata } from '@/types';

export interface ScreenshotAPI {
  uploadScreenshot(
    file: File,
    metadata: ScreenshotMetadata
  ): Promise<Screenshot>;
  getScreenshots(userId: string): Promise<Screenshot[]>;
  deleteScreenshot(id: string): Promise<void>;
}

export const screenshotAPI: ScreenshotAPI = {
  async uploadScreenshot(
    file: File,
    metadata: ScreenshotMetadata
  ): Promise<Screenshot> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch('/api/screenshots/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload screenshot');
    }

    return response.json();
  },

  async getScreenshots(userId: string): Promise<Screenshot[]> {
    const response = await fetch(`/api/screenshots?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch screenshots');
    }

    return response.json();
  },

  async deleteScreenshot(id: string): Promise<void> {
    const response = await fetch(`/api/screenshots/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete screenshot');
    }
  },
};
