---
name: ZOIKO brand system
description: Brand colors, CSS variable scheme, dark/light mode toggle, font setup, logo variants for ZOIKO.
---

## Brand Colors (from official poster)
- Purple: #6C3AED (primary — headings, CTAs)
- Blue: #2563EB (secondary — links, info)
- Green: #10B981 (success, nature)
- Orange: #F59E0B (accent, warmth)
- Navy: #0F172A (dark background)

## Dark/Light Mode
- Default: dark mode
- Toggle via `.dark` / `.light` class on `document.documentElement`
- Persisted to `localStorage` key `'theme'`
- Applied on first paint in `src/main.tsx` before render

Dark mode CSS vars on `:root` / `html.dark`; Light mode overrides on `html.light`.

**Why:** Prevents flash of wrong theme; class-based (not media-query) so user preference overrides system.

## Logo
- Component: `src/components/ZoikoLogo.tsx`
- Variants: `icon` (SVG only), `horizontal` (SVG + "Zoiko" text), `full` (icon + title + subtitle)
- Colored text: Z=purple, o=blue, i=green, k=orange, o=blue
- SVG depicts: arc circle, cross, house outline, 3 people figures (purple/green/orange), open book

## Fonts
- Heading: Poppins ExtraBold (imported from Google Fonts), class `.font-heading`
- Body: Plus Jakarta Sans (imported from Google Fonts)

## AI Question Generation
- Route: POST /api/questions/generate (rate limited: 10/min per IP)
- Route: POST /api/questions/generate/save (rate limited: 5/min per IP)
- Uses user-provided OPENAI_API_KEY (gpt-4o-mini)
- Manual TS validation (no zod in api-server — use manual type guards)
- **Why:** zod package not available directly in api-server; use inline `validateQuestion()` guard

## Session Wizard
- 4 steps: Difficulty → Play Style → Participants (manual name entry) → Configure
- Category is always Q&A (id 1) with safe fallback via useListCategories
- No category selection step for hosts
