import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '@/components/shared/CustomText';

const ContactUs = ({ navigation }) => {
  const handleCall = () => {
    Linking.openURL('tel:9984257903');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:admin@brahmgyanyogsansthan.org');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <CustomText variant="h4" fontFamily="Bold">
            Contact Us
          </CustomText>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={40} color="#000066" />
          </View>
          <CustomText variant="h5" fontFamily="Bold" style={styles.label}>
            पता:
          </CustomText>
          <CustomText variant="h6" fontFamily="Regular" style={styles.text}>
            सुरेशादयाल
          </CustomText>
          <CustomText variant="h6" fontFamily="Regular" style={styles.text}>
            ब्रह्मज्ञान योग संस्थान मोचकला, बिसवां
          </CustomText>
          <CustomText variant="h6" fontFamily="Regular" style={styles.text}>
            सीतापुर, उ० प्र०, भारत
          </CustomText>
        </View>

        <TouchableOpacity style={styles.card} onPress={handleCall}>
          <View style={styles.iconContainer}>
            <Ionicons name="call" size={40} color="#000066" />
          </View>
          <CustomText variant="h5" fontFamily="Bold" style={styles.label}>
            फ़ोन:
          </CustomText>
          <CustomText variant="h6" fontFamily="Regular" style={styles.linkText}>
            मो० 9984257903
          </CustomText>
          <View style={styles.actionHint}>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleEmail}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={40} color="#000066" />
          </View>
          <CustomText variant="h5" fontFamily="Bold" style={styles.label}>
            ईमेल:
          </CustomText>
          <CustomText variant="h6" fontFamily="Regular" style={styles.linkText}>
            admin@brahmgyanyogsansthan.org
          </CustomText>
          <View style={styles.actionHint}>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    paddingTop: Platform.OS === 'ios' ? 50 : 40
  },
  backButton: {
    padding: 5
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 15
  },
  content: {
    flex: 1,
    padding: 15
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 15
  },
  label: {
    color: '#000',
    marginBottom: 10
  },
  text: {
    color: '#333',
    marginBottom: 5,
    lineHeight: 24
  },
  linkText: {
    color: '#000066',
    marginBottom: 5,
    lineHeight: 24
  },
  actionHint: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -10
  }
});

export default ContactUs;
