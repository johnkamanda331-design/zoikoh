export type Translation = 'NIV' | 'KJV' | 'NLT' | 'ESV' | 'NKJV';

export const TRANSLATIONS: Array<{ code: Translation; label: string }> = [
  { code: 'NIV', label: 'NIV – New International' },
  { code: 'KJV', label: 'KJV – King James (1769)' },
  { code: 'NLT', label: 'NLT – New Living Translation' },
  { code: 'ESV', label: 'ESV – English Standard' },
  { code: 'NKJV', label: 'NKJV – New King James' },
];

const BIBLE_SOURCE_BASE = 'https://bolls.life';

export function getBibleChapterUrl(translation: Translation, bookIndex: number, chapter: number) {
  return `${BIBLE_SOURCE_BASE}/get-chapter/${translation}/${bookIndex}/${chapter}/`;
}

export type VerseData = { pk: number; verse: number; text: string };

export async function fetchBibleChapter(
  translation: Translation,
  bookIndex: number,
  chapter: number,
  signal?: AbortSignal,
): Promise<VerseData[]> {
  const url = getBibleChapterUrl(translation, bookIndex, chapter);

  const response = await fetch(url, { signal });
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('The Bible source is temporarily rate limited. Please try again shortly.');
    }
    throw new Error(`Bible chapter fetch failed with status ${response.status}.`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('The Bible source returned an unexpected response.');
  }

  return data as VerseData[];
}

export function normalizeVerseText(text: string) {
  return text
    .replace(/<S>\d+<\/S>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(nbsp|#160);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseVerseContent(text: string) {
  const parts: Array<{ type: 'heading' | 'text'; content: string }> = [];
  const headingRegex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
  let lastIndex = 0;

  for (const match of text.matchAll(headingRegex)) {
    const before = normalizeVerseText(text.slice(lastIndex, match.index ?? lastIndex));
    if (before) parts.push({ type: 'text', content: before });

    const headingText = normalizeVerseText(match[2] ?? '');
    if (headingText) parts.push({ type: 'heading', content: headingText });

    lastIndex = (match.index ?? lastIndex) + match[0].length;
  }

  const tail = normalizeVerseText(text.slice(lastIndex));
  if (tail) parts.push({ type: 'text', content: tail });

  return parts.filter((part) => part.content.length > 0);
}
