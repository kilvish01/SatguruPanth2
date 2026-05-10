import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { secureGet, secureSet, secureDelete, SecureKeys } from './secureStorage';

export interface UserProfile {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  city?: string;
  pinCode?: string;
  avatar?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (token: string, profile: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const [storedToken, storedProfile] = await Promise.all([
          secureGet(SecureKeys.AUTH_TOKEN),
          secureGet(SecureKeys.USER_PROFILE),
        ]);
        if (storedToken && storedProfile) {
          setToken(storedToken);
          setUser(JSON.parse(storedProfile));
        }
      } catch {
        // ignored: treat as unauthenticated
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const signIn = useCallback(async (newToken: string, profile: UserProfile) => {
    await Promise.all([
      secureSet(SecureKeys.AUTH_TOKEN, newToken),
      secureSet(SecureKeys.USER_PROFILE, JSON.stringify(profile)),
    ]);
    setToken(newToken);
    setUser(profile);
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([
      secureDelete(SecureKeys.AUTH_TOKEN),
      secureDelete(SecureKeys.REFRESH_TOKEN),
      secureDelete(SecureKeys.USER_PROFILE),
    ]);
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return;
      const next = { ...user, ...updates };
      await secureSet(SecureKeys.USER_PROFILE, JSON.stringify(next));
      setUser(next);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
