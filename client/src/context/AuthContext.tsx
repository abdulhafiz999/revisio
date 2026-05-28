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
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'revisio_auth_token';
const USER_KEY = 'revisio_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage first (email/password login)
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoading(false);
        return;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    // Check if we're on the reset password page - if so, don't auto-login
    const isResetPasswordPage = window.location.pathname.includes('/reset-password');

    // Listen for Supabase OAuth session (Google sign-in callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Only auto-login if it's NOT on the reset password page
      if (session?.user && !isResetPasswordPage) {
        const oauthUser = { id: session.user.id, email: session.user.email || '' };
        localStorage.setItem(TOKEN_KEY, session.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(oauthUser));
        setUser(oauthUser);
      }
      setIsLoading(false);
    });

    // Subscribe to auth state changes (handles OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Don't auto-login on reset password page - let ResetPassword component handle it
      if (window.location.pathname.includes('/reset-password')) {
        return;
      }

      if (session?.user) {
        const oauthUser = { id: session.user.id, email: session.user.email || '' };
        localStorage.setItem(TOKEN_KEY, session.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(oauthUser));
        setUser(oauthUser);
      } else if (!session) {
        // Only clear if not already set via email/password
        const existingToken = localStorage.getItem(TOKEN_KEY);
        if (!existingToken) {
          setUser(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (user: User, token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    supabase.auth.signOut();
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
