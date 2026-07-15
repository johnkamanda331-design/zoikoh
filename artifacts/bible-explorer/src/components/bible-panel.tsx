import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBiblePanelStore } from '@/hooks/use-bible-panel';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  List,
  Search,
  Bookmark,
  Star,
  BookOpen,
  Sparkles,
  Share2,
  PenSquare,
  Clock3,
  ListChecks,
  MoonStar,
  SunMedium,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadPreferences, savePreferences } from '@/lib/preferences';

/* ── Constants ─────────────────────────────────────────────────────────── */
const BIBLE_BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
  'Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
  'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah',
  'Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians',
  '2 Corinthians','Galatians','Ephesians','Philippians','Colossians',
  '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon',
  'Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation',
];

const CHAPTER_COUNTS: Record<string, number> = {
  'Genesis':50,'Exodus':40,'Leviticus':27,'Numbers':36,'Deuteronomy':34,
  'Joshua':24,'Judges':21,'Ruth':4,'1 Samuel':31,'2 Samuel':24,'1 Kings':22,
  '2 Kings':25,'1 Chronicles':29,'2 Chronicles':36,'Ezra':10,'Nehemiah':13,
  'Esther':10,'Job':42,'Psalms':150,'Proverbs':31,'Ecclesiastes':12,
  'Song of Solomon':8,'Isaiah':66,'Jeremiah':52,'Lamentations':5,'Ezekiel':48,
  'Daniel':12,'Hosea':14,'Joel':3,'Amos':9,'Obadiah':1,'Jonah':4,'Micah':7,
  'Nahum':3,'Habakkuk':3,'Zephaniah':3,'Haggai':2,'Zechariah':14,'Malachi':4,
  'Matthew':28,'Mark':16,'Luke':24,'John':21,'Acts':28,'Romans':16,
  '1 Corinthians':16,'2 Corinthians':13,'Galatians':6,'Ephesians':6,
  'Philippians':4,'Colossians':4,'1 Thessalonians':5,'2 Thessalonians':3,
  '1 Timothy':6,'2 Timothy':4,'Titus':3,'Philemon':1,'Hebrews':13,'James':5,
  '1 Peter':5,'2 Peter':3,'1 John':5,'2 John':1,'3 John':1,'Jude':1,'Revelation':22,
};

type Translation = 'NIV' | 'KJV' | 'NLT' | 'ESV' | 'NKJV';

type ReadingNote = { text: string; highlighted: boolean; createdAt: string };

/* Translations available on bolls.life */
const TRANSLATIONS: Array<{ code: Translation; label: string }> = [
  { code: 'NIV', label: 'NIV – New International' },
  { code: 'KJV', label: 'KJV – King James (1769)' },
  { code: 'NLT', label: 'NLT – New Living Translation' },
  { code: 'ESV', label: 'ESV – English Standard' },
  { code: 'NKJV', label: 'NKJV – New King James' },
];

const CHAPTER_SUMMARIES: Record<string, Record<number, string>> = {
  John: {
    1: 'John chapter 1 introduces the eternal Word and the beginning of Jesus’ ministry among people.',
    3: 'John chapter 3 focuses on new birth, faith, and the promise of eternal life.',
    14: 'John chapter 14 is a comfort chapter about Jesus’ presence, peace, and the Father’s house.',
  },
  Psalms: {
    23: 'Psalm 23 is a peaceful meditation on God’s care, guidance, and protection.',
    91: 'Psalm 91 speaks of refuge, safety, and confidence in God’s presence.',
  },
  Genesis: {
    1: 'Genesis 1 describes the creation of the world and the goodness of God’s design.',
  },
};

const DAILY_QUOTES = [
  '“The Lord is near to all who call on Him.” — Psalm 145:18',
  '“Be still, and know that I am God.” — Psalm 46:10',
  '“Take heart; I have overcome the world.” — John 16:33',
];

type Mood = 'peace' | 'focus' | 'encouragement';

