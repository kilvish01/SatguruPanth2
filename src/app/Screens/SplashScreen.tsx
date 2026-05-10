import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../security/AuthContext';
import { Text } from '../../components/ui/Text';

const SplashScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  const [fontsLoaded] = useFonts({
    'Rubik-Bold': require('../../assets/fonts/Rubik-Bold.ttf'),
    'Rubik-Regular': require('../../assets/fonts/Rubik-Regular.ttf'),
    'Rubik-Medium': require('../../assets/fonts/Rubik-Medium.ttf'),
    'Rubik-Light': require('../../assets/fonts/Rubik-Light.ttf'),
    'Rubik-SemiBold': require('../../assets/fonts/Rubik-SemiBold.ttf'),
    'Rubik-ExtraBold': require('../../assets/fonts/Rubik-ExtraBold.ttf'),
    Bold: require('../../assets/fonts/Rubik-Bold.ttf'),
    Regular: require('../../assets/fonts/Rubik-Regular.ttf'),
    Medium: require('../../assets/fonts/Rubik-Medium.ttf'),
    Light: require('../../assets/fonts/Rubik-Light.ttf'),
    SemiBold: require('../../assets/fonts/Rubik-SemiBold.ttf'),
    ExtraBold: require('../../assets/fonts/Rubik-ExtraBold.ttf'),
  });

  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 140 });
    ringScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 400 })
      )
    );
    titleY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    subtitleOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
  }, [logoOpacity, logoScale, titleY, titleOpacity, subtitleOpacity, ringScale]);

  useEffect(() => {
    if (!fontsLoaded || isLoading) return;
    const t = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: isAuthenticated ? 'bottomTabs' : 'loginPage' }],
      });
    }, 1600);
    return () => clearTimeout(t);
  }, [fontsLoaded, isLoading, isAuthenticated, navigation]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - ringScale.value * 0.6,
    transform: [{ scale: ringScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={colors.gradientSubtle}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.center}>
        <View style={styles.logoBox}>
          <Animated.View
            style={[
              styles.ring,
              { borderColor: colors.primary },
              ringStyle,
            ]}
          />
          <Animated.View style={logoStyle}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          </Animated.View>
        </View>
        <Animated.View style={[styles.textBlock, titleStyle]}>
          <Text variant="h1" weight="extrabold" centered>
            सतगुरु पंथ
          </Text>
        </Animated.View>
        <Animated.View style={subtitleStyle}>
          <Text variant="bodySm" muted centered style={{ marginTop: 6, letterSpacing: 1.5 }}>
            ATMADIKSHA · ATMABODHA
          </Text>
        </Animated.View>
      </View>
      <Animated.View style={[styles.footer, subtitleStyle]}>
        <Text variant="caption" subtle centered>
          Crafted for the path within
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
  },
  logo: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },
  textBlock: {
    alignItems: 'center',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
});

export default SplashScreen;
