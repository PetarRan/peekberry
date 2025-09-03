// User and authentication type definitions

export interface UserSession {
  id: string;
  email: string;
  authenticated: boolean;
  sessionToken: string;
}

export interface AuthState {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
}