const MOOD_RECOMMENDATIONS: Record<Mood, { title: string; book: string; chapter: number; text: string }> = {
  peace: { title: 'Peace', book: 'Psalms', chapter: 23, text: 'Try Psalm 23 for a calm heart and a steady sense of rest.' },
  focus: { title: 'Focus', book: 'Proverbs', chapter: 3, text: 'Proverbs 3 helps sharpen attention and steady the mind for the day ahead.' },
  encouragement: { title: 'Encouragement', book: 'John', chapter: 14, text: 'John 14 offers comfort and confidence in the presence of Jesus.' },
};

function cleanVerse(text: string) {
  return text
    .replace(/<S>\d+<\/S>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(nbsp|#160);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface VerseData { pk: number; verse: number; text: string }

function parseVerseContent(text: string) {
  const parts: Array<{ type: 'heading' | 'text'; content: string }> = [];
  const headingRegex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
  let lastIndex = 0;

  for (const match of text.matchAll(headingRegex)) {
    const before = cleanVerse(text.slice(lastIndex, match.index ?? lastIndex));
    if (before) parts.push({ type: 'text', content: before });

    const headingText = cleanVerse(match[2] ?? '');
    if (headingText) parts.push({ type: 'heading', content: headingText });

    lastIndex = (match.index ?? lastIndex) + match[0].length;
  }

  const tail = cleanVerse(text.slice(lastIndex));
  if (tail) parts.push({ type: 'text', content: tail });

  return parts.filter((part) => part.content.length > 0);
}

type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const fontSizes: FontSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const fontClasses: Record<FontSize, string> = {
  xs: 'text-xs leading-[1.7]',
  sm: 'text-sm leading-[1.8]',
  md: 'text-base leading-[1.9]',
  lg: 'text-[1.125rem] leading-[2] font-medium',
  xl: 'text-[1.25rem] leading-[2.1] font-medium',
};
const fontLabels: Record<FontSize, string> = { xs: 'XS', sm: 'S', md: 'M', lg: 'L', xl: 'XL' };

/* ── Panel ─────────────────────────────────────────────────────────────── */
export function BiblePanel() {
  const { isOpen, close } = useBiblePanelStore();
  const initialPrefs = loadPreferences();

  const [prefs, setPrefs] = useState(initialPrefs);
  const [translation, setTranslation] = useState<Translation>((initialPrefs.translation as Translation | undefined) ?? 'NIV');
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [showBookList, setShowBookList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [notes, setNotes] = useState<Record<string, ReadingNote>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentChapters, setRecentChapters] = useState<string[]>([]);
  const [studyList, setStudyList] = useState<string[]>([]);
  const [readingPlan, setReadingPlan] = useState({ completedToday: false, streak: 0, target: 7 });
  const [mood, setMood] = useState<Mood>('focus');
  const [chapterCache, setChapterCache] = useState<Record<string, VerseData[]>>({});
  const [layoutMode, setLayoutMode] = useState<'comfortable' | 'compact'>((initialPrefs.readingDensity as 'comfortable' | 'compact' | undefined) ?? 'comfortable');
  const [lineSpacing, setLineSpacing] = useState<'comfortable' | 'relaxed'>((initialPrefs.lineSpacing as 'comfortable' | 'relaxed' | undefined) ?? 'comfortable');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chapterKey = `${translation}:${book}:${chapter}`;
  const noteKey = activeVerse ? `${chapterKey}:${activeVerse}` : '';
  const currentNote = noteKey ? notes[noteKey] : undefined;
  const isBookmarked = bookmarks.includes(chapterKey);
  const isFavorite = favorites.includes(chapterKey);
  const summary = CHAPTER_SUMMARIES[book]?.[chapter] ?? `A calm reading of ${book} chapter ${chapter} can help you reflect and pray.`;
  const dailyQuote = DAILY_QUOTES[new Date().getDay() % DAILY_QUOTES.length];
  const activeMood = MOOD_RECOMMENDATIONS[mood];

  const filteredVerses = searchQuery
    ? verses.filter((verse) => {
        const text = cleanVerse(verse.text).toLowerCase();
        return text.includes(searchQuery.toLowerCase()) || String(verse.verse).includes(searchQuery);
      })
    : verses;

  useEffect(() => {
    try {
      const savedNotes = JSON.parse(localStorage.getItem('zoiko-bible-notes') ?? '{}');
      const savedBookmarks = JSON.parse(localStorage.getItem('zoiko-bible-bookmarks') ?? '[]');
      const savedFavorites = JSON.parse(localStorage.getItem('zoiko-bible-favorites') ?? '[]');
      const savedRecent = JSON.parse(localStorage.getItem('zoiko-bible-recent') ?? '[]');
      const savedStudy = JSON.parse(localStorage.getItem('zoiko-bible-study-list') ?? '[]');
      const savedPlan = JSON.parse(localStorage.getItem('zoiko-bible-plan') ?? '{"completedToday":false,"streak":0,"target":7}');
      setNotes(savedNotes);
      setBookmarks(savedBookmarks);
      setFavorites(savedFavorites);
      setRecentChapters(savedRecent);
      setStudyList(savedStudy);
      setReadingPlan(savedPlan);
    } catch {
      // ignore storage errors and keep defaults
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('zoiko-bible-notes', JSON.stringify(notes));
    } catch {
      // ignore storage errors
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem('zoiko-bible-bookmarks', JSON.stringify(bookmarks));
    } catch {
      // ignore storage errors
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem('zoiko-bible-favorites', JSON.stringify(favorites));
    } catch {
      // ignore storage errors
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('zoiko-bible-recent', JSON.stringify(recentChapters));
    } catch {
      // ignore storage errors
    }
  }, [recentChapters]);

  useEffect(() => {
    try {
      localStorage.setItem('zoiko-bible-study-list', JSON.stringify(studyList));
    } catch {
      // ignore storage errors
    }
  }, [studyList]);

  useEffect(() => {
    try {
      localStorage.setItem('zoiko-bible-plan', JSON.stringify(readingPlan));
    } catch {
      // ignore storage errors
    }
  }, [readingPlan]);

  /* Keyboard close */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, close]);

  /* Scroll to top on chapter change */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [book, chapter]);

  const fetchChapter = useCallback(async () => {
    if (!isOpen) return;

    const cached = chapterCache[chapterKey];
    if (cached) {
      setVerses(cached);
      setError('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setVerses([]);

    const idx = BIBLE_BOOKS.indexOf(book) + 1;
    if (idx === 0) {
      setError('Unknown book selected.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`https://bolls.life/get-chapter/${translation}/${idx}/${chapter}/`);
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Rate limited by the Bible source. Please try again shortly.');
        }
        throw new Error(`${res.status} – failed to load chapter`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Unexpected response from Bible source.');
      }

      setVerses(data);
      setChapterCache((prev) => ({ ...prev, [chapterKey]: data }));
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong while loading the chapter.');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, translation, book, chapter, chapterKey, chapterCache]);

  const syncPreferences = useCallback(() => {
    const latestPrefs = loadPreferences();
    setPrefs(latestPrefs);
    setTranslation((latestPrefs.translation as Translation | undefined) ?? 'NIV');
    setLayoutMode((latestPrefs.readingDensity as 'comfortable' | 'compact' | undefined) ?? 'comfortable');
    setLineSpacing((latestPrefs.lineSpacing as 'comfortable' | 'relaxed' | undefined) ?? 'comfortable');
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    syncPreferences();
  }, [isOpen, syncPreferences]);

  useEffect(() => {
    if (!isOpen) return;
    const latestPrefs = loadPreferences();
    if (latestPrefs.translation !== translation) {
      setTranslation(latestPrefs.translation as Translation);
      return;
    }
    fetchChapter();
  }, [isOpen, fetchChapter, translation]);

  useEffect(() => {
    const handlePreferencesChanged = (event: Event) => {
      const nextPrefs = (event as CustomEvent).detail as ReturnType<typeof loadPreferences> | undefined;
      if (nextPrefs?.translation) {
        setPrefs(nextPrefs);
        setTranslation(nextPrefs.translation as Translation);
        setLayoutMode((nextPrefs.readingDensity as 'comfortable' | 'compact' | undefined) ?? 'comfortable');
        setLineSpacing((nextPrefs.lineSpacing as 'comfortable' | 'relaxed' | undefined) ?? 'comfortable');
      } else {
        syncPreferences();
      }
    };

    window.addEventListener('zoiko-preferences-changed', handlePreferencesChanged as EventListener);
    return () => window.removeEventListener('zoiko-preferences-changed', handlePreferencesChanged as EventListener);
  }, [syncPreferences]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      localStorage.setItem('zoiko-bible-last-reading', JSON.stringify({ translation, book, chapter, timestamp: new Date().toISOString() }));
    } catch {
      // ignore storage errors
    }
    setRecentChapters((prev) => {
      const next = [chapterKey, ...prev.filter((item) => item !== chapterKey)].slice(0, 6);
      return next;
    });
  }, [book, chapter, translation, isOpen, chapterKey]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const restored = JSON.parse(localStorage.getItem('zoiko-bible-last-reading') ?? 'null');
      if (restored?.book && restored?.chapter) {
        setBook(restored.book);
        setChapter(restored.chapter);
        setTranslation(restored.translation ?? translation);
      }
    } catch {
      // ignore storage errors
    }
  }, [isOpen]);

  const prevChapter = () => {
    if (chapter > 1) {
      setChapter((c) => c - 1);
      return;
    }
    const i = BIBLE_BOOKS.indexOf(book);
    if (i > 0) {
      const b = BIBLE_BOOKS[i - 1];
      setBook(b);
      setChapter(CHAPTER_COUNTS[b]);
    }
  };

  const nextChapter = () => {
    if (chapter < CHAPTER_COUNTS[book]) {
      setChapter((c) => c + 1);
      return;
    }
    const i = BIBLE_BOOKS.indexOf(book);
    if (i < BIBLE_BOOKS.length - 1) {
      setBook(BIBLE_BOOKS[i + 1]);
      setChapter(1);
    }
  };

  const handleTranslationChange = (value: string) => {
    const nextTranslation = value as Translation;
    if (TRANSLATIONS.some((t) => t.code === nextTranslation)) {
      setTranslation(nextTranslation);
      savePreferences({ translation: nextTranslation });
    }
  };

  const decreaseFontSize = () => {
    setFontSize((f) => {
      const idx = fontSizes.indexOf(f);
      return idx > 0 ? fontSizes[idx - 1] : f;
    });
  };

  const increaseFontSize = () => {
    setFontSize((f) => {
      const idx = fontSizes.indexOf(f);
      return idx < fontSizes.length - 1 ? fontSizes[idx + 1] : f;
    });
  };

  const toggleBookmark = () => {
    setBookmarks((prev) => (prev.includes(chapterKey) ? prev.filter((item) => item !== chapterKey) : [...prev, chapterKey]));
  };

  const toggleFavorite = () => {
    setFavorites((prev) => (prev.includes(chapterKey) ? prev.filter((item) => item !== chapterKey) : [...prev, chapterKey]));
  };

  const addToStudyList = () => {
    setStudyList((prev) => (prev.includes(chapterKey) ? prev : [...prev, chapterKey]));
  };

  const saveNote = () => {
    if (!noteKey || !activeVerse) return;
    setNotes((prev) => ({
      ...prev,
      [noteKey]: {
        text: noteDraft,
        highlighted: Boolean(prev[noteKey]?.highlighted || noteDraft.trim()),
        createdAt: new Date().toISOString(),
      },
    }));
    setNoteDraft('');
    setActiveVerse(null);
  };

  const toggleHighlight = (verse: number) => {
    const verseKey = `${chapterKey}:${verse}`;
    setNotes((prev) => {
      const current = prev[verseKey];
      return {
        ...prev,
        [verseKey]: {
          text: current?.text ?? '',
          highlighted: !current?.highlighted,
          createdAt: current?.createdAt ?? new Date().toISOString(),
        },
      };
    });
  };

  const sharePassage = async () => {
    const text = `${book} ${chapter}\n${verses.slice(0, 6).map((verse) => `${verse.verse}. ${cleanVerse(verse.text)}`).join('\n')}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${book} ${chapter}`, text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // ignore share interruptions
    }
  };

  const handleSwipeEnd = (endX: number) => {
    if (touchStartX === null) return;
    const delta = endX - touchStartX;
    if (delta > 60) {
      prevChapter();
    } else if (delta < -60) {
      nextChapter();
    }
    setTouchStartX(null);
  };

  const updateReadingPreference = (key: 'readingDensity' | 'lineSpacing', value: 'comfortable' | 'compact' | 'relaxed') => {
    const nextPrefs = savePreferences({ [key]: value } as any);
    setPrefs(nextPrefs);
    if (key === 'readingDensity') setLayoutMode(value as 'comfortable' | 'compact');
    else setLineSpacing(value as 'comfortable' | 'relaxed');
  };

  const handleMoodSelect = (nextMood: Mood) => {
    const recommendation = MOOD_RECOMMENDATIONS[nextMood];
    setMood(nextMood);
    setBook(recommendation.book);
    setChapter(recommendation.chapter);
  };

  const recommendedReading = recentChapters[0]
    ? recentChapters[0].split(':').slice(1).join(' · ')
    : `${book} ${chapter}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[160] flex items-end justify-end pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 pointer-events-auto"
            onClick={close}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative w-full md:w-[75vw] md:max-w-[900px] h-[92dvh] md:h-[100dvh] pointer-events-auto flex flex-col shadow-2xl rounded-t-3xl md:rounded-none"
            style={{ background: 'hsl(var(--card))', borderLeft: '1px solid hsl(var(--border))' }}
          >
            <div
              className="shrink-0 flex items-center justify-between gap-2 px-4 h-14 border-b"
              style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
            >
              <Select value={translation} onValueChange={handleTranslationChange}>
                <SelectTrigger
                  className="w-[130px] h-8 text-xs font-bold border-none focus:ring-0"
                  style={{ background: 'hsl(var(--secondary))' }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {TRANSLATIONS.map((t) => (
                    <SelectItem key={t.code} value={t.code} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center rounded-lg overflow-hidden" style={{ background: 'hsl(var(--secondary))' }}>
                <button
                  onClick={prevChapter}
                  disabled={book === 'Genesis' && chapter === 1}
                  className="h-8 w-8 flex items-center justify-center disabled:opacity-30 hover:opacity-70 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} />
                </button>
                <button
                  onClick={() => setShowBookList((v) => !v)}
                  className="h-8 px-2 text-xs font-bold min-w-[110px] text-center hover:opacity-70 transition-opacity"
                  style={{ color: 'hsl(var(--foreground))' }}
                >
                  {book} {chapter}
                </button>
                <button
                  onClick={nextChapter}
                  disabled={book === 'Revelation' && chapter === 22}
                  className="h-8 w-8 flex items-center justify-center disabled:opacity-30 hover:opacity-70 transition-opacity"
                >
                  <ChevronRight className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} />
                </button>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={decreaseFontSize}
                  disabled={fontSize === 'xs'}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:opacity-70 transition-opacity disabled:opacity-30"
                  style={{ background: 'hsl(var(--secondary))' }}
                  title="Decrease font size"
                >
                  <span className="font-heading font-black text-xs leading-none" style={{ color: 'hsl(var(--foreground))' }}>
                    A−
                  </span>
                </button>
                <span className="font-heading font-bold text-[10px] w-5 text-center select-none" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {fontLabels[fontSize]}
                </span>
                <button
                  onClick={increaseFontSize}
                  disabled={fontSize === 'xl'}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:opacity-70 transition-opacity disabled:opacity-30"
                  style={{ background: 'hsl(var(--secondary))' }}
                  title="Increase font size"
                >
                  <span className="font-heading font-black text-xs leading-none" style={{ color: 'hsl(var(--foreground))' }}>
                    A+
                  </span>
                </button>
                <button
                  onClick={() => setShowBookList((v) => !v)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:opacity-70 transition-opacity"
                  style={{ background: 'hsl(var(--secondary))' }}
                  title="Book list"
                >
                  <List className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} />
                </button>
                <button onClick={close} className="h-8 w-8 flex items-center justify-center rounded-md hover:opacity-70 transition-opacity" title="Close">
                  <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showBookList && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 240 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="shrink-0 overflow-y-auto border-b"
                  style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
                >
                  <div className="grid grid-cols-3 gap-1 p-3">
                    {BIBLE_BOOKS.map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          setBook(b);
                          setChapter(1);
                          setShowBookList(false);
                        }}
                        className={`text-xs text-left px-2 py-1.5 rounded-md transition-colors ${b === book ? 'font-bold' : 'hover:opacity-70'}`}
                        style={{
                          color: b === book ? 'hsl(var(--brand-purple))' : 'hsl(var(--foreground))',
                          background: b === book ? 'hsl(var(--brand-purple) / 0.12)' : 'transparent',
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto scroll-smooth"
              style={{ background: 'hsl(var(--background))' }}
              onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
              onTouchEnd={(event) => handleSwipeEnd(event.changedTouches[0]?.clientX ?? 0)}
            >
              <div className="p-6 md:p-8 pb-24">
                {isLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="h-4 rounded" style={{ width: `${60 + (i % 4) * 10}%`, background: 'hsl(var(--muted))' }} />
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-10 font-medium text-sm" style={{ color: 'hsl(var(--destructive))' }}>
                    {error}
                    <button onClick={fetchChapter} className="block mx-auto mt-4 text-xs underline" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Retry
                    </button>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`space-y-4 ${fontClasses[fontSize]}`}>
                    <div className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h1 className="text-2xl md:text-3xl font-heading font-extrabold" style={{ color: 'hsl(var(--foreground))' }}>
                            {book} — Chapter {chapter}
                          </h1>
                          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {translation} • {recentChapters.length} recent stops • {studyList.length} study items
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={toggleBookmark} className="rounded-full">
                            <Bookmark className={`mr-2 h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                            {isBookmarked ? 'Saved' : 'Save'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={toggleFavorite} className="rounded-full">
                            <Star className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                            {isFavorite ? 'Loved' : 'Like'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                          Reading streak: {readingPlan.streak} days
                        </span>
                        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                          Continue: {recommendedReading}
                        </span>
                        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))' }}>
                          Layout: {layoutMode}
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full" style={{ background: 'hsl(var(--secondary))' }}>
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (readingPlan.streak / readingPlan.target) * 100)}%`, background: 'hsl(var(--brand-purple))' }} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={sharePassage} className="rounded-full">
                          <Share2 className="mr-2 h-4 w-4" /> Share
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Search className="h-4 w-4" style={{ color: 'hsl(var(--brand-purple))' }} />
                        <h2 className="text-sm font-semibold">Find a passage</h2>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center rounded-xl border px-3 py-2" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--secondary))' }}>
                          <Search className="mr-2 h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                          <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search verses or books"
                            className="w-full bg-transparent text-sm outline-none"
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>Clear</Button>
                      </div>
                      {searchQuery ? (
                        <p className="mt-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Showing {filteredVerses.length} matching verse{filteredVerses.length === 1 ? '' : 's'} for “{searchQuery}”.
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border p-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4" style={{ color: 'hsl(var(--brand-purple))' }} />
                          <h3 className="text-sm font-semibold">Chapter summary</h3>
                        </div>
                        <p className="text-sm leading-6" style={{ color: 'hsl(var(--foreground))' }}>{summary}</p>
                      </div>
                      <div className="rounded-2xl border p-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4" style={{ color: 'hsl(var(--brand-purple))' }} />
                          <h3 className="text-sm font-semibold">Daily inspiration</h3>
                        </div>
                        <p className="text-sm leading-6" style={{ color: 'hsl(var(--foreground))' }}>{dailyQuote}</p>
                        <p className="mt-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{activeMood.text}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(['peace', 'focus', 'encouragement'] as const).map((option) => (
                          <button
                            key={option}
                            onClick={() => handleMoodSelect(option)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${mood === option ? 'text-white' : ''}`}
                            style={{ background: mood === option ? 'hsl(var(--brand-purple))' : 'hsl(var(--secondary))', color: mood === option ? 'white' : 'hsl(var(--foreground))' }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => updateReadingPreference('readingDensity', layoutMode === 'comfortable' ? 'compact' : 'comfortable')} className="rounded-full">
                          {layoutMode === 'comfortable' ? <MoonStar className="mr-2 h-4 w-4" /> : <SunMedium className="mr-2 h-4 w-4" />}
                          {layoutMode === 'comfortable' ? 'Compact view' : 'Comfort view'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => updateReadingPreference('lineSpacing', lineSpacing === 'comfortable' ? 'relaxed' : 'comfortable')} className="rounded-full">
                          <RefreshCw className="mr-2 h-4 w-4" /> {lineSpacing === 'comfortable' ? 'Relaxed spacing' : 'Compact spacing'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={addToStudyList} className="rounded-full">
                          <ListChecks className="mr-2 h-4 w-4" /> Add to study list
                        </Button>
                      </div>
                    </div>

                    {noteKey ? (
                      <div className="rounded-2xl border p-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <PenSquare className="h-4 w-4" style={{ color: 'hsl(var(--brand-purple))' }} />
                          <h3 className="text-sm font-semibold">Verse notes</h3>
                        </div>
                        <textarea
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          rows={3}
                          placeholder="Save a quick note for this verse"
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--secondary))' }}
                        />
                        <div className="mt-3 flex items-center gap-2">
                          <Button size="sm" onClick={saveNote} className="rounded-full">Save note</Button>
                          <Button variant="outline" size="sm" onClick={() => setActiveVerse(null)} className="rounded-full">Cancel</Button>
                        </div>
                        {currentNote?.text ? (
                          <p className="mt-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Saved note: {currentNote.text}</p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      {filteredVerses.map((v) => {
                        const verseNote = notes[`${chapterKey}:${v.verse}`];
                        const isHighlighted = Boolean(verseNote?.highlighted);
                        return (
                          <div key={v.pk} className={`rounded-2xl border p-3 transition-all ${isHighlighted ? 'border-brand-purple/70' : ''}`} style={{ borderColor: isHighlighted ? 'hsl(var(--brand-purple))' : 'hsl(var(--border))', background: isHighlighted ? 'hsl(var(--brand-purple) / 0.08)' : 'transparent' }}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm leading-relaxed flex-1">
                                <span className="font-semibold text-sm select-none pt-1" style={{ color: 'hsl(var(--brand-purple))' }}>
                                  {v.verse}
                                </span>
                                <div className="flex flex-col gap-2">
                                  {parseVerseContent(v.text).map((part, index) =>
                                    part.type === 'heading' ? (
                                      <div key={`${v.pk}-heading-${index}`} className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: 'hsl(var(--brand-purple))' }}>
                                        {part.content}
                                      </div>
                                    ) : (
                                      <span key={`${v.pk}-text-${index}`} className="bible-verse-text text-base text-foreground">
                                        {part.content}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <button onClick={() => { setActiveVerse(v.verse); setNoteDraft(verseNote?.text ?? ''); }} className="rounded-full p-1.5" style={{ background: 'hsl(var(--secondary))' }} title="Add note">
                                  <PenSquare className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => toggleHighlight(v.verse)} className="rounded-full p-1.5" style={{ background: isHighlighted ? 'hsl(var(--brand-purple))' : 'hsl(var(--secondary))', color: isHighlighted ? 'white' : 'hsl(var(--foreground))' }} title="Highlight verse">
                                  <Sparkles className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            {verseNote?.text ? <p className="mt-2 text-xs italic" style={{ color: 'hsl(var(--muted-foreground))' }}>Note: {verseNote.text}</p> : null}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between pt-10 pb-4 border-t mt-10" style={{ borderColor: 'hsl(var(--border))' }}>
                      <button onClick={prevChapter} disabled={book === 'Genesis' && chapter === 1} className="flex items-center gap-1.5 text-sm font-semibold disabled:opacity-30 hover:opacity-70 transition-opacity" style={{ color: 'hsl(var(--foreground))' }}>
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>
                      <button onClick={nextChapter} disabled={book === 'Revelation' && chapter === 22} className="flex items-center gap-1.5 text-sm font-semibold disabled:opacity-30 hover:opacity-70 transition-opacity" style={{ color: 'hsl(var(--foreground))' }}>
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
