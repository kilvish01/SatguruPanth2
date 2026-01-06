import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../../../components/shared/CustomText';
import { bookAPI } from '../../../services/bookService';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GRID_SPACING = 16;
const ITEM_WIDTH = (width - GRID_SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

const AllBooks = ({ route, navigation }) => {
  const { books, title } = route.params;

  const renderBook = ({ item }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => navigation.navigate('bookReader', { book: item })}
    >
      <Image
        source={require('../../../assets/images/icon.png')}
        style={styles.bookCover}
      />
      <View style={styles.bookInfo}>
        <CustomText
          variant="h6"
          fontFamily="Bold"
          numberOfLines={2}
          style={styles.bookTitle}
        >
          {item.title}
        </CustomText>
        <CustomText
          variant="h8"
          fontFamily="Regular"
          numberOfLines={1}
          style={styles.bookDate}
        >
          {new Date(item.uploadDate).toLocaleDateString()}
        </CustomText>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <CustomText variant="h4" fontFamily="Bold">
            {title || 'All Books'}
          </CustomText>
        </View>
      </View>

      {books.length === 0 ? (
        <View style={styles.centered}>
          <CustomText variant="h5">No books available</CustomText>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBook}
          keyExtractor={(item) => item._id}
          numColumns={COLUMN_COUNT}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bookGrid}
        />
      )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bookGrid: {
    paddingBottom: 20,
    paddingHorizontal: 8
  },
  bookCard: {
    width: ITEM_WIDTH,
    marginHorizontal: GRID_SPACING / 2,
    marginBottom: GRID_SPACING,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  bookCover: {
    width: '100%',
    height: ITEM_WIDTH * 1.4,
    resizeMode: 'cover'
  },
  bookInfo: {
    padding: 12
  },
  bookTitle: {
    color: '#000',
    marginBottom: 4
  },
  bookDate: {
    color: '#666'
  }
});

export default AllBooks;
