import { loadJSON, saveJSON } from './storage';
import type { Translation } from './bible';

/**
 * User preferences and theme management
 */

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  adaptiveDifficulty: boolean;
  dailyReminder: boolean;
  tutorialCompleted: boolean;
  showExplanations: boolean;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  language: string;
  translation: Translation;
  readingDensity?: 'comfortable' | 'compact';
  lineSpacing?: 'comfortable' | 'relaxed';
  reducedMotion?: boolean;
}

const STORAGE_KEY = 'zoiko_user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  difficulty: 'medium',
  adaptiveDifficulty: false,
  dailyReminder: true,
  tutorialCompleted: false,
  showExplanations: true,
  fontSize: 'medium',
  highContrast: false,
  language: 'en',
  translation: 'ESV',
  readingDensity: 'comfortable',
  lineSpacing: 'comfortable',
  reducedMotion: false,
};

export function loadPreferences(): UserPreferences {
  const stored = loadJSON<Partial<UserPreferences>>(STORAGE_KEY, {});
  return { ...DEFAULT_PREFERENCES, ...stored };
}

export function savePreferences(prefs: Partial<UserPreferences>) {
  try {
    const current = loadPreferences();
    const updated = { ...current, ...prefs };
    saveJSON(STORAGE_KEY, updated);
    applyTheme(updated.theme);
    applyFontSize(updated.fontSize);
    applyHighContrast(updated.highContrast);
    applyReducedMotion(Boolean(updated.reducedMotion));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zoiko-preferences-changed', { detail: updated }));
    }

    return updated;
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return loadPreferences();
  }
}

function applyReducedMotion(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
}

function applyTheme(theme: 'dark' | 'light' | 'auto') {
  const root = document.documentElement;
  let actualTheme = theme;
  
  if (theme === 'auto') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  if (actualTheme === 'dark') {
    root.classList.remove('light');
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  try {
    // Persist the chosen theme so other parts of the app (e.g. layout.tsx)
    // that read the simple `theme` key stay in sync.
    localStorage.setItem('theme', actualTheme);
  } catch {
    // ignore storage errors
  }
}

function applyFontSize(size: 'small' | 'medium' | 'large') {
  const root = document.documentElement;
  root.classList.remove('text-scale-small', 'text-scale-medium', 'text-scale-large');
  root.classList.add(`text-scale-${size}`);
  
  const scales = { small: '0.875', medium: '1', large: '1.125' };
  root.style.fontSize = `${scales[size]}rem`;
}

function applyHighContrast(enabled: boolean) {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
}
