// Re-export all schema types and validation schemas
export * from '../schema';

// Re-export extension-specific interfaces
export * from './extension';

// Re-export database types
export * from './database';

// Re-export API types
export * from './api';

// User type (managed by Clerk)
export interface User {
  id: string; // Clerk user ID
  email: string;
  createdAt: Date;
  lastLoginAt: Date;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
