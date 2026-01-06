import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { bookAPI } from '../../../services/bookService';
import CustomText from '../../../components/shared/CustomText';

const BooksScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const userId = 'user123';

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const booksData = await bookAPI.getAllBooks();
      setBooks(booksData);
      
      const userProgress = await bookAPI.getUserProgress(userId);
      const progressMap = {};
      userProgress.forEach(p => {
        progressMap[p.bookId._id] = p.percentage;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBook = async (book) => {
    navigation.navigate('bookReader', { book });
  };

  const renderBook = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => openBook(item)}
    >
      <View style={styles.bookInfo}>
        <CustomText variant="h5" fontFamily="SemiBold">
          {item.title}
        </CustomText>
        <CustomText variant="h7" style={styles.date}>
          Uploaded: {new Date(item.uploadDate).toLocaleDateString()}
        </CustomText>
        {progress[item._id] !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress[item._id]}%` }]} />
            </View>
            <CustomText variant="h7" style={styles.progressText}>
              {progress[item._id]}% completed
            </CustomText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000066" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomText variant="h3" fontFamily="Bold" style={styles.header}>
        Books Library
      </CustomText>
      {books.length === 0 ? (
        <View style={styles.centered}>
          <CustomText variant="h5">No books available</CustomText>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBook}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    marginVertical: 20,
    textAlign: 'center'
  },
  list: {
    paddingBottom: 20
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  bookInfo: {
    flex: 1
  },
  date: {
    color: '#666',
    marginTop: 5
  },
  progressContainer: {
    marginTop: 10
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000066',
    borderRadius: 4
  },
  progressText: {
    marginTop: 5,
    color: '#000066'
  }
});

export default BooksScreen;
