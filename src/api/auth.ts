import { currentUser } from '@clerk/nextjs/server';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl?: string;
  createdAt?: number;
  lastSignInAt?: number | null;
}

export interface AuthTokenResponse {
  token: string;
  user: User;
}

export interface SessionResponse {
  authenticated: boolean;
  session?: {
    id: string;
    userId: string;
    email: string;
    lastSignInAt: number | null;
  };
  user?: User;
  error?: string;
}

export interface AuthAPI {
  getCurrentUser(): Promise<User | null>;
  generateAuthToken(): Promise<AuthTokenResponse>;
  validateToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    email?: string;
    error?: string;
  }>;
  validateSession(): Promise<SessionResponse>;
  getUserProfile(): Promise<{ user: User }>;
}

export const authAPI: AuthAPI = {
  async getCurrentUser() {
    try {
      const user = await currentUser();
      if (!user) return null;

      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async generateAuthToken(): Promise<AuthTokenResponse> {
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate auth token');
    }

    return await response.json();
  },

  async validateToken(token: string) {
    const response = await fetch('/api/auth/token', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { valid: false, error: error.error };
    }

    const data = await response.json();
    return { valid: data.valid, userId: data.userId, email: data.email };
  },

  async validateSession(): Promise<SessionResponse> {
    try {
      const response = await fetch('/api/auth/session');
      return await response.json();
    } catch (error) {
      console.error('Error validating session:', error);
      return { authenticated: false, error: 'Network error' };
    }
  },

  async getUserProfile() {
    const response = await fetch('/api/auth/profile');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user profile');
    }

    return await response.json();
  },
};
