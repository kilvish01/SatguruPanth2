import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api.config';
import { secureGet, SecureKeys } from '../security/secureStorage';

// Module-local in-memory cache of the most recently observed token so we
// don't have to hit SecureStore on every request. AuthContext primes this
// via setApiAuthToken() on sign-in/sign-out and on app restore.
let currentToken: string | null = null;

export const setApiAuthToken = (token: string | null) => {
  currentToken = token;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.AWS_API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  let token = currentToken;
  if (!token) {
    // Fall back to SecureStore once. This covers race conditions during app
    // startup where a request fires before AuthContext finishes restoring.
    token = await secureGet(SecureKeys.AUTH_TOKEN);
    if (token) currentToken = token;
  }
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
