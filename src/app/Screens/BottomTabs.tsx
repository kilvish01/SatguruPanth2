import React, { ReactNode, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, SafeAreaView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { GetAllBooks } from '@/components/API/BooksAPI';

// Import correct path for ForYou - adjust if needed
import ForYou from '../Screens/MainSection/ForYou';
import Library from '../Screens/MainSection/Library';
import Profile from '../Screens/MainSection/Profile';

const Tab = createBottomTabNavigator();


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

  useEffect(() => {
    const fetchAllBooks = async () => {
      try {
        const newReleasedBooks = await GetAllBooks(); // Wait for the API response
        setAllBooks(newReleasedBooks); // Set the data in state
        console.log(newReleasedBooks);
      } catch (error) {
        console.error('Error fetching new releases for you class:', error);
      }
    };
    fetchAllBooks();
  }, []);


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

export default BottomTabs;