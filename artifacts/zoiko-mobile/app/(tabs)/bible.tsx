import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const TRANSLATIONS = ['NIV', 'KJV', 'ESV', 'NLT', 'NKJV', 'AMP', 'NASB', 'CSB'];
const STORAGE_KEY = 'bible_position';

interface Book {
  bookid: number;
  name: string;
  chapters: number;
}

interface Verse {
  pk: number;
  verse: number;
  text: string;
}

interface BiblePosition {
  translation: string;
  bookId: number;
  bookName: string;
  chapter: number;
}

function stripHtml(text: string) {
  return text.replace(/<[^>]*>/g, '');
}

export default function BibleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);

  const [translation, setTranslation] = useState('NIV');
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState(1);
  const [bookName, setBookName] = useState('Genesis');
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [totalChapters, setTotalChapters] = useState(50);

  // Load saved position
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const pos: BiblePosition = JSON.parse(raw);
        setTranslation(pos.translation);
        setBookId(pos.bookId);
        setBookName(pos.bookName);
        setChapter(pos.chapter);
      }
    });
  }, []);

  // Save position
  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ translation, bookId, bookName, chapter }),
    );
  }, [translation, bookId, bookName, chapter]);

  // Fetch books
  const fetchBooks = useCallback(async (trans: string) => {
    setLoadingBooks(true);
    setError(null);
    try {
      const res = await fetch(`https://bolls.life/get-books/${trans}/`);
      const data: Book[] = await res.json();
      setBooks(data);
      const currentBook = data.find((b) => b.bookid === bookId);
      if (currentBook) setTotalChapters(currentBook.chapters);
    } catch {
      setError('Failed to load books.');
    } finally {
      setLoadingBooks(false);
    }
  }, [bookId]);

  useEffect(() => { fetchBooks(translation); }, [translation]);

  // Fetch verses
  const fetchVerses = useCallback(async () => {
    setLoadingVerses(true);
    setError(null);
    try {
      const res = await fetch(
        `https://bolls.life/get-chapter/${translation}/${bookId}/${chapter}/`,
      );
      const data: Verse[] = await res.json();
      setVerses(data);
    } catch {
      setError('Failed to load chapter. Tap to retry.');
    } finally {
      setLoadingVerses(false);
    }
  }, [translation, bookId, chapter]);

  useEffect(() => { fetchVerses(); }, [fetchVerses]);

  const selectBook = (book: Book) => {
    setBookId(book.bookid);
    setBookName(book.name);
    setTotalChapters(book.chapters);
    setChapter(1);
    setBookModalVisible(false);
  };

  const prevChapter = () => { if (chapter > 1) setChapter((c) => c - 1); };
  const nextChapter = () => { if (chapter < totalChapters) setChapter((c) => c + 1); };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Translation selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.translationBar}
        contentContainerStyle={styles.translationContent}
      >
        {TRANSLATIONS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.pill, translation === t && styles.pillActive]}
            onPress={() => setTranslation(t)}
          >
            <Text style={[styles.pillText, translation === t && styles.pillTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Book selector + chapter nav */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => setBookModalVisible(true)}
        >
          <Text style={styles.bookName}>{bookName}</Text>
          <Text style={styles.bookChevron}>▾</Text>
        </TouchableOpacity>
        <View style={styles.chapterNav}>
          <TouchableOpacity onPress={prevChapter} style={styles.navArrow} disabled={chapter <= 1}>
            <Text style={[styles.navArrowText, chapter <= 1 && styles.navArrowDisabled]}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.chapterLabel}>Chapter {chapter}</Text>
          <TouchableOpacity onPress={nextChapter} style={styles.navArrow} disabled={chapter >= totalChapters}>
            <Text style={[styles.navArrowText, chapter >= totalChapters && styles.navArrowDisabled]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Verses */}
      {loadingVerses ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : error ? (
        <TouchableOpacity style={styles.errorContainer} onPress={fetchVerses}>
          <Text style={styles.errorText}>{error}</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={verses}
          keyExtractor={(v) => v.pk.toString()}
          contentContainerStyle={[styles.verseList, { paddingBottom: insets.bottom + 100 }]}
          renderItem={({ item }) => (
            <View style={styles.verseRow}>
              <Text style={styles.verseNum}>{item.verse}</Text>
              <Text style={styles.verseText}>{stripHtml(item.text)}</Text>
            </View>
          )}
        />
      )}

      {/* Book Modal */}
      <Modal
        visible={bookModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBookModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Book</Text>
            <TouchableOpacity onPress={() => setBookModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {loadingBooks ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={books}
              keyExtractor={(b) => b.bookid.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.bookItem, item.bookid === bookId && styles.bookItemActive]}
                  onPress={() => selectBook(item)}
                >
                  <Text style={[styles.bookItemText, item.bookid === bookId && styles.bookItemTextActive]}>
                    {item.name}
                  </Text>
                  <Text style={styles.bookChapters}>{item.chapters} ch</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    translationBar: { maxHeight: 52 },
    translationContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    pillText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
    pillTextActive: { color: colors.primaryForeground },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bookButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bookName: { fontSize: 18, fontWeight: '700', color: colors.foreground },
    bookChevron: { fontSize: 14, color: colors.muted },
    chapterNav: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    navArrow: { padding: 4 },
    navArrowText: { fontSize: 24, fontWeight: '700', color: colors.primary },
    navArrowDisabled: { color: colors.border },
    chapterLabel: { fontSize: 15, fontWeight: '600', color: colors.foreground, minWidth: 90, textAlign: 'center' },
    loader: { flex: 1, marginTop: 40 },
    errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    errorText: { fontSize: 15, color: colors.destructive, textAlign: 'center' },
    verseList: { paddingHorizontal: 16, paddingTop: 16 },
    verseRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    verseNum: { fontSize: 12, fontWeight: '700', color: colors.primary, minWidth: 22, marginTop: 2 },
    verseText: { flex: 1, fontSize: 16, color: colors.foreground, lineHeight: 26 },
    modal: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.foreground },
    modalClose: { fontSize: 18, color: colors.muted, padding: 4 },
    bookItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bookItemActive: { backgroundColor: colors.surface2 },
    bookItemText: { fontSize: 16, color: colors.foreground },
    bookItemTextActive: { color: colors.primary, fontWeight: '700' },
    bookChapters: { fontSize: 13, color: colors.muted },
  });
}
