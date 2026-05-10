import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../security/AuthContext';
import { Text } from '../../../components/ui/Text';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Screen } from '../../../components/ui/Screen';
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePin,
  sanitizeText,
} from '../../../security/validation';

interface FormState {
  name: string;
  email: string;
  phone: string;
  pinCode: string;
  city: string;
}

const PIN_CITY_MAP: Record<string, string> = {
  '110001': 'New Delhi',
  '400001': 'Mumbai',
  '700001': 'Kolkata',
  '600001': 'Chennai',
  '500001': 'Hyderabad',
  '380001': 'Ahmedabad',
  '226001': 'Lucknow',
  '261001': 'Sitapur',
};

const lookupCityByPincode = (pincode: string): Promise<string> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(PIN_CITY_MAP[pincode] || ''), 400);
  });

const EditProfile: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, spacing, radius, fontFamily } = useTheme();
  const { user, updateProfile } = useAuth();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    pinCode: '',
    city: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: (user.phone || '').replace(/^\+91/, ''),
        pinCode: user.pinCode || '',
        city: user.city || '',
      });
    }
  }, [user]);

  const updateField = (key: keyof FormState, value: string) => {
    setErrors((e) => ({ ...e, [key]: undefined }));
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handlePinChange = useCallback(
    async (raw: string) => {
      const cleaned = raw.replace(/\D/g, '').slice(0, 6);
      updateField('pinCode', cleaned);
      if (cleaned.length === 6) {
        setLookingUp(true);
        try {
          const city = await lookupCityByPincode(cleaned);
          setForm((f) => ({ ...f, city }));
        } finally {
          setLookingUp(false);
        }
      } else {
        setForm((f) => ({ ...f, city: '' }));
      }
    },
    []
  );

  const handleSave = async () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    const nameV = validateName(form.name);
    if (!nameV.valid) nextErrors.name = nameV.error;
    const phoneV = validatePhone(form.phone);
    if (!phoneV.valid) nextErrors.phone = phoneV.error;
    if (form.email) {
      const emailV = validateEmail(form.email);
      if (!emailV.valid) nextErrors.email = emailV.error;
    }
    if (form.pinCode) {
      const pinV = validatePin(form.pinCode);
      if (!pinV.valid) nextErrors.pinCode = pinV.error;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: sanitizeText(form.name),
        email: sanitizeText(form.email),
        phone: `+91${form.phone}`,
        pinCode: form.pinCode,
        city: sanitizeText(form.city),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    maxLength,
    error,
    autoCapitalize = 'sentences',
    leftAdornment,
  }: any) => (
    <View>
      <Text variant="overline" muted style={{ marginBottom: spacing.xs }}>
        {label}
      </Text>
      <View
        style={[
          styles.field,
          {
            borderRadius: radius.lg,
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        {leftAdornment}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          style={{
            flex: 1,
            color: colors.text,
            fontFamily: fontFamily.medium,
            fontSize: 15,
            paddingVertical: 0,
          }}
        />
      </View>
      {error && (
        <Text variant="caption" color={colors.danger} style={{ marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );

  return (
    <Screen edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              navigation.goBack();
            }}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceMuted }]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <Text variant="h2" weight="bold" style={{ flex: 1 }}>
            Edit profile
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
              <Image source={require('@/assets/images/icon.png')} style={styles.avatarImg} />
            </View>
            <Pressable
              onPress={() =>
                Alert.alert('Coming soon', 'Custom avatars will be available in a future update.')
              }
              style={[styles.cameraBtn, { backgroundColor: colors.primary, borderColor: colors.bg }]}
            >
              <Ionicons name="camera" size={14} color={colors.primaryFg} />
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(80).duration(400)}
            style={{ marginTop: spacing.xl, gap: spacing.md }}
          >
            <Field
              label="Full name"
              value={form.name}
              onChangeText={(t: string) => updateField('name', t)}
              placeholder="Your name"
              maxLength={100}
              error={errors.name}
              autoCapitalize="words"
            />
            <Field
              label="Email"
              value={form.email}
              onChangeText={(t: string) => updateField('email', t)}
              placeholder="you@example.com"
              keyboardType="email-address"
              maxLength={120}
              error={errors.email}
              autoCapitalize="none"
            />
            <Field
              label="Phone number"
              value={form.phone}
              onChangeText={(t: string) =>
                updateField('phone', t.replace(/\D/g, '').slice(0, 10))
              }
              placeholder="98765 43210"
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
              autoCapitalize="none"
              leftAdornment={
                <View style={{ marginRight: 8, paddingRight: 8, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border }}>
                  <Text variant="bodySm" weight="semibold">
                    +91
                  </Text>
                </View>
              }
            />
            <Field
              label="PIN code"
              value={form.pinCode}
              onChangeText={handlePinChange}
              placeholder="6-digit PIN"
              keyboardType="number-pad"
              maxLength={6}
              error={errors.pinCode}
              autoCapitalize="none"
            />

            <View>
              <Text variant="overline" muted style={{ marginBottom: spacing.xs }}>
                City
              </Text>
              <View
                style={[
                  styles.field,
                  {
                    borderRadius: radius.lg,
                    backgroundColor: colors.surfaceMuted,
                    paddingHorizontal: spacing.md,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text variant="body" muted={!form.city && !lookingUp} subtle={!form.city && !lookingUp}>
                  {lookingUp ? 'Looking up city…' : form.city || 'Will appear from your PIN'}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(160).duration(400)}
            style={{ marginTop: spacing.xxl }}
          >
            <Button
              title={saving ? 'Saving…' : 'Save changes'}
              onPress={handleSave}
              loading={saving}
              fullWidth
              size="lg"
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    alignSelf: 'center',
    width: 110,
    height: 110,
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
  },
});

export default EditProfile;
