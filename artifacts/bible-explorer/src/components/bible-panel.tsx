import React, { useState, useEffect, useRef } from 'react';
import { useBiblePanelStore } from '@/hooks/use-bible-panel';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

/* Translations available on bolls.life */
const TRANSLATIONS = [
  { code: 'NIV',   label: 'NIV – New International' },
  { code: 'KJV',   label: 'KJV – King James (1769)' },
  { code: 'NLT',   label: 'NLT – New Living Translation' },
  { code: 'ESV',   label: 'ESV – English Standard' },
  { code: 'NKJV',  label: 'NKJV – New King James' },
];

function cleanVerse(text: string) {
  return text
    .replace(/<S>\d+<\/S>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface VerseData { pk: number; verse: number; text: string }

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

  const [translation, setTranslation] = useState('NIV');
  const [book, setBook]     = useState('John');
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]   = useState('');
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [showBookList, setShowBookList] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Keyboard close */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) close(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, close]);

  /* Scroll to top on chapter change */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [book, chapter]);

  /* Fetch chapter */
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const idx = BIBLE_BOOKS.indexOf(book) + 1;
        if (idx === 0) throw new Error('Unknown book');
        const res = await fetch(`https://bolls.life/get-chapter/${translation}/${idx}/${chapter}/`);
        if (!res.ok) throw new Error(`${res.status} – failed to load chapter`);
        const data: VerseData[] = await res.json();
        if (!cancelled) setVerses(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Something went wrong.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isOpen, translation, book, chapter]);

  const prevChapter = () => {
    if (chapter > 1) { setChapter(c => c - 1); return; }
    const i = BIBLE_BOOKS.indexOf(book);
    if (i > 0) { const b = BIBLE_BOOKS[i - 1]; setBook(b); setChapter(CHAPTER_COUNTS[b]); }
  };
  const nextChapter = () => {
    if (chapter < CHAPTER_COUNTS[book]) { setChapter(c => c + 1); return; }
    const i = BIBLE_BOOKS.indexOf(book);
    if (i < BIBLE_BOOKS.length - 1) { setBook(BIBLE_BOOKS[i + 1]); setChapter(1); }
  };

  const decreaseFontSize = () => {
    setFontSize(f => {
      const idx = fontSizes.indexOf(f);
      return idx > 0 ? fontSizes[idx - 1] : f;
    });
  };
  const increaseFontSize = () => {
    setFontSize(f => {
      const idx = fontSizes.indexOf(f);
      return idx < fontSizes.length - 1 ? fontSizes[idx + 1] : f;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[160] flex items-end justify-end pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 pointer-events-auto"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative w-full md:w-[580px] h-[92dvh] md:h-[100dvh] pointer-events-auto flex flex-col shadow-2xl rounded-t-3xl md:rounded-none"
            style={{ background: 'hsl(var(--card))', borderLeft: '1px solid hsl(var(--border))' }}
          >
            {/* ── Header ────────────────────────────────────────────── */}
            <div
              className="shrink-0 flex items-center justify-between gap-2 px-4 h-14 border-b"
              style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
            >
              {/* Translation picker — z-[200] ensures dropdown renders above this panel (z-[160]) */}
              <Select value={translation} onValueChange={v => setTranslation(v)}>
                <SelectTrigger
                  className="w-[130px] h-8 text-xs font-bold border-none focus:ring-0"
                  style={{ background: 'hsl(var(--secondary))' }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {TRANSLATIONS.map(t => (
                    <SelectItem key={t.code} value={t.code} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Chapter navigator */}
              <div
                className="flex items-center rounded-lg overflow-hidden"
                style={{ background: 'hsl(var(--secondary))' }}
              >
                <button
                  onClick={prevChapter}
                  disabled={book === 'Genesis' && chapter === 1}
                  className="h-8 w-8 flex items-center justify-center disabled:opacity-30 hover:opacity-70 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} />
                </button>
                <button
                  onClick={() => setShowBookList(v => !v)}
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

              {/* Right controls: A− / size label / A+ / book list / close */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Decrease font size */}
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

                {/* Current size indicator */}
                <span
                  className="font-heading font-bold text-[10px] w-5 text-center select-none"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {fontLabels[fontSize]}
                </span>

                {/* Increase font size */}
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

                {/* Book list toggle */}
                <button
                  onClick={() => setShowBookList(v => !v)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:opacity-70 transition-opacity"
                  style={{ background: 'hsl(var(--secondary))' }}
                  title="Book list"
                >
                  <List className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} />
                </button>

                {/* Close */}
                <button
                  onClick={close}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:opacity-70 transition-opacity"
                  title="Close"
                >
                  <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                </button>
              </div>
            </div>

            {/* ── Book list overlay ──────────────────────────────────── */}
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
                    {BIBLE_BOOKS.map(b => (
                      <button
                        key={b}
                        onClick={() => { setBook(b); setChapter(1); setShowBookList(false); }}
                        className={`text-xs text-left px-2 py-1.5 rounded-md transition-colors ${
                          b === book ? 'font-bold' : 'hover:opacity-70'
                        }`}
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

            {/* ── Verse content ──────────────────────────────────────── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth" style={{ background: 'hsl(var(--background))' }}>
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
                    <button
                      onClick={() => setError('')}
                      className="block mx-auto mt-4 text-xs underline"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`space-y-3 ${fontClasses[fontSize]}`}
                  >
                    <h1
                      className="text-2xl md:text-3xl font-heading font-extrabold pb-4 mb-6 border-b"
                      style={{ color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
                    >
                      {book} — Chapter {chapter}
                    </h1>

                    {verses.map(v => (
                      <p key={v.pk} className="group">
                        <span
                          className="font-bold text-xs align-super mr-1.5 select-none"
                          style={{ color: 'hsl(var(--brand-purple))' }}
                        >
                          {v.verse}
                        </span>
                        <span className="bible-verse-text">{cleanVerse(v.text)}</span>
                      </p>
                    ))}

                    <div className="flex justify-between pt-10 pb-4 border-t mt-10" style={{ borderColor: 'hsl(var(--border))' }}>
                      <button
                        onClick={prevChapter}
                        disabled={book === 'Genesis' && chapter === 1}
                        className="flex items-center gap-1.5 text-sm font-semibold disabled:opacity-30 hover:opacity-70 transition-opacity"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>
                      <button
                        onClick={nextChapter}
                        disabled={book === 'Revelation' && chapter === 22}
                        className="flex items-center gap-1.5 text-sm font-semibold disabled:opacity-30 hover:opacity-70 transition-opacity"
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
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
