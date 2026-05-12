import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../security/AuthContext';
import { Text } from '../../components/ui/Text';
import { Screen } from '../../components/ui/Screen';
import { authService } from '../../services/authService';

const LoginPage = ({ navigation }: any) => {
  const { colors, spacing, radius } = useTheme();
  const { signIn } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(20);
  const formOpacity = useSharedValue(0);
  const formY = useSharedValue(40);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 600 });
    heroY.value = withSpring(0, { damping: 14, stiffness: 120 });
    formOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    formY.value = withDelay(200, withSpring(0, { damping: 14, stiffness: 120 }));
  }, [heroOpacity, heroY, formOpacity, formY]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));
  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formY.value }],
  }));

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result: any = await GoogleSignin.signIn();
      // Newer versions return `{ type, data: {...} }`; older ones return the
      // user object directly. Normalise to grab the idToken either way.
      const idToken: string | null =
        result?.data?.idToken ?? result?.idToken ?? null;
      if (!idToken) {
        throw new Error('Google did not return an idToken');
      }

      const session = await authService.signInWithGoogle(idToken);
      await signIn(session.token, {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || undefined,
        picture: session.user.picture || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      navigation.reset({ index: 0, routes: [{ name: 'bottomTabs' }] });
    } catch (err: any) {
      const code = err?.code;
      if (code === statusCodes.SIGN_IN_CANCELLED) {
        // User dismissed the chooser — silent no-op.
      } else if (code === statusCodes.IN_PROGRESS) {
        setError('Sign-in already in progress');
      } else if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services is required to sign in');
      } else {
        console.warn('Google sign-in failed:', err);
        setError(err?.message || 'Sign in failed. Please try again.');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={[styles.container, { padding: spacing.xl }]}>
        <Animated.View style={[styles.hero, heroStyle]}>
          <View style={[styles.logoWrap, { backgroundColor: colors.primaryMuted, borderRadius: radius.xxl }]}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
            />
          </View>
          <Text variant="h1" weight="bold" centered style={{ marginTop: spacing.lg }}>
            Satguru Panth
          </Text>
          <Text variant="body" subtle centered style={{ marginTop: spacing.xs, paddingHorizontal: spacing.xl }}>
            The path within. Sign in to save your favourite books and pick up where you left off.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.form, formStyle]}>
          <Pressable
            disabled={loading}
            onPress={handleGoogleSignIn}
            style={({ pressed }) => [
              styles.googleButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                paddingVertical: spacing.md,
                opacity: pressed || loading ? 0.7 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color={colors.text} />
                <Text variant="body" weight="semibold">
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          {error && (
            <Text variant="caption" color={colors.danger} centered style={{ marginTop: spacing.md }}>
              {error}
            </Text>
          )}

          <Text variant="caption" subtle centered style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
            By continuing, you agree to our terms and acknowledge our privacy policy. We only use your Google name and email to identify your account.
          </Text>
        </Animated.View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
  form: {
    marginBottom: 60,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
  },
});

export default LoginPage;
