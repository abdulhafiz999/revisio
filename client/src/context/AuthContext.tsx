import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'revisio_auth_token';
const REFRESH_TOKEN_KEY = 'revisio_refresh_token';
const USER_KEY = 'revisio_user';
const SESSION_EXPIRY_KEY = 'revisio_session_expiry';

// 14 days in milliseconds
const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

/** Persist session data to localStorage with a 14-day expiry */
function persistSession(user: User, token: string, refreshToken?: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_EXPIRY_KEY, String(expiresAt));
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/** Clear all session data from localStorage */
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
}

/** Check if the stored session is still within the 14-day window */
function isSessionValid(): boolean {
  const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
  if (!expiryStr) return false;
  return Date.now() < parseInt(expiryStr, 10);
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // ── 1. Check for stored email/password session ─────────────────────────
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (token && storedUser && isSessionValid()) {
        try {
          const parsedUser = JSON.parse(storedUser) as User;

          // If we have a refresh token, try to silently refresh the access token
          // so the user never gets a 401 mid-session
          if (refreshToken) {
            const { data, error } = await supabase.auth.refreshSession({
              refresh_token: refreshToken,
            });
            if (!error && data.session) {
              // Update stored token with the fresh one, keep 14-day window alive
              persistSession(parsedUser, data.session.access_token, data.session.refresh_token);
              setUser(parsedUser);
              setIsLoading(false);
              return;
            }
          }

          // No refresh token (or refresh failed) — still restore session if within 14 days
          setUser(parsedUser);
          setIsLoading(false);
          return;
        } catch {
          clearSession();
        }
      }

      // ── 2. Check for OAuth (Google) session via Supabase ───────────────────
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const oauthUser = { id: session.user.id, email: session.user.email || '' };
        persistSession(oauthUser, session.access_token, session.refresh_token);
        setUser(oauthUser);

        // Redirect recovery links to the reset-password page
        if (
          window.location.hash.includes('type=recovery') &&
          window.location.pathname !== '/reset-password'
        ) {
          window.location.href = '/reset-password';
          return;
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // ── 3. Subscribe to Supabase auth state changes (OAuth callbacks) ────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        const oauthUser = { id: session.user.id, email: session.user.email || '' };
        persistSession(oauthUser, session.access_token, session.refresh_token);
        setUser(oauthUser);
        if (window.location.pathname !== '/reset-password') {
          window.location.href = '/reset-password';
        }
        return;
      }

      if (session?.user) {
        const oauthUser = { id: session.user.id, email: session.user.email || '' };
        persistSession(oauthUser, session.access_token, session.refresh_token);
        setUser(oauthUser);
      } else if (!session) {
        // Only clear if there's no stored email/password session active
        if (!isSessionValid()) {
          clearSession();
          setUser(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (user: User, token: string, refreshToken?: string) => {
    persistSession(user, token, refreshToken);
    setUser(user);
  };

  const logout = async () => {
    clearSession();
    setUser(null);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Supabase signOut error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
