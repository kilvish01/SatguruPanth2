import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { useFonts } from 'expo-font';
import CustomText from '@/components/shared/CustomText';
import { splashStyles } from '@/styles/splashStyles';
import { commonStyles } from '@/styles/commonStyles';
import { resetAndNavigate } from '@/utils/Helpers';

const SplashScreen = ({ navigation }: any) => {
  const [loaded] = useFonts({
    Bold: require('../../assets/fonts/Rubik-Bold.ttf'),
    Regular: require('../../assets/fonts/Rubik-Regular.ttf'),
    Medium: require('../../assets/fonts/Rubik-Medium.ttf'),
    Light: require('../../assets/fonts/Rubik-Light.ttf'),
    SemiBold: require('../../assets/fonts/Rubik-SemiBold.ttf'),
    ExtraBold: require('../../assets/fonts/Rubik-ExtraBold.ttf'),
  });

  const [hasNavigated, setHasNavigated] = useState(false);

  const tokenCheck = async () => {
    navigation.navigate('bottomTabs');
  };

  useEffect(() => {
    if (!hasNavigated) {
      const timeoutId = setTimeout(() => {
        tokenCheck();
        setHasNavigated(true);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [loaded, hasNavigated]);

  

  return (
    <View style={commonStyles.container}>
      <Image source={require('@/assets/images/icon.png')} style={splashStyles.img} />
      <CustomText variant="h5" fontFamily="Medium" style={splashStyles.text}>
        Welcome to Brahm Gyan App
      </CustomText>
    </View>
  );
};

export default SplashScreen;
