import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometryType?: 'fingerprint' | 'face' | 'iris' | 'unknown';
}

export const getBiometryType = async (): Promise<BiometricResult['biometryType']> => {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
  return 'unknown';
};

export const isBiometricAvailable = async (): Promise<boolean> => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  return LocalAuthentication.isEnrolledAsync();
};

export const authenticateWithBiometric = async (
  promptMessage: string = 'Authenticate to continue'
): Promise<BiometricResult> => {
  const available = await isBiometricAvailable();
  if (!available) {
    return { success: false, error: 'Biometric authentication unavailable' };
  }

  const biometryType = await getBiometryType();

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use PIN',
    });

    if (result.success) {
      return { success: true, biometryType };
    }
    return { success: false, error: 'Authentication cancelled or failed', biometryType };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unknown error', biometryType };
  }
};
