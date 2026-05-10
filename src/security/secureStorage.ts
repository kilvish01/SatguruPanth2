import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: false,
};

const isSecureAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export const secureSet = async (key: string, value: string): Promise<void> => {
  if (await isSecureAvailable()) {
    await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
  } else {
    await AsyncStorage.setItem(`@secure_${key}`, value);
  }
};

export const secureGet = async (key: string): Promise<string | null> => {
  if (await isSecureAvailable()) {
    return SecureStore.getItemAsync(key, SECURE_OPTIONS);
  }
  return AsyncStorage.getItem(`@secure_${key}`);
};

export const secureDelete = async (key: string): Promise<void> => {
  if (await isSecureAvailable()) {
    await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
  } else {
    await AsyncStorage.removeItem(`@secure_${key}`);
  }
};

export const SecureKeys = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  APP_PIN: 'app_pin',
} as const;
