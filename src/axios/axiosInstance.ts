import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_CONFIG } from '../config/api.config';
import { secureGet, secureDelete, SecureKeys } from '../security/secureStorage';

const APP_VERSION = (Constants.expoConfig as any)?.version || '1.0.0';

const axiosInstance = axios.create({
  baseURL: API_CONFIG.AWS_API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Platform': Platform.OS,
    'X-Client-Version': APP_VERSION,
  },
});

axiosInstance.interceptors.request.use(
  async (request) => {
    try {
      const token = await secureGet(SecureKeys.AUTH_TOKEN);
      if (token && request.headers) {
        request.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // proceed without token
    }
    if (__DEV__) {
      console.log(`[API] ${request.method?.toUpperCase()} ${request.url}`);
    }
    return request;
  },
  (error) => Promise.reject(error)
);

interface RetryConfig extends AxiosRequestConfig {
  __retryCount?: number;
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;

    if (error.response?.status === 401) {
      await secureDelete(SecureKeys.AUTH_TOKEN);
      await secureDelete(SecureKeys.REFRESH_TOKEN);
      return Promise.reject(error);
    }

    if (
      config &&
      (!error.response || error.response.status >= 500) &&
      (config.__retryCount ?? 0) < (API_CONFIG.RETRY_ATTEMPTS - 1)
    ) {
      config.__retryCount = (config.__retryCount ?? 0) + 1;
      const delay = Math.min(1000 * Math.pow(2, config.__retryCount), 8000);
      await new Promise((r) => setTimeout(r, delay));
      return axiosInstance(config);
    }

    return Promise.reject(error);
  }
);

export const getUser = async () => {
  const { data } = await axiosInstance.get('/user');
  return data;
};

export const getNewReleasedBooks = async () => {
  const { data } = await axiosInstance.get('/books/getNewReleasedBooks');
  return data;
};

export default axiosInstance;
