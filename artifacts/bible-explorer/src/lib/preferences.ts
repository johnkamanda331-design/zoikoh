/**
 * User preferences and theme management
 */

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  adaptiveDifficulty: boolean;
  soundEnabled: boolean;
  voiceNarrationEnabled: boolean;
  soundVolume: number;
  tutorialCompleted: boolean;
  showExplanations: boolean;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  language: string;
  translation: 'NIV' | 'KJV' | 'ESV' | 'NLT' | 'NKJV';
  readingDensity?: 'comfortable' | 'compact';
  lineSpacing?: 'comfortable' | 'relaxed';
  showChapterSummary?: boolean;
  showVerseNotes?: boolean;
  reducedMotion?: boolean;
}

const STORAGE_KEY = 'zoiko_user_preferences';

// Background music feature removed — kept only sound effects playback

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  difficulty: 'medium',
  adaptiveDifficulty: false,
  soundEnabled: true,
  voiceNarrationEnabled: false,
  soundVolume: 0.7,
  tutorialCompleted: false,
  showExplanations: true,
  fontSize: 'medium',
  highContrast: false,
  language: 'en',
  translation: 'NIV',
  readingDensity: 'comfortable',
  lineSpacing: 'comfortable',
  showChapterSummary: true,
  showVerseNotes: true,
  reducedMotion: false,
};

export function loadPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Partial<UserPreferences>) {
  try {
    const current = loadPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    applyTheme(updated.theme);
    applyFontSize(updated.fontSize);
    applyHighContrast(updated.highContrast);
    applyReducedMotion(Boolean(updated.reducedMotion));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zoiko-preferences-changed', { detail: updated }));
    }

    // No background music feature; sound effects handled separately

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

export function playSound(type: 'correct' | 'incorrect' | 'click' | 'success') {
  const prefs = loadPreferences();
  if (!prefs.soundEnabled) return;
  
  // Use Web Audio API or HTML5 Audio
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(prefs.soundVolume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    const frequencies = {
      correct: 800,
      incorrect: 300,
      click: 600,
      success: 1000,
    };
    
    oscillator.frequency.setValueAtTime(frequencies[type], now);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  } catch (error) {
    console.debug('Audio playback not available:', error);
  }
}
