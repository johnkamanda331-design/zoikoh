---
name: ZOIKO Bible API
description: Which Bible API to use, URL format, translations, and text sanitization.
---

## API: bolls.life (NOT getbible.net)

getbible.net is permanently broken — redirects to gatekeeper.getbible.life which returns connection refused.

**Working API:** https://bolls.life/get-chapter/{TRANSLATION}/{BOOK_NR}/{CHAPTER_NR}/
- CORS-enabled, no API key required
- BOOK_NR is 1-based index into the 66-book BIBLE_BOOKS array
- Response shape: Array<{ pk: number; verse: number; text: string }>

## Translations
- WEB — World English Bible, no tags (default)
- NKJV — New King James, no tags
- KJV — King James, has Strong's <S>1234</S> tags (stripped by cleanVerse())
- ASV — American Standard, has Strong's tags
- NET — New English Translation, has HTML footnote fragments

## Text sanitization
Always run cleanVerse() on every verse text:
  raw.replace(/<S>\d+<\/S>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

**Why:** Several translations embed markup that renders as garbled text or literal HTML if not stripped.

## BIBLE_BOOKS array (66 books in order)
['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation']
