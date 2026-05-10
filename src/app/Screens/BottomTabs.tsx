import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GetAllBooks } from '@/components/API/BooksAPI';

import ForYou from './MainSection/ForYou';
import Library from './MainSection/Library';
import Profile from './MainSection/Profile';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../../components/ui/Text';
import { Skeleton } from '../../components/ui/Skeleton';

const Tab = createBottomTabNavigator();

const BOOKS_CACHE_KEY = '@cached_books';
const CACHE_EXPIRY_KEY = '@cache_expiry';
const CACHE_DURATION = 30 * 60 * 1000;

interface TabIconProps {
  focused: boolean;
  iconName: keyof typeof Ionicons.glyphMap;
  iconNameOutline: keyof typeof Ionicons.glyphMap;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, iconName, iconNameOutline, label }) => {
  const { colors } = useTheme();
  const scale = useSharedValue(focused ? 1 : 0.9);
  const opacity = useSharedValue(focused ? 1 : 0.6);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.05 : 1, { damping: 14, stiffness: 220 });
    opacity.value = withTiming(focused ? 1 : 0.6, { duration: 180 });
  }, [focused, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.tabItem, animatedStyle]}>
      <View
        style={[
          styles.iconWrap,
          focused && {
            backgroundColor: colors.primaryMuted,
          },
        ]}
      >
        <Ionicons
          name={focused ? iconName : iconNameOutline}
          size={20}
          color={focused ? colors.primary : colors.textMuted}
        />
      </View>
      <Text
        variant="caption"
        weight={focused ? 'semibold' : 'medium'}
        color={focused ? colors.primary : colors.textMuted}
        numberOfLines={1}
        ellipsizeMode="clip"
        style={{ marginTop: 2, fontSize: 11 }}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

const BottomTabs = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllBooks = useCallback(async () => {
    try {
      const cachedBooks = await AsyncStorage.getItem(BOOKS_CACHE_KEY);
      const cacheExpiry = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);

      if (cachedBooks) {
        const parsedBooks = JSON.parse(cachedBooks);
        setAllBooks(parsedBooks);
        setIsLoading(false);
        if (cacheExpiry && Date.now() < parseInt(cacheExpiry, 10)) return;
      }

      const newReleasedBooks = await GetAllBooks();
      if (Array.isArray(newReleasedBooks)) {
        setAllBooks(newReleasedBooks);
        await AsyncStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify(newReleasedBooks));
        await AsyncStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION));
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching books:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllBooks();
  }, [fetchAllBooks]);

  if (isLoading && allBooks.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <View style={{ width: '85%', gap: 14 }}>
          <Skeleton width="50%" height={24} />
          <Skeleton width="80%" height={14} />
          <View style={{ height: 16 }} />
          <Skeleton width="100%" height={140} radius={16} />
          <View style={{ height: 8 }} />
          <Skeleton width="100%" height={140} radius={16} />
        </View>
      </View>
    );
  }

  const tabBarHeight = (Platform.OS === 'ios' ? 60 : 60) + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            intensity={Platform.OS === 'ios' ? 60 : 40}
            style={StyleSheet.absoluteFill}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colors.bgGlass,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                },
              ]}
            />
          </BlurView>
        ),
        tabBarButton: (props) => (
          <Pressable
            {...(props as any)}
            android_ripple={{ color: 'transparent' }}
            onPress={(e) => {
              Haptics.selectionAsync().catch(() => {});
              props.onPress?.(e as any);
            }}
            style={[styles.tabBarBtn]}
          >
            {props.children}
          </Pressable>
        ),
      })}
    >
      <Tab.Screen
        name="forYou"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconName="home"
              iconNameOutline="home-outline"
              label="Home"
            />
          ),
        }}
      >
        {() => <ForYou navigation={navigation} allBooks={allBooks} onRefresh={fetchAllBooks} />}
      </Tab.Screen>
      <Tab.Screen
        name="library"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconName="library"
              iconNameOutline="library-outline"
              label="Library"
            />
          ),
        }}
      >
        {() => <Library navigation={navigation} allBooks={allBooks} />}
      </Tab.Screen>
      <Tab.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              iconName="person"
              iconNameOutline="person-outline"
              label="Profile"
            />
          ),
        }}
      >
        {() => <Profile navigation={navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomTabs;
