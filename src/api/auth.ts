import { currentUser } from '@clerk/nextjs';

export interface AuthAPI {
  getCurrentUser(): Promise<any>;
  getAuthToken(): Promise<string>;
}

export const authAPI: AuthAPI = {
  async getCurrentUser() {
    return await currentUser();
  },

  async getAuthToken() {
    // This will be implemented when we create the API endpoint
    const response = await fetch('/api/auth/token');
    const data = await response.json();
    return data.token;
  },
};
