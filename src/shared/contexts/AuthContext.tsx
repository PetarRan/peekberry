import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../config/supabase'
import { AuthState } from '../../types/user'
import { setAuthState as persistAuthState, clearAuthState, getAuthState } from '../utils/messaging'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // First check Chrome storage for persisted auth state
        const storedAuthState = await getAuthState()
        
        if (storedAuthState?.user) {
          setAuthState({
            user: storedAuthState.user,
            loading: false,
            error: null
          })
        } else {
          // Fallback to Supabase session
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) throw error
          
          const newAuthState = {
            user: session?.user ? {
              id: session.user.id,
              email: session.user.email || '',
              authenticated: true,
              sessionToken: session.access_token
            } : null,
            loading: false,
            error: null
          }
          
          setAuthState(newAuthState)
          
          // Persist to Chrome storage
          if (newAuthState.user) {
            await persistAuthState(newAuthState)
          }
        }
      } catch (error) {
        setAuthState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication error'
        })
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const newAuthState = {
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email || '',
            authenticated: true,
            sessionToken: session.access_token
          } : null,
          loading: false,
          error: null
        }
        
        setAuthState(newAuthState)
        
        // Persist to Chrome storage
        if (newAuthState.user) {
          await persistAuthState(newAuthState)
        } else {
          await clearAuthState()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      }))
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      }))
      throw error
    }
  }

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear Chrome storage
      await clearAuthState()
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      }))
      throw error
    }
  }

  const value: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}