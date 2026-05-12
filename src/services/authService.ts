import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

const BASE = API_CONFIG.AWS_API_URL;

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
}

export interface GoogleSignInResult {
  token: string;
  expiresIn: number;
  user: AuthUser;
}

const post = async <T>(path: string, body: object): Promise<T> => {
  const res = await axios.post(`${BASE}${path}`, body, {
    timeout: API_CONFIG.TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
  });
  return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
};

const del = async <T>(path: string, token: string): Promise<T> => {
  const res = await axios.delete(`${BASE}${path}`, {
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
};

export const authService = {
  // Exchanges a Google ID token (from @react-native-google-signin) for our
  // own JWT + the user profile.
  signInWithGoogle: async (idToken: string): Promise<GoogleSignInResult> => {
    return post<GoogleSignInResult>('/api/auth/google', { idToken });
  },

  // Wipes the user's account and all per-user data (likes, etc.) from the
  // backend. Caller is responsible for clearing local secure storage and
  // signing the user out.
  deleteAccount: async (token: string): Promise<{ deleted: true; likesDeleted: number }> => {
    return del<{ deleted: true; likesDeleted: number }>('/api/me', token);
  },
};
