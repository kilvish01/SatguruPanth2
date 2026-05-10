import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/ui/Text';
import { Card } from '../../../components/ui/Card';
import { Screen } from '../../../components/ui/Screen';

const STORAGE_KEY = '@notification_prefs';

interface NotificationPrefs {
  push: boolean;
  email: boolean;
  sms: boolean;
  newReleases: boolean;
  dailyReading: boolean;
  satsangReminder: boolean;
}

const DEFAULTS: NotificationPrefs = {
  push: true,
  email: false,
  sms: false,
  newReleases: true,
  dailyReading: true,
  satsangReminder: false,
};

interface ToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

const NotificationSettings: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, spacing, radius } = useTheme();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
          } catch {
            // ignored
          }
        }
      })
      .catch(() => {});
  }, []);

  const updatePref = useCallback(<K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => {
    Haptics.selectionAsync().catch(() => {});
    setPrefs((p) => {
      const next = { ...p, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const ToggleRow: React.FC<ToggleRowProps> = ({
    icon,
    iconColor,
    iconBg,
    title,
    subtitle,
    value,
    onValueChange,
  }) => (
    <View style={[styles.row, { paddingVertical: spacing.md, paddingHorizontal: spacing.lg }]}>
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
        <Text variant="body" weight="medium">
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" subtle style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <Screen edges={['top']}>
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
        <Text variant="h2" weight="bold">
          Notifications
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 60 }}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text variant="overline" muted style={{ marginBottom: spacing.sm, marginLeft: 4 }}>
            Channels
          </Text>
          <Card variant="outlined" padded={false} radius="xl">
            <ToggleRow
              icon="notifications"
              iconColor={colors.primary}
              iconBg={colors.primaryMuted}
              title="Push notifications"
              subtitle="Get instant alerts on your device"
              value={prefs.push}
              onValueChange={(v) => updatePref('push', v)}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ToggleRow
              icon="mail"
              iconColor={colors.primary}
              iconBg={colors.primaryMuted}
              title="Email"
              subtitle="Weekly digest and updates"
              value={prefs.email}
              onValueChange={(v) => updatePref('email', v)}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ToggleRow
              icon="chatbubble-ellipses"
              iconColor={colors.primary}
              iconBg={colors.primaryMuted}
              title="SMS"
              subtitle="Important alerts via text"
              value={prefs.sms}
              onValueChange={(v) => updatePref('sms', v)}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ marginTop: spacing.xl }}>
          <Text variant="overline" muted style={{ marginBottom: spacing.sm, marginLeft: 4 }}>
            What you'd like to hear about
          </Text>
          <Card variant="outlined" padded={false} radius="xl">
            <ToggleRow
              icon="sparkles"
              title="New book releases"
              subtitle="Be first to read newly published titles"
              value={prefs.newReleases}
              onValueChange={(v) => updatePref('newReleases', v)}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ToggleRow
              icon="sunny"
              title="Daily reading reminders"
              subtitle="Gentle nudges to keep your practice steady"
              value={prefs.dailyReading}
              onValueChange={(v) => updatePref('dailyReading', v)}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ToggleRow
              icon="people"
              title="Satsang & event reminders"
              subtitle="Don't miss community gatherings"
              value={prefs.satsangReminder}
              onValueChange={(v) => updatePref('satsangReminder', v)}
            />
          </Card>
        </Animated.View>

        <Text variant="caption" subtle centered style={{ marginTop: spacing.xxl }}>
          You can change these preferences anytime
        </Text>
      </ScrollView>
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
});

export default NotificationSettings;
