---
name: ZOIKO Bible API
description: Which Bible API to use, URL format, translations, and text sanitization.
---

## API: bolls.life (NOT getbible.net)

`getbible.net` is permanently broken — it redirects to `gatekeeper.getbible.life` which returns HTTP 000 (connection refused). Do not use it.

**Working API:** `https://bolls.life/get-chapter/{TRANSLATION}/{BOOK_NR}/{CHAPTER_NR}/`
- CORS-enabled (`access-control-allow-origin: *`), no API key required
- `BOOK_NR` is 1-based index into the 66-book `BIBLE_BOOKS` array
- Response shape: `Array<{ pk: number; verse: number; text: string }>`

## Translations
- `WEB` — World English Bible, no tags (default)
- `NKJV` — New King James, no tags
- `KJV` — King James, has Strong's `<S>1234</S>` tags (stripped by `cleanVerse()`)
- `ASV` — American Standard, has Strong's tags
- `NET` — New English Translation, has HTML footnote fragments

## Text sanitization
Always run `cleanVerse()` on every verse text:
```ts
function cleanVerse(raw: string): string {
  return raw
    .replace(/<S>\d+<\/S>/g, '')  // Strong's concordance numbers
    .replace(/<[^>]+>/g, ' ')      // residual HTML tags
    .replace(/\s+/g, ' ')
    .trim();
}
```

**Why:** Several translations embed markup that would render as garbled text or literal HTML if not stripped first.
