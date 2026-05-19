import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { bookContentAPI } from '../../../services/bookContentService';
import PdfBookReader from './PdfBookReader';
import ReflowableReader from './Reader/ReflowableReader';

// Dispatcher: checks whether reflowable content exists for this book and
// routes to the native Reflowable reader if so. Falls back to the legacy
// pdf.js WebView reader otherwise. This lets us ship the new reader
// progressively as more books are extracted, with no client-side gates
// or feature flags.
const BookReader = (props: any) => {
  const { book } = props.route.params;
  const bookId = book?._id || book?.BookID || book?.bookId;
  const { colors } = useTheme();

  const [decided, setDecided] = useState<'reflowable' | 'pdf' | 'loading'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!bookId) {
        setDecided('pdf');
        return;
      }
      try {
        const content = await bookContentAPI.getContent(bookId);
        if (cancelled) return;
        setDecided(content ? 'reflowable' : 'pdf');
      } catch {
        if (cancelled) return;
        // On error, prefer the safer fallback rather than blocking the user.
        setDecided('pdf');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (decided === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.textSubtle, marginTop: 10, fontSize: 13 }}>Loading book…</Text>
      </View>
    );
  }

  if (decided === 'reflowable') {
    return <ReflowableReader {...props} />;
  }

  return <PdfBookReader {...props} />;
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default BookReader;
