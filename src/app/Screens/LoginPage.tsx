import React, { useState,useEffect,useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Image,
    StyleSheet,
    ScrollView
} from 'react-native';
import CustomText from '@/components/shared/CustomText';
import { commonStyles } from '@/styles/commonStyles';
import { loginHandler } from '@/components/API/loginlogout';

const LoginPage = ({ navigation }: any) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const inputRef = useRef<TextInput>(null); // Reference for TextInput

    useEffect(() => {
        setTimeout(() => {
            inputRef.current?.focus(); // Auto-focus after a delay
        }, 500);
    }, []);

    const handleGetStarted = () => {
        if (phoneNumber.length >= 10) {
            loginHandler({phoneNumber,navigation});
            navigation.navigate('bottomTabs');
        } else {
            alert('Please enter a valid phone number');
        }
    };

    return (
        <SafeAreaView style={commonStyles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.contentContainer}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('@/assets/images/icon.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <CustomText variant="h4" fontFamily="Bold" style={styles.appTitle}>
                            WELCOME TO SATGURU PANTH
                            </CustomText>
                        </View>

                        {/* Welcome Text */}
                        <View style={styles.welcomeContainer}>
                            <CustomText variant="h6" fontFamily="Regular" style={styles.descriptionText}>
                                Enter your phone number to continue
                            </CustomText>
                        </View>

                        {/* Phone Input */}
                        <View style={styles.inputContainer}>
                            <View style={styles.phoneInputContainer}>
                                <CustomText variant="h6" fontFamily="Medium" style={styles.countryCode}>
                                    +91
                                </CustomText>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.input}
                                    placeholder="Phone Number"
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    maxLength={10}
                                    autoFocus={true}
                                />
                            </View>
                        </View>

                        {/* Get Started Button */}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                phoneNumber.length >= 10 ? styles.buttonActive : styles.buttonInactive
                            ]}
                            onPress={handleGetStarted}
                            disabled={phoneNumber.length < 10}
                        >
                            <CustomText variant="h6" fontFamily="Bold" style={styles.buttonText}>
                                Get Started
                            </CustomText>
                        </TouchableOpacity>

                        {/* Terms and Conditions */}
                        <CustomText variant="h8" fontFamily="Regular" style={styles.termsText}>
                            By continuing, you agree to our{' '}
                            <CustomText variant="h8" fontFamily="Medium" style={styles.termsLink}>
                                Terms of Service
                            </CustomText> and{' '}
                            <CustomText variant="h8" fontFamily="Medium" style={styles.termsLink}>
                                Privacy Policy
                            </CustomText>
                        </CustomText>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    contentContainer: {
        flex: 1,
        padding: 15,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 150,
        height: 150,
    },
    appTitle: {
        marginTop: 15,
        color: '#333',
        fontWeight: 800,
    },
    welcomeContainer: {
        marginBottom: 50,
    },
    welcomeText: {
        color: '#333',
        marginBottom: 10,
    },
    descriptionText: {
        color: '#333',
        fontWeight: 500,
        marginBottom: -20
    },
    inputContainer: {
        marginBottom: 30,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 10,
    },
    countryCode: {
        marginRight: 10,
        color: '#333',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    button: {
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonActive: {
        backgroundColor: '#000000', // Black button as requested
    },
    buttonInactive: {
        backgroundColor: '#333333', // Darker gray when inactive
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
    },
    termsText: {
        textAlign: 'center',
        color: '#888',
    },
    termsLink: {
        color: '#000000', // Black to match button color
    },
});

export default LoginPage;