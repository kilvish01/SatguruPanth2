import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { secureGet, secureSet, secureDelete, SecureKeys } from './secureStorage';
import { setApiAuthToken } from '../services/apiClient';
import { authService } from '../services/authService';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  // Legacy fields kept for backward compatibility with older UI that read them.
  phone?: string;
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
  deleteAccount: () => Promise<{ likesDeleted: number }>;
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
          setApiAuthToken(storedToken);
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
    setApiAuthToken(newToken);
  }, []);

  const signOut = useCallback(async () => {
    // Best-effort native sign-out so the OS-level Google account chooser
    // shows up again on the next sign-in.
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignored — native SDK may be uninitialized in dev contexts
    }
    await Promise.all([
      secureDelete(SecureKeys.AUTH_TOKEN),
      secureDelete(SecureKeys.REFRESH_TOKEN),
      secureDelete(SecureKeys.USER_PROFILE),
    ]);
    setToken(null);
    setUser(null);
    setApiAuthToken(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!token) {
      throw new Error('Not signed in');
    }
    const result = await authService.deleteAccount(token);
    // Locally clear everything once the server confirms deletion. We don't
    // want stale credentials lingering if the user re-installs the app.
    try {
      await GoogleSignin.revokeAccess();
    } catch {
      // ignored
    }
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignored
    }
    await Promise.all([
      secureDelete(SecureKeys.AUTH_TOKEN),
      secureDelete(SecureKeys.REFRESH_TOKEN),
      secureDelete(SecureKeys.USER_PROFILE),
    ]);
    setToken(null);
    setUser(null);
    setApiAuthToken(null);
    return { likesDeleted: result.likesDeleted };
  }, [token]);

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
        deleteAccount,
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
