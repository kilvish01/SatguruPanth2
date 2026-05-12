import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AuthProvider } from './src/security/AuthContext';
import Navigation from './src/app/navigation/Navigation';
import { GOOGLE_SIGN_IN_CONFIG } from './src/config/googleSignIn.config';

// Configure native Google Sign-In once at app startup. `webClientId` is what
// makes the SDK return an idToken whose `aud` claim matches the backend's
// expected audience.
GoogleSignin.configure({
  webClientId: GOOGLE_SIGN_IN_CONFIG.WEB_CLIENT_ID,
  offlineAccess: false,
  scopes: ['email', 'profile'],
});

const ThemedApp: React.FC = () => {
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
      notification: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Navigation />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ThemedApp />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
