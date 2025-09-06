import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { AuthState } from "../../types/user";
import {
  setAuthState as persistAuthState,
  clearAuthState,
  getAuthState,
} from "../utils/messaging";

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setDevUser: (user: any) => void; // DEV ONLY
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Check for development user first (DEV ONLY)
        const devUser = localStorage.getItem("peekberry-dev-user");
        if (devUser) {
          const user = JSON.parse(devUser);
          setAuthState({
            user,
            loading: false,
            error: null,
          });
          return;
        }

        // First check Chrome storage for persisted auth state
        const storedAuthState = await getAuthState();

        if (storedAuthState?.user) {
          setAuthState({
            user: storedAuthState.user,
            loading: false,
            error: null,
          });
        } else {
          // Fallback to Supabase session
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (error) throw error;

          const newAuthState = {
            user: session?.user
              ? {
                  id: session.user.id,
                  email: session.user.email || "",
                  authenticated: true,
                  sessionToken: session.access_token,
                }
              : null,
            loading: false,
            error: null,
          };

          setAuthState(newAuthState);

          // Persist to Chrome storage
          if (newAuthState.user) {
            await persistAuthState(newAuthState);
          }
        }
      } catch (error) {
        setAuthState({
          user: null,
          loading: false,
          error:
            error instanceof Error ? error.message : "Authentication error",
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newAuthState = {
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email || "",
              authenticated: true,
              sessionToken: session.access_token,
            }
          : null,
        loading: false,
        error: null,
      };

      setAuthState(newAuthState);

      // Persist to Chrome storage
      if (newAuthState.user) {
        await persistAuthState(newAuthState);
      } else {
        await clearAuthState();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      }));
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;

      if (data.url) {
        // Open OAuth URL in a popup window
        const popup = window.open(
          data.url,
          "google-oauth",
          "width=500,height=600,scrollbars=yes,resizable=yes"
        );

        // Monitor the popup for completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Reset loading state - session should be handled by Supabase
            setAuthState((prev) => ({ ...prev, loading: false }));
            console.log("OAuth popup closed");
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          if (popup && !popup.closed) {
            popup.close();
            clearInterval(checkClosed);
            setAuthState((prev) => ({
              ...prev,
              loading: false,
              error: "Authentication timeout",
            }));
          }
        }, 300000);
      }
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Google sign in failed",
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      // Clear development user (DEV ONLY)
      localStorage.removeItem("peekberry-dev-user");

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear Chrome storage
      await clearAuthState();
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      }));
      throw error;
    }
  };

  const setDevUser = (user: any) => {
    // DEV ONLY - directly set auth state
    localStorage.setItem("peekberry-dev-user", JSON.stringify(user));
    setAuthState({
      user,
      loading: false,
      error: null,
    });
  };

  const value: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    setDevUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
