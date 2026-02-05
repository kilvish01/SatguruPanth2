import React, { ReactNode, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, SafeAreaView, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GetAllBooks } from '@/components/API/BooksAPI';

// Import correct path for ForYou - adjust if needed
import ForYou from '../Screens/MainSection/ForYou';
import Library from '../Screens/MainSection/Library';
import Profile from '../Screens/MainSection/Profile';

const Tab = createBottomTabNavigator();

const BOOKS_CACHE_KEY = '@cached_books';
const CACHE_EXPIRY_KEY = '@cache_expiry';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Safe area wrapper component with proper typing
interface SafeAreaWrapperProps {
  children: ReactNode;
}

const SafeAreaWrapper = ({ children }: SafeAreaWrapperProps) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {children}
    </SafeAreaView>
  );
};


const BottomTabs = ({navigation}:any) => {
  const insets = useSafeAreaInsets();
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllBooks = async () => {
      try {
        // Try to load cached books first for instant display
        const cachedBooks = await AsyncStorage.getItem(BOOKS_CACHE_KEY);
        const cacheExpiry = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);

        if (cachedBooks) {
          const parsedBooks = JSON.parse(cachedBooks);
          setAllBooks(parsedBooks);
          setIsLoading(false);

          // Check if cache is still valid
          if (cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
            return; // Cache is valid, no need to fetch
          }
        }

        // Fetch fresh data from API
        const newReleasedBooks = await GetAllBooks();
        setAllBooks(newReleasedBooks);

        // Cache the books for next time
        await AsyncStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify(newReleasedBooks));
        await AsyncStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION));

      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllBooks();
  }, []);


  // Show loading screen while fetching books (only on first load without cache)
  if (isLoading && allBooks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90A4" />
        <Text style={styles.loadingText}>Loading Books...</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          // iOS specific shadow properties
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          // Android specific elevation
          elevation: 5,
          // Ensure proper padding and height with safe area insets
          height: Platform.OS === 'ios' ? 90 : 60 + insets.bottom,
          paddingBottom: insets.bottom,
          borderTopWidth: 1,
          borderTopColor: '#EEEEEE',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === 'ios' ? 8 : 5,
        },
        tabBarActiveTintColor: 'blue',
        tabBarInactiveTintColor: '#000',
        tabBarItemStyle: {
          paddingTop: Platform.OS === 'ios' ? 10 : 5,
        },
      }}
    >
      <Tab.Screen
        name="forYou"
        options={{
          title: 'Satguru Panth',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <View style={{ height: 24, width: 24, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons
                name="home"
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      >
        {() => <ForYou navigation={navigation} allBooks={allBooks} />}

      </Tab.Screen>
      <Tab.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarLabel: 'Library',
          tabBarIcon: ({ color, size }) => (
            <View style={{ height: 24, width: 24, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons
                name="bookmark"
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      >
        {() => <Library navigation={navigation} allBooks = {allBooks}/>}
      </Tab.Screen>
      <Tab.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <View style={{ height: 24, width: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons
                name="person-add-sharp"
                size={size}
                color={color}
              />
            </View>
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
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
});

export default BottomTabs;