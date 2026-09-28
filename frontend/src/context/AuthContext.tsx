import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, signInWithGoogle as supabaseSignIn, signOut as supabaseSignOut } from '../services/supabase';
import { API_BASE } from '../services/api';

export interface AuthUser {
  id: string;
  supabase_user_id?: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'OWNER' | 'MEMBER' | string;
  status: string;
  leaderboard_opt_in?: boolean;
  strava_athlete_id?: string;
  strava_connected: boolean;
  club_id?: string;
  club_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  disconnectStrava: () => Promise<void>;
  clearError: () => void;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (authToken: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const userData: AuthUser = await res.json();
        setUser(userData);
        return userData;
      } else {
        logger_warn('Failed to fetch user profile from backend: HTTP', res.status);
      }
    } catch (err: any) {
      console.warn('Backend /api/auth/me request error:', err.message);
    }
    return null;
  };

  const initAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured()) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const accessToken = data.session.access_token;
          setToken(accessToken);
          localStorage.setItem('cycleclub_auth_token', accessToken);
          await fetchUserProfile(accessToken);
        }
      } else {
        // Fallback: check localStorage for saved dev/demo token
        const savedToken = localStorage.getItem('cycleclub_auth_token');
        if (savedToken) {
          setToken(savedToken);
          await fetchUserProfile(savedToken);
        }
      }
    } catch (err: any) {
      console.error('Session restoration error:', err);
      setError(err.message || 'Failed to restore session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    if (isSupabaseConfigured()) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          const accessToken = session.access_token;
          setToken(accessToken);
          localStorage.setItem('cycleclub_auth_token', accessToken);
          await fetchUserProfile(accessToken);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setToken(null);
          localStorage.removeItem('cycleclub_auth_token');
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await supabaseSignIn();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
      throw err;
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setLoading(true);
    try {
      await supabaseSignOut();
      setUser(null);
      setToken(null);
    } catch (err: any) {
      setError(err.message || 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  const disconnectStrava = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/strava/disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to disconnect Strava');
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect Strava');
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        signInWithGoogle,
        signOut: handleSignOut,
        refreshUser,
        disconnectStrava,
        clearError,
        isConfigured: isSupabaseConfigured()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function logger_warn(...args: any[]) {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
}
