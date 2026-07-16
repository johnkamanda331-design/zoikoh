import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useBiblePanelStore } from '@/hooks/use-bible-panel';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  List,
  Bookmark,
  Star,
  BookOpen,
  Sparkles,
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
import { fetchBibleChapter, parseVerseContent, TRANSLATIONS, type Translation, type VerseData } from '@/lib/bible';
import { loadJSON, saveJSON } from '@/lib/storage';

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

type ReadingNote = { text: string; highlighted: boolean; createdAt: string };

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
  const [selectedBookForSelection, setSelectedBookForSelection] = useState<string | null>(null);
  const [showChapterSelector, setShowChapterSelector] = useState(false);
  const [showVerseSelector, setShowVerseSelector] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [notes, setNotes] = useState<Record<string, ReadingNote>>({});
  const [showSavedNotes, setShowSavedNotes] = useState(false);
  const [activeVerseMenu, setActiveVerseMenu] = useState<{ verse: number; top: number; left: number } | null>(null);
  const [showVerseActions, setShowVerseActions] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const shouldScrollToSelection = useRef(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentChapters, setRecentChapters] = useState<string[]>([]);
  const [studyList, setStudyList] = useState<string[]>([]);
  const [readingPlan, setReadingPlan] = useState({ completedToday: false, streak: 0, target: 7 });
  const [mood, setMood] = useState<Mood>('focus');
  const [chapterCache, setChapterCache] = useState<Record<string, VerseData[]>>({});
  const [chapterSummaries, setChapterSummaries] = useState<Record<string, string>>({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'comfortable' | 'compact'>((initialPrefs.readingDensity as 'comfortable' | 'compact' | undefined) ?? 'comfortable');
  const [lineSpacing, setLineSpacing] = useState<'comfortable' | 'relaxed'>((initialPrefs.lineSpacing as 'comfortable' | 'relaxed' | undefined) ?? 'comfortable');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const chapterKey = useMemo(() => `${translation}:${book}:${chapter}`, [translation, book, chapter]);
  const selectedVerseKeys = useMemo(
    () => selectedVerses.map((verse: number) => `${chapterKey}:${verse}`),
    [chapterKey, selectedVerses],
  );
  const selectedNotes = useMemo(
    () => selectedVerseKeys.map((key: string) => notes[key]).filter(Boolean),
    [notes, selectedVerseKeys],
  );
  const currentChapterNotes = useMemo(
    () => Object.entries(notes)
      .filter(([key]) => key.startsWith(`${chapterKey}:`))
      .sort(([a], [b]) => {
        const aVerse = Number(a.split(':').pop() ?? 0);
        const bVerse = Number(b.split(':').pop() ?? 0);
        return aVerse - bVerse;
      }),
    [notes, chapterKey],
  );
  const notePreview = useMemo(
    () => (selectedVerses.length === 1 ? notes[selectedVerseKeys[0]]?.text ?? '' : ''),
    [notes, selectedVerseKeys, selectedVerses.length],
  );
  const isBookmarked = useMemo(() => bookmarks.includes(chapterKey), [bookmarks, chapterKey]);
  const isFavorite = useMemo(() => favorites.includes(chapterKey), [favorites, chapterKey]);
  const summary = useMemo(() => {
    if (chapterSummaries[chapterKey]) {
      return chapterSummaries[chapterKey];
    }
    return `Loading chapter summary from AI...`;
  }, [chapterKey, chapterSummaries]);
  const dailyQuote = useMemo(() => DAILY_QUOTES[new Date().getDay() % DAILY_QUOTES.length], []);
  const activeMood = useMemo(() => MOOD_RECOMMENDATIONS[mood], [mood]);

  const filteredVerses = useMemo(() => verses, [verses]);

  useEffect(() => {
    try {
      const savedNotes = loadJSON<Record<string, ReadingNote>>('zoiko-bible-notes', {});
      const savedBookmarks = loadJSON<string[]>('zoiko-bible-bookmarks', []);
      const savedFavorites = loadJSON<string[]>('zoiko-bible-favorites', []);
      const savedRecent = loadJSON<string[]>('zoiko-bible-recent', []);
      const savedStudy = loadJSON<string[]>('zoiko-bible-study-list', []);
      const savedPlan = loadJSON<{ completedToday: boolean; streak: number; target: number }>('zoiko-bible-plan', { completedToday: false, streak: 0, target: 7 });
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
    saveJSON('zoiko-bible-notes', notes);
  }, [notes]);

  useEffect(() => {
    saveJSON('zoiko-bible-bookmarks', bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    saveJSON('zoiko-bible-favorites', favorites);
  }, [favorites]);

  useEffect(() => {
    saveJSON('zoiko-bible-recent', recentChapters);
  }, [recentChapters]);

  useEffect(() => {
    saveJSON('zoiko-bible-study-list', studyList);
  }, [studyList]);

  useEffect(() => {
    saveJSON('zoiko-bible-plan', readingPlan);
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

  useEffect(() => {
    if (!isOpen || selectedVerses.length === 0 || !shouldScrollToSelection.current) return;
    shouldScrollToSelection.current = false;
    const lastSelected = selectedVerses[selectedVerses.length - 1];
    const element = verseRefs.current[lastSelected];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  }, [selectedVerses, isOpen]);

  const fetchAbort = useRef<AbortController | null>(null);
  const fetchRequestId = useRef(0);

  const fetchChapterSummary = useCallback(async (translation: Translation, bookIdx: number, chap: number, key: string, force = false) => {
    if (!force && chapterSummaries[key]) return;
    setSummaryLoading(true);
    try {
      const resp = await fetch('/api/ai/summarize-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translation, bookIndex: bookIdx, chapter: chap }),
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => null);
        const message = errorData?.error || 'Summary request failed';
        throw new Error(message);
      }
      const data = await resp.json();
      if (data?.summary) {
        const combined = data.application ? `${data.summary}\n\nApplication: ${data.application}` : data.summary;
        setChapterSummaries((prev) => ({ ...prev, [key]: combined }));
      } else {
        throw new Error('AI did not return a valid summary.');
      }
    } catch (err: any) {
      setChapterSummaries((prev) => ({ ...prev, [key]: `Unable to generate summary: ${err.message ?? 'Unknown error'}` }));
    } finally {
      setSummaryLoading(false);
    }
  }, [chapterSummaries]);

  const fetchChapter = useCallback(async () => {
    if (!isOpen) return;

    const cached = chapterCache[chapterKey];
    if (cached) {
      setVerses(cached);
      setError('');
      setIsLoading(false);
      return;
    }

    // Abort any previous fetch and start a new one
    fetchRequestId.current += 1;
    const myId = fetchRequestId.current;
    if (fetchAbort.current) {
      try { fetchAbort.current.abort(); } catch {}
    }
    const controller = new AbortController();
    fetchAbort.current = controller;

    setIsLoading(true);
    setError('');
    setVerses([]);

    const idx = BIBLE_BOOKS.indexOf(book) + 1;
    if (idx === 0) {
      if (fetchRequestId.current === myId) {
        setError('Unknown book selected.');
        setIsLoading(false);
      }
      return;
    }

    try {
      const data = await fetchBibleChapter(translation, idx, chapter, controller.signal);
      if (fetchRequestId.current === myId) {
        setVerses(data);
        setChapterCache((prev: Record<string, VerseData[]>) => ({ ...prev, [chapterKey]: data }));
        void fetchChapterSummary(translation, idx, chapter, chapterKey).catch(() => {});
      }
    } catch (err: any) {
      if (err && err.name === 'AbortError') return;
      if (fetchRequestId.current === myId) {
        setError(err.message ?? 'Something went wrong while loading the chapter.');
      }
    } finally {
      if (fetchRequestId.current === myId) {
        setIsLoading(false);
      }
    }
  }, [isOpen, translation, book, chapter, chapterKey, chapterCache, fetchChapterSummary]);

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
    saveJSON('zoiko-bible-last-reading', { translation, book, chapter, timestamp: new Date().toISOString() });
    setRecentChapters((prev: string[]) => {
      const next = [chapterKey, ...prev.filter((item: string) => item !== chapterKey)].slice(0, 6);
      return next;
    });
  }, [book, chapter, translation, isOpen, chapterKey]);

  useEffect(() => {
    if (!isOpen) return;
    const restored = loadJSON<{ book?: string; chapter?: number; translation?: Translation } | null>('zoiko-bible-last-reading', null);
    if (restored?.book && restored?.chapter) {
      setBook(restored.book);
      setChapter(restored.chapter);
      setTranslation(restored.translation ?? translation);
    }
  }, [isOpen, translation]);

  const prevChapter = () => {
    if (chapter > 1) {
      setChapter((c: number) => c - 1);
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
      setChapter((c: number) => c + 1);
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
    setFontSize((f: FontSize) => {
      const idx = fontSizes.indexOf(f);
      return idx > 0 ? fontSizes[idx - 1] : f;
    });
  };

  const increaseFontSize = () => {
    setFontSize((f: FontSize) => {
      const idx = fontSizes.indexOf(f);
      return idx < fontSizes.length - 1 ? fontSizes[idx + 1] : f;
    });
  };

  const toggleBookmark = () => {
    setBookmarks((prev: string[]) => (prev.includes(chapterKey) ? prev.filter((item: string) => item !== chapterKey) : [...prev, chapterKey]));
  };

  const toggleFavorite = () => {
    setFavorites((prev: string[]) => (prev.includes(chapterKey) ? prev.filter((item: string) => item !== chapterKey) : [...prev, chapterKey]));
  };

  const addToStudyList = () => {
    setStudyList((prev: string[]) => (prev.includes(chapterKey) ? prev : [...prev, chapterKey]));
  };

  const saveNote = () => {
    if (!selectedVerses.length) return;
    setNotes((prev: Record<string, ReadingNote>) => {
      const next = { ...prev };
      selectedVerses.forEach((verse: number) => {
        const key = `${chapterKey}:${verse}`;
        next[key] = {
          text: noteDraft,
          highlighted: Boolean(prev[key]?.highlighted || noteDraft.trim()),
          createdAt: new Date().toISOString(),
        };
      });
      return next;
    });
    setNoteDraft('');
  };

  const toggleHighlight = (verse: number) => {
    const verseKey = `${chapterKey}:${verse}`;
    setNotes((prev: Record<string, ReadingNote>) => {
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

  const openVerseActions = (verse: number, event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const bounding = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveVerseMenu({ verse, top: bounding.top + window.scrollY + bounding.height / 2, left: bounding.left + bounding.width / 2 });
    setShowVerseActions(true);
  };

  const closeVerseActions = () => {
    setShowVerseActions(false);
    setActiveVerseMenu(null);
  };

  const handleLongPressStart = (verse: number, event: React.TouchEvent<HTMLDivElement>) => {
    event.persist?.();
    longPressTimer.current = window.setTimeout(() => openVerseActions(verse, event), 600);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const startLongPress = (verse: number, event: React.MouseEvent<HTMLDivElement>) => {
    longPressTimer.current = window.setTimeout(() => openVerseActions(verse, event), 600);
  };

  const handleVerseAction = (verse: number, action: 'note' | 'highlight') => {
    if (action === 'note') {
      toggleVerseSelection(verse);
      setNoteDraft(notes[`${chapterKey}:${verse}`]?.text ?? '');
    } else {
      toggleHighlight(verse);
    }
    closeVerseActions();
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (!activeVerseMenu) return;
    const target = event.target as HTMLElement;
    if (!target.closest('[data-verse-action-menu]')) {
      closeVerseActions();
    }
  };

  useEffect(() => {
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [activeVerseMenu]);

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

  const toggleVerseSelection = (verse: number) => {
    shouldScrollToSelection.current = true;
    setSelectedVerses((prev: number[]) => {
      if (prev.includes(verse)) {
        return prev.filter((item: number) => item !== verse);
      }
      return [...prev, verse].sort((a: number, b: number) => a - b);
    });
  };

  const clearSelection = () => {
    setSelectedVerses([]);
    setNoteDraft('');
  };

  const randomVerse = () => {
    if (!verses.length) return;
    const next = verses[Math.floor(Math.random() * verses.length)].verse;
    setSelectedVerses([next]);
    setShowVerseSelector(false);
  };

  const recommendedReading = useMemo(
    () => (recentChapters[0] ? recentChapters[0].split(':').slice(1).join(' · ') : `${book} ${chapter}`),
    [recentChapters, book, chapter],
  );

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
                  onClick={() => setShowSavedNotes((v) => !v)}
                  className={`h-8 w-8 flex items-center justify-center rounded-md hover:opacity-70 transition-opacity ${showSavedNotes ? 'bg-brand-purple/10' : ''}`}
                  style={{ background: 'hsl(var(--secondary))' }}
                  title="View saved notes"
                  aria-pressed={showSavedNotes}
                >
                  <ListChecks className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} />
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
                          // begin the selection flow: choose book → chapter → verse
                          setSelectedBookForSelection(b);
                          setShowChapterSelector(true);
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

              {showChapterSelector && selectedBookForSelection && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="shrink-0 overflow-y-auto border-b" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                  <div className="p-3">
                    <div className="text-sm font-semibold mb-2">{selectedBookForSelection} — Pick a chapter</div>
                    <div className="grid grid-cols-6 gap-2 max-h-[220px] overflow-y-auto">
                      {Array.from({ length: CHAPTER_COUNTS[selectedBookForSelection] }).map((_, i) => {
                        const ch = i + 1;
                        return (
                          <button
                            key={ch}
                            onClick={() => {
                              // apply selection
                              setBook(selectedBookForSelection);
                              setChapter(ch);
                              setShowChapterSelector(false);
                              setShowVerseSelector(true);
                              setShowBookList(false);
                            }}
                            className="text-xs px-2 py-1 rounded bg-secondary/40 hover:opacity-80"
                          >
                            {ch}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      <button onClick={() => { setShowChapterSelector(false); setSelectedBookForSelection(null); }} className="underline">Cancel</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {showSavedNotes && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="shrink-0 overflow-hidden border-b" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="text-sm font-semibold">Saved notes</div>
                        <p className="text-xs text-muted-foreground">Notes for this chapter and selected verses.</p>
                      </div>
                      <button type="button" onClick={() => setShowSavedNotes(false)} className="text-xs text-brand-purple hover:underline">Close</button>
                    </div>
                    {currentChapterNotes.length > 0 ? (
                      <div className="space-y-2">
                        {currentChapterNotes.map(([key, note]) => {
                          const verse = key.split(':').pop();
                          return (
                            <div key={key} className="rounded-2xl border p-3 bg-secondary/70" style={{ borderColor: 'hsl(var(--border))' }}>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold text-brand-purple">Verse {verse}</span>
                                {note.highlighted && <span className="text-[11px] uppercase tracking-[0.18em] text-brand-orange">Highlighted</span>}
                              </div>
                              <p className="text-sm leading-6 text-foreground">{note.text}</p>
                              <p className="mt-2 text-xs text-muted-foreground">Saved {new Date(note.createdAt).toLocaleDateString()}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No notes saved for this chapter yet. Select a verse and add one.</p>
                    )}
                  </div>
                </motion.div>
              )}

              {showVerseSelector && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="shrink-0 overflow-y-auto border-b" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                  <div className="p-3">
                    <div className="text-sm font-semibold mb-2">{book} {chapter} — Pick a verse</div>
                    <div className="grid grid-cols-8 gap-2 max-h-[220px] overflow-y-auto">
                      {verses.length ? verses.map((v) => (
                        <button
                          key={v.pk}
                          onClick={() => { toggleVerseSelection(v.verse); setShowVerseSelector(false); }}
                          className={`text-xs px-2 py-1 rounded ${selectedVerses.includes(v.verse) ? 'bg-brand-purple/15 text-brand-purple' : 'bg-secondary/40 hover:opacity-80'}`}
                          aria-pressed={selectedVerses.includes(v.verse)}
                        >
                          {v.verse}
                        </button>
                      )) : (
                        <div className="text-xs text-muted-foreground">Loading verses…</div>
                      )}
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      <button onClick={() => setShowVerseSelector(false)} className="underline">Done</button>
                    </div>
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
                      <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-extrabold" style={{ color: 'hsl(var(--foreground))' }}>
                          {book} — Chapter {chapter}
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {translation}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border p-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4" style={{ color: 'hsl(var(--brand-purple))' }} />
                          <h3 className="text-sm font-semibold">Chapter summary</h3>
                        </div>
                        <div className="flex items-start justify-between">
                          <p className="text-sm leading-6" style={{ color: 'hsl(var(--foreground))' }}>{chapterSummaries[chapterKey] ?? summary}</p>
                          <div className="ml-3">
                            {summaryLoading ? (
                              <span className="text-xs text-muted-foreground">Generating…</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const idx = BIBLE_BOOKS.indexOf(book) + 1;
                                  if (idx > 0) void fetchChapterSummary(translation, idx, chapter, chapterKey, true);
                                }}
                                className="text-xs font-semibold text-brand-blue hover:underline"
                              >
                                Regenerate summary
                              </button>
                            )}
                          </div>
                        </div>
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

                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <div className="rounded-2xl border p-4" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <PenSquare className="h-4 w-4" style={{ color: 'hsl(var(--brand-purple))' }} />
                            <div>
                              <h3 className="text-sm font-semibold">Verse notes</h3>
                              <p className="text-xs text-muted-foreground">Select one or more verses to add notes.</p>
                            </div>
                          </div>
                          <button type="button" onClick={clearSelection} className="text-xs text-brand-purple hover:underline">Clear selection</button>
                        </div>
                        <div className="mb-3 text-sm text-foreground">
                          {selectedVerses.length > 0 ? (
                            <>
                              <p className="text-xs text-muted-foreground mb-2">Selected: {selectedVerses.join(', ')}</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedVerses.map((verse) => (
                                  <span key={verse} className="rounded-full bg-secondary/40 px-2 py-1 text-xs">Verse {verse}</span>
                                ))}
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">Tap verse numbers to select them for notes.</p>
                          )}
                        </div>
                        <textarea
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          rows={4}
                          placeholder="Save a note for selected verses"
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--secondary))' }}
                        />
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button size="sm" onClick={saveNote} disabled={!selectedVerses.length || !noteDraft.trim()} className="rounded-full">Save note</Button>
                          <Button variant="outline" size="sm" onClick={clearSelection} className="rounded-full">Cancel</Button>
                          <Button variant="ghost" size="sm" onClick={randomVerse} className="rounded-full">Random verse</Button>
                        </div>
                        {selectedVerses.length === 1 && notePreview ? (
                          <p className="mt-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Saved note: {notePreview}</p>
                        ) : null}
                      </div>
                      <div className="rounded-2xl border p-4 bg-secondary/70" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--secondary))' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock3 className="h-4 w-4" style={{ color: 'hsl(var(--brand-blue))' }} />
                          <h3 className="text-sm font-semibold">Quick controls</h3>
                        </div>
                        <div className="space-y-2 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          <p><strong>Tap verse number</strong> to select multiple verses.</p>
                          <p><strong>Highlight</strong> keeps the verse visible and easy to return to.</p>
                          <p><strong>Save note</strong> stores the same note for all selected verses.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {filteredVerses.map((v) => {
                        const verseNote = notes[`${chapterKey}:${v.verse}`];
                        const isHighlighted = Boolean(verseNote?.highlighted);
                        return (
                          <div
                            key={v.pk}
                            ref={(el) => { verseRefs.current[v.verse] = el; }}
                            tabIndex={-1}
                            className={`rounded-2xl border p-3 transition-all focus-within:ring-2 focus-within:ring-brand-purple/40 ${isHighlighted ? 'border-brand-purple/70' : ''}`}
                            style={{ borderColor: isHighlighted ? 'hsl(var(--brand-purple))' : 'hsl(var(--border))', background: isHighlighted ? 'hsl(var(--brand-purple) / 0.08)' : 'transparent' }}
                            onTouchStart={(event) => handleLongPressStart(v.verse, event)}
                            onTouchEnd={handleLongPressEnd}
                            onTouchCancel={handleLongPressEnd}
                            onMouseDown={(event) => event.button === 0 && startLongPress(v.verse, event)}
                            onMouseUp={handleLongPressEnd}
                            onMouseLeave={handleLongPressEnd}
                            onContextMenu={(event) => {
                              event.preventDefault();
                              openVerseActions(v.verse, event as any);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm leading-relaxed flex-1">
                                <button
                                  type="button"
                                  onClick={() => toggleVerseSelection(v.verse)}
                                  className={`font-semibold text-sm select-none pt-1 rounded-full px-2 py-1 transition-colors ${selectedVerses.includes(v.verse) ? 'bg-brand-purple/15 text-brand-purple' : 'hover:bg-secondary/60'}`}
                                  style={{ color: 'hsl(var(--brand-purple))' }}
                                  aria-pressed={selectedVerses.includes(v.verse)}
                                  aria-label={`Select verse ${v.verse}`}
                                >
                                  {v.verse}
                                </button>
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
                                <button
                                  type="button"
                                  onClick={() => {
                                    toggleVerseSelection(v.verse);
                                    setNoteDraft(verseNote?.text ?? noteDraft);
                                  }}
                                  className="rounded-full p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
                                  style={{ background: 'hsl(var(--secondary))' }}
                                  title="Select verse for note"
                                  aria-label={`Select verse ${v.verse} for note`}
                                >
                                  <PenSquare className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleHighlight(v.verse)}
                                  className="rounded-full p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
                                  style={{ background: isHighlighted ? 'hsl(var(--brand-purple))' : 'hsl(var(--secondary))', color: isHighlighted ? 'white' : 'hsl(var(--foreground))' }}
                                  title="Highlight verse"
                                  aria-label={`${isHighlighted ? 'Remove highlight from' : 'Highlight'} verse ${v.verse}`}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            {verseNote?.text ? <p className="mt-2 text-xs italic" style={{ color: 'hsl(var(--muted-foreground))' }}>Note: {verseNote.text}</p> : null}
                          </div>
                        );
                      })}
                      {showVerseActions && activeVerseMenu && (
                        <div
                          data-verse-action-menu
                          className="fixed z-[200] min-w-[220px] rounded-2xl border bg-card p-3 shadow-xl"
                          style={{ top: activeVerseMenu.top, left: activeVerseMenu.left, transform: 'translate(-50%, -50%)' }}
                        >
                          <div className="text-xs font-semibold text-muted-foreground mb-2">Verse {activeVerseMenu.verse}</div>
                          <button
                            type="button"
                            onClick={() => handleVerseAction(activeVerseMenu.verse, 'note')}
                            className="w-full rounded-2xl border border-border px-3 py-2 text-left text-sm font-medium hover:bg-secondary/70"
                          >
                            Add note / edit note
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerseAction(activeVerseMenu.verse, 'highlight')}
                            className="mt-2 w-full rounded-2xl border border-border px-3 py-2 text-left text-sm font-medium hover:bg-secondary/70"
                          >
                            Toggle highlight
                          </button>
                          <button
                            type="button"
                            onClick={closeVerseActions}
                            className="mt-2 w-full rounded-2xl border border-border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary/70"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
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
