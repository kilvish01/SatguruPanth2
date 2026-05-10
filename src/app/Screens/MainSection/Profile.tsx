import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Switch,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../security/AuthContext';
import { Text } from '../../../components/ui/Text';
import { Card } from '../../../components/ui/Card';
import { Screen } from '../../../components/ui/Screen';
import { isBiometricAvailable, getBiometryType } from '../../../security/biometric';
import { secureGet, secureSet, SecureKeys } from '../../../security/secureStorage';

interface ProfileProps {
  navigation: any;
}

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightContent?: React.ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ navigation }) => {
  const { colors, spacing, radius, mode, setMode, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometryType, setBiometryType] = useState<'fingerprint' | 'face' | 'iris' | 'unknown'>(
    'unknown'
  );

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      if (available) {
        setBiometryType((await getBiometryType()) ?? 'unknown');
        const stored = await secureGet(SecureKeys.BIOMETRIC_ENABLED);
        setBiometricEnabled(stored === '1');
      }
    })();
  }, []);

  const toggleBiometric = useCallback(
    async (value: boolean) => {
      Haptics.selectionAsync().catch(() => {});
      setBiometricEnabled(value);
      await secureSet(SecureKeys.BIOMETRIC_ENABLED, value ? '1' : '0');
    },
    []
  );

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          await signOut();
          navigation.reset({ index: 0, routes: [{ name: 'loginPage' }] });
        },
      },
    ]);
  };

  const handleShare = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      await Share.share({
        message:
          'Begin your spiritual journey with Satguru Panth — discover sacred wisdom from Atmadiksha to Atmabodha 🪷',
      });
    } catch {
      // ignored
    }
  };

  const cycleTheme = () => {
    Haptics.selectionAsync().catch(() => {});
    const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
    setMode(next);
  };

  const Row: React.FC<RowProps> = ({
    icon,
    iconColor,
    iconBg,
    title,
    subtitle,
    onPress,
    rightContent,
    showChevron,
    destructive,
  }) => (
    <Pressable
      onPress={() => {
        if (onPress) {
          Haptics.selectionAsync().catch(() => {});
          onPress();
        }
      }}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: iconBg ?? colors.surfaceMuted,
            borderRadius: radius.md,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={iconColor ?? colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="medium" color={destructive ? colors.danger : colors.text}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" subtle style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightContent}
      {showChevron && <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />}
    </Pressable>
  );

  const themeLabel = mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System';
  const themeIcon: keyof typeof Ionicons.glyphMap =
    mode === 'light' ? 'sunny' : mode === 'dark' ? 'moon' : 'phone-portrait';

  const biometricLabel =
    biometryType === 'face' ? 'Face ID' : biometryType === 'fingerprint' ? 'Fingerprint' : 'Biometric';

  return (
    <Screen edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: spacing.xl }}>
          <Text variant="h1" weight="bold" style={{ marginTop: spacing.sm }}>
            Profile
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(400)}
          style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { borderRadius: radius.xxl, padding: spacing.xl }]}
          >
            <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Image source={require('@/assets/images/icon.png')} style={styles.avatarImg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="h2" weight="bold" color={colors.primaryFg}>
                {user?.name || 'Welcome, Seeker'}
              </Text>
              <Text variant="bodySm" color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
                {user?.phone || 'Sign in to personalize your journey'}
              </Text>
              <Pressable
                onPress={() => navigation.navigate('editProfile')}
                style={[styles.editBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              >
                <Text variant="caption" weight="semibold" color={colors.primaryFg}>
                  Edit profile
                </Text>
                <Ionicons name="arrow-forward" size={12} color={colors.primaryFg} />
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(120).duration(400)}
          style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}
        >
          <Text variant="overline" muted style={{ marginBottom: spacing.sm, marginLeft: 4 }}>
            Preferences
          </Text>
          <Card variant="outlined" padded={false} radius="xl">
            <Row
              icon={themeIcon}
              iconBg={colors.primaryMuted}
              iconColor={colors.primary}
              title="Appearance"
              subtitle={`Currently: ${themeLabel}`}
              onPress={cycleTheme}
              rightContent={
                <View style={[styles.modePill, { backgroundColor: colors.surfaceMuted }]}>
                  <Text variant="caption" weight="semibold" muted>
                    {themeLabel}
                  </Text>
                </View>
              }
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            {biometricAvailable && (
              <>
                <Row
                  icon={biometryType === 'face' ? 'scan' : 'finger-print'}
                  iconBg={colors.primaryMuted}
                  iconColor={colors.primary}
                  title={`Unlock with ${biometricLabel}`}
                  subtitle="Securely access the app instantly"
                  rightContent={
                    <Switch
                      value={biometricEnabled}
                      onValueChange={toggleBiometric}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  }
                />
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              </>
            )}
            <Row
              icon="notifications-outline"
              iconBg={colors.primaryMuted}
              iconColor={colors.primary}
              title="Notifications"
              subtitle="Daily readings, new releases"
              onPress={() => navigation.navigate('notifications')}
              showChevron
            />
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(180).duration(400)}
          style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}
        >
          <Text variant="overline" muted style={{ marginBottom: spacing.sm, marginLeft: 4 }}>
            About
          </Text>
          <Card variant="outlined" padded={false} radius="xl">
            <Row
              icon="information-circle-outline"
              iconBg={colors.surfaceMuted}
              title="About Satguru Panth"
              subtitle="The path within"
              onPress={() => navigation.navigate('aboutSatguruPanth')}
              showChevron
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <Row
              icon="call-outline"
              iconBg={colors.surfaceMuted}
              title="Contact us"
              subtitle="Get in touch with the sansthan"
              onPress={() => navigation.navigate('contactUs')}
              showChevron
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <Row
              icon="share-social-outline"
              iconBg={colors.surfaceMuted}
              title="Share this app"
              subtitle="Spread the wisdom"
              onPress={handleShare}
              showChevron
            />
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(240).duration(400)}
          style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}
        >
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOut,
              {
                backgroundColor: colors.dangerMuted,
                borderRadius: radius.lg,
                paddingVertical: spacing.md,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text variant="body" weight="semibold" color={colors.danger}>
              Sign out
            </Text>
          </Pressable>

          <Text variant="caption" subtle centered style={{ marginTop: spacing.xl }}>
            सतगुरु पंथ · v1.1.0
          </Text>
          <Text variant="caption" subtle centered style={{ marginTop: 2 }}>
            Made with devotion 🪷
          </Text>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default Profile;
