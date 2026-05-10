import React from 'react';
import { View, StyleSheet, Pressable, Linking, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/ui/Text';
import { Card } from '../../../components/ui/Card';
import { Screen } from '../../../components/ui/Screen';

const PHONE = '9984257903';
const EMAIL = 'admin@brahmgyanyogsansthan.org';

const ContactUs = ({ navigation }: any) => {
  const { colors, spacing, radius } = useTheme();

  const safeOpenUrl = async (url: string, fallback: string) => {
    Haptics.selectionAsync().catch(() => {});
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Unable to open', fallback);
    } catch {
      Alert.alert('Unable to open', fallback);
    }
  };

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
          Contact us
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 80 }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text variant="h3" weight="semibold">
            We'd love to hear from you
          </Text>
          <Text variant="bodySm" muted style={{ marginTop: spacing.xs }}>
            Reach out for guidance, queries, or to share your seva
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={{ marginTop: spacing.xl }}>
          <Card variant="outlined" padded radius="xl">
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="overline" muted>
                  ADDRESS
                </Text>
                <Text variant="body" weight="medium" style={{ marginTop: 4 }}>
                  सुरेशादयाल
                </Text>
                <Text variant="bodySm" muted style={{ marginTop: 2 }}>
                  ब्रह्मज्ञान योग संस्थान मोचकला, बिसवां
                </Text>
                <Text variant="bodySm" muted style={{ marginTop: 2 }}>
                  सीतापुर, उत्तर प्रदेश, भारत
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={{ marginTop: spacing.md }}>
          <Pressable
            onPress={() => safeOpenUrl(`tel:${PHONE}`, `Call ${PHONE}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Card variant="outlined" padded radius="xl">
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}>
                  <Ionicons name="call" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="overline" muted>
                    CALL
                  </Text>
                  <Text variant="body" weight="semibold" style={{ marginTop: 4 }}>
                    +91 {PHONE}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </View>
            </Card>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(400)} style={{ marginTop: spacing.md }}>
          <Pressable
            onPress={() => safeOpenUrl(`mailto:${EMAIL}`, `Email ${EMAIL}`)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Card variant="outlined" padded radius="xl">
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}>
                  <Ionicons name="mail" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="overline" muted>
                    EMAIL
                  </Text>
                  <Text variant="body" weight="semibold" style={{ marginTop: 4 }} numberOfLines={1}>
                    {EMAIL}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </View>
            </Card>
          </Pressable>
        </Animated.View>
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
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ContactUs;
