/**
 * API Interface definitions for the Peekberry webapp
 * These interfaces define the contracts for all API services
 */

import type {
  User,
  Screenshot,
  ScreenshotMetadata,
  UserStats,
  ElementContext,
  DOMMutation,
} from './index';

// Auth API Interface
export interface AuthAPI {
  getCurrentUser(): Promise<User>;
  signOut(): Promise<void>;
  getAuthToken(): Promise<string>;
  validateToken(token: string): Promise<boolean>;
  refreshToken(): Promise<string>;
}

// Screenshot API Interface
export interface ScreenshotAPI {
  uploadScreenshot(
    file: File,
    metadata: ScreenshotMetadata
  ): Promise<Screenshot>;
  getScreenshots(userId: string): Promise<Screenshot[]>;
  getScreenshot(id: string): Promise<Screenshot>;
  deleteScreenshot(id: string): Promise<void>;
  downloadScreenshot(id: string): Promise<Blob>;
  updateScreenshotMetadata(
    id: string,
    metadata: Partial<ScreenshotMetadata>
  ): Promise<Screenshot>;
}

// Analytics API Interface
export interface AnalyticsAPI {
  getUserStats(userId: string): Promise<UserStats>;
  incrementEditCount(userId: string): Promise<UserStats>;
  incrementScreenshotCount(userId: string): Promise<UserStats>;
  resetMonthlyStats(userId: string): Promise<UserStats>;
  getActivityHistory(userId: string, days?: number): Promise<ActivityEntry[]>;
}

// AI Processing API Interface
export interface AIAPI {
  processEditCommand(
    command: string,
    context: ElementContext
  ): Promise<DOMMutation>;
  validateCommand(command: string): Promise<CommandValidation>;
  getSuggestions(context: ElementContext): Promise<string[]>;
}

// Supporting types for API interfaces
export interface ActivityEntry {
  date: string;
  edits: number;
  screenshots: number;
}

export interface CommandValidation {
  isValid: boolean;
  confidence: number;
  suggestions?: string[];
  errors?: string[];
}

// Component Props Interfaces for React components
export interface DashboardProps {
  user: User;
  stats: UserStats;
  screenshots: Screenshot[];
  loading?: boolean;
  error?: string;
}

export interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  onDelete: (id: string) => void;
  onDownload: (screenshot: Screenshot) => void;
  onView: (screenshot: Screenshot) => void;
  loading?: boolean;
  error?: string;
}

export interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  error?: string;
  onClick?: () => void;
}

export interface ScreenshotCardProps {
  screenshot: Screenshot;
  onDelete: (id: string) => void;
  onDownload: (screenshot: Screenshot) => void;
  onView: (screenshot: Screenshot) => void;
  loading?: boolean;
}

export interface UserProfileProps {
  user: User;
  onUpdate: (user: Partial<User>) => void;
  onSignOut: () => void;
  loading?: boolean;
}

// Form Props Interfaces
export interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface SignUpFormProps {
  onSubmit: (email: string, password: string, name: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

// Hook Return Types
export interface UseScreenshotsReturn {
  screenshots: Screenshot[];
  loading: boolean;
  error: string | null;
  uploadScreenshot: (file: File, metadata: ScreenshotMetadata) => Promise<void>;
  deleteScreenshot: (id: string) => Promise<void>;
  downloadScreenshot: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface UseUserStatsReturn {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  incrementEdits: () => Promise<void>;
  incrementScreenshots: () => Promise<void>;
  refetch: () => Promise<void>;
}

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAuthToken: () => Promise<string>;
}

// API Client Configuration
export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

// API Client Interface
export interface APIClient {
  get<T>(endpoint: string, config?: RequestInit): Promise<T>;
  post<T>(endpoint: string, data?: unknown, config?: RequestInit): Promise<T>;
  put<T>(endpoint: string, data?: unknown, config?: RequestInit): Promise<T>;
  delete<T>(endpoint: string, config?: RequestInit): Promise<T>;
  upload<T>(endpoint: string, file: File, metadata?: unknown): Promise<T>;
}
