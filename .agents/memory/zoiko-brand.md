---
name: ZOIKO brand system
description: Brand colors, CSS variable scheme, dark/light mode toggle, font setup, logo variants for ZOIKO.
---

## Brand Colors
- Purple: #6C3AED (primary — headings, CTAs)
- Blue: #2563EB (secondary — links, info)
- Green: #10B981 (success, nature)
- Orange: #F59E0B (accent, warmth)
- Navy: #0F172A (dark background)

## Dark/Light Mode
- Default: dark mode
- Toggle via `.dark` / `.light` class on `document.documentElement`
- Persisted to localStorage key 'theme'
- Applied on first paint in main.tsx before render

## Logo
- Colored text: Z=purple, o=blue, i=green, k=orange, o=blue
- Each letter is a separate span with its brand color

## Fonts
- Heading: Poppins ExtraBold (Google Fonts), imported in index.html
- Body: Plus Jakarta Sans (Google Fonts), imported in index.html

## CSS Variables (in artifacts/bible-explorer/src/index.css)
All brand tokens are defined as HSL CSS custom properties — dark mode default on :root, light mode overrides in .light class.

## AI Question Generation
- Route: POST /api/questions/generate
- Uses OPENAI_API_KEY env var (gpt-4o-mini)
- Falls back to mock questions pool if no API key

## Session Wizard
- 4 steps: Difficulty → Play Style → Participants → Configure/Launch
- categoryId always 1 (Q&A)
