// Client-side screenshots API

export interface Screenshot {
  id: string;
  clerkUserId: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  pageUrl: string;
  pageTitle: string;
  editCount: number;
  width?: number;
  height?: number;
  fileSize?: number;
  createdAt: string;
}

export interface ScreenshotCreateData {
  filename: string;
  url: string;
  thumbnailUrl?: string;
  pageUrl: string;
  pageTitle?: string;
  editCount?: number;
  width?: number;
  height?: number;
  fileSize?: number;
}

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
    page?: number,
    limit?: number
  ): Promise<ScreenshotListResponse>;
  getScreenshot(id: string): Promise<Screenshot>;
  createScreenshot(data: ScreenshotCreateData): Promise<Screenshot>;
  deleteScreenshot(id: string): Promise<void>;
}

export const screenshotsAPI: ScreenshotsAPI = {
  async getScreenshots(page = 1, limit = 20): Promise<ScreenshotListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`/api/screenshots?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch screenshots');
    }

    return await response.json();
  },

  async getScreenshot(id: string): Promise<Screenshot> {
    const response = await fetch(`/api/screenshots/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch screenshot');
    }

    return await response.json();
  },

  async createScreenshot(data: ScreenshotCreateData): Promise<Screenshot> {
    const response = await fetch('/api/screenshots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create screenshot');
    }

    return await response.json();
  },

  async deleteScreenshot(id: string): Promise<void> {
    const response = await fetch(`/api/screenshots/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete screenshot');
    }
  },
};
