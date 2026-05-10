import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../security/AuthContext';
import { Text } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { validatePhone, validateOtp } from '../../security/validation';

type Step = 'phone' | 'otp';

const LoginPage = ({ navigation }: any) => {
  const { colors, spacing, radius, fontFamily } = useTheme();
  const { signIn } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const phoneRef = useRef<TextInput>(null);
  const otpRefs = useRef<Array<TextInput | null>>([]);

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

  useEffect(() => {
    if (step === 'phone') {
      const t = setTimeout(() => phoneRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
    if (step === 'otp') {
      const t = setTimeout(() => otpRefs.current[0]?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [step]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formY.value }],
  }));

  const handlePhoneChange = (text: string) => {
    setError(null);
    setPhone(text.replace(/\D/g, '').slice(0, 10));
  };

  const handleSendOtp = async () => {
    const v = validatePhone(phone);
    if (!v.valid) {
      setError(v.error!);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 600);
  };

  const handleOtpChange = (index: number, value: string) => {
    setError(null);
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    const v = validateOtp(code);
    if (!v.valid) {
      setError(v.error!);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    setLoading(true);
    try {
      const fakeToken = `dev_${phone}_${Date.now()}`;
      await signIn(fakeToken, {
        id: phone,
        phone: `+91${phone}`,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      navigation.reset({ index: 0, routes: [{ name: 'bottomTabs' }] });
    } catch (e: any) {
      setError(e?.message || 'Login failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.selectionAsync().catch(() => {});
    setOtp(['', '', '', '', '', '']);
    setError(null);
    setStep('phone');
  };

  return (
    <Screen edges={['top', 'bottom']} bg="default">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { padding: spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.hero, heroStyle]}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primaryMuted }]}>
              <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
            </View>
            <Text variant="overline" muted style={{ marginTop: spacing.lg }}>
              SATGURU PANTH
            </Text>
            <Text variant="h1" weight="extrabold" centered style={{ marginTop: spacing.xs }}>
              {step === 'phone' ? 'Welcome' : 'Verify it’s you'}
            </Text>
            <Text variant="body" muted centered style={{ marginTop: spacing.sm, maxWidth: 320 }}>
              {step === 'phone'
                ? 'Begin your journey from Atmadiksha to Atmabodha'
                : `We sent a 6-digit code to +91 ${phone}`}
            </Text>
          </Animated.View>

          <Animated.View style={[styles.form, formStyle, { gap: spacing.md }]}>
            {step === 'phone' ? (
              <>
                <View
                  style={[
                    styles.field,
                    {
                      borderRadius: radius.xl,
                      borderColor: error ? colors.danger : colors.border,
                      backgroundColor: colors.surface,
                      paddingHorizontal: spacing.md,
                    },
                  ]}
                >
                  <View style={[styles.codeBox, { borderRightColor: colors.border }]}>
                    <Text variant="body" weight="semibold">
                      🇮🇳
                    </Text>
                    <Text variant="body" weight="semibold" style={{ marginLeft: 6 }}>
                      +91
                    </Text>
                  </View>
                  <TextInput
                    ref={phoneRef}
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="98765 43210"
                    placeholderTextColor={colors.textSubtle}
                    style={[
                      styles.input,
                      { color: colors.text, fontFamily: fontFamily.medium, fontSize: 17 },
                    ]}
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                </View>
                {error && (
                  <Text variant="caption" color={colors.danger} weight="medium">
                    {error}
                  </Text>
                )}
                <Button
                  title={loading ? 'Sending OTP…' : 'Continue'}
                  onPress={handleSendOtp}
                  loading={loading}
                  disabled={phone.length !== 10}
                  size="lg"
                  fullWidth
                  rightIcon={<Ionicons name="arrow-forward" size={18} color={colors.primaryFg} />}
                />
              </>
            ) : (
              <>
                <View style={styles.otpRow}>
                  {otp.map((d, i) => (
                    <TextInput
                      key={i}
                      ref={(r) => {
                        otpRefs.current[i] = r;
                      }}
                      value={d}
                      onChangeText={(v) => handleOtpChange(i, v)}
                      onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                      keyboardType="number-pad"
                      maxLength={1}
                      style={[
                        styles.otpInput,
                        {
                          color: colors.text,
                          fontFamily: fontFamily.bold,
                          backgroundColor: colors.surface,
                          borderColor: d ? colors.primary : colors.border,
                          borderRadius: radius.md,
                        },
                      ]}
                    />
                  ))}
                </View>
                {error && (
                  <Text variant="caption" color={colors.danger} weight="medium" centered>
                    {error}
                  </Text>
                )}
                <Button
                  title={loading ? 'Verifying…' : 'Verify & Continue'}
                  onPress={handleVerify}
                  loading={loading}
                  disabled={otp.some((d) => !d)}
                  size="lg"
                  fullWidth
                />
                <Pressable onPress={handleBack} style={{ alignItems: 'center', padding: spacing.sm }}>
                  <Text variant="bodySm" weight="medium" color={colors.primary}>
                    ← Use a different number
                  </Text>
                </Pressable>
              </>
            )}
          </Animated.View>

          <View style={[styles.terms, { marginTop: spacing.xxl }]}>
            <Text variant="caption" subtle centered>
              By continuing, you agree to our{' '}
              <Text variant="caption" weight="semibold" color={colors.primary}>
                Terms
              </Text>{' '}
              and{' '}
              <Text variant="caption" weight="semibold" color={colors.primary}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  form: {
    width: '100%',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderWidth: 1.5,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
    height: '60%',
  },
  input: {
    flex: 1,
    height: '100%',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 56,
    fontSize: 22,
    textAlign: 'center',
    borderWidth: 1.5,
  },
  terms: {
    paddingHorizontal: 16,
  },
});

export default LoginPage;
