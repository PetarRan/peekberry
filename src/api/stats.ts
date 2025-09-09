// Client-side stats API

export interface UserStats {
  editsThisMonth: number;
  screenshotsThisMonth: number;
  totalEdits: number;
  totalScreenshots: number;
  lastActivity: string;
}

export interface StatsAPI {
  getUserStats(): Promise<UserStats>;
  incrementEditCount(): Promise<UserStats>;
  incrementScreenshotCount(): Promise<UserStats>;
}

export const statsAPI: StatsAPI = {
  async getUserStats(): Promise<UserStats> {
    const response = await fetch('/api/stats');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user stats');
    }

    return await response.json();
  },

  async incrementEditCount(): Promise<UserStats> {
    const response = await fetch('/api/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'edit' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to increment edit count');
    }

    return await response.json();
  },

  async incrementScreenshotCount(): Promise<UserStats> {
    const response = await fetch('/api/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'screenshot' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to increment screenshot count');
    }

    return await response.json();
  },
};
