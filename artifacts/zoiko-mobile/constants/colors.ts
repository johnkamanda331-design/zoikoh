/**
 * ZOIKO Design Tokens — Mobile
 *
 * Mirrors the CSS custom properties in the web artifact (bible-explorer/src/index.css)
 * so both platforms share the same visual identity.
 *
 * Dark-mode-first: ZOIKO uses a deep dark-purple palette as its default.
 * The `light` key here represents the dark-mode palette used on mobile
 * (matching the web's dark theme).  A genuine light palette can be added
 * under a `light_mode` key if ever needed.
 */

const colors = {
  light: {
    // ── Core surfaces ──────────────────────────────────────────────────────
    background: '#0D0B1E',       // deepest background
    surface: '#151426',          // cards / modals
    surface2: '#1E1B34',         // elevated surfaces, inputs
    surface3: '#2A2548',         // hover / pressed state

    // ── Foreground / text ──────────────────────────────────────────────────
    foreground: '#F1F0FB',       // primary text
    text: '#F1F0FB',             // alias (for legacy compatibility)
    muted: '#9CA3B8',            // secondary / placeholder text
    mutedForeground: '#9CA3B8',

    // ── Brand primary ──────────────────────────────────────────────────────
    primary: '#6C3AED',          // ZOIKO purple
    primaryDark: '#5B2FD4',      // pressed / active state
    primaryLight: '#8B5CF6',     // lighter accent
    primaryForeground: '#FFFFFF',
    tint: '#6C3AED',             // alias for tab bar / icon tints

    // ── Secondary ──────────────────────────────────────────────────────────
    secondary: '#1E1B34',
    secondaryForeground: '#F1F0FB',

    // ── Accent ─────────────────────────────────────────────────────────────
    accent: '#7C3AED',
    accentForeground: '#FFFFFF',

    // ── Borders / separators ───────────────────────────────────────────────
    border: '#332F52',
    input: '#1E1B34',

    // ── Semantic states ────────────────────────────────────────────────────
    success: '#22C55E',
    successBg: '#14532D',
    warning: '#F59E0B',
    warningBg: '#78350F',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    danger: '#EF4444',

    // ── Game / gamification ────────────────────────────────────────────────
    gold: '#F59E0B',             // achievements / rankings
    silver: '#9CA3B8',
    bronze: '#B45309',
    score: '#6C3AED',

    // ── Cards ──────────────────────────────────────────────────────────────
    card: '#151426',
    cardForeground: '#F1F0FB',
  },

  // Radius in pixels (matches --radius in web CSS)
  radius: 12,
};

export default colors;
