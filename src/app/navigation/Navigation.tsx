import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../Screens/SplashScreen';
import LoginPage from '../Screens/LoginPage';
import BottomTabs from '../Screens/BottomTabs';
import AboutSatguruPanth from '../Screens/ProfileSection/AboutSatguruPanth';
import ContactUs from '../Screens/ProfileSection/ContactUs';
import EditProfile from '../Screens/ProfileSection/EditProfile';
import BookReader from '../Screens/MainSection/BookReader';
import AllBooks from '../Screens/MainSection/AllBooks';

const Stack = createStackNavigator();

const Navigation = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splashScreen" component={SplashScreen} />
      <Stack.Screen name="loginPage" component={LoginPage} />
      <Stack.Screen name="bottomTabs" component={BottomTabs} />
      <Stack.Screen name="editProfile" component={EditProfile}/>
      <Stack.Screen name="aboutSatguruPanth" component={AboutSatguruPanth}/>
      <Stack.Screen name="contactUs" component={ContactUs}/>
      <Stack.Screen name="bookReader" component={BookReader}/>
      <Stack.Screen name="allBooks" component={AllBooks}/>
    </Stack.Navigator>
  );
};

export default Navigation;
