// Simple client-side progress tracking stored in localStorage
export type ProgressRecord = {
  totalAnswered: number;
  correct: number;
  currentStreak: number;
  longestStreak: number;
  perCategory: Record<string, { correct: number; total: number }>;
  perDifficulty: Record<string, { correct: number; total: number }>;
};

const KEY = 'zoiko_progress_v1';

const DEFAULT: ProgressRecord = {
  totalAnswered: 0,
  correct: 0,
  currentStreak: 0,
  longestStreak: 0,
  perCategory: {},
  perDifficulty: {},
};

function load(): ProgressRecord {
  try {
    return { ...DEFAULT, ...(JSON.parse(localStorage.getItem(KEY) || 'null') || {}) };
  } catch {
    return DEFAULT;
  }
}

function save(r: ProgressRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
    // dispatch storage event for same-tab listeners
    window.dispatchEvent(new Event('zoiko:progress'));
  } catch {}
}

export function recordAnswer(questionId: number | string, correct: boolean, opts?: { category?: string; difficulty?: string }) {
  const rec = load();
  rec.totalAnswered += 1;
  if (correct) {
    rec.correct += 1;
    rec.currentStreak += 1;
    if (rec.currentStreak > rec.longestStreak) rec.longestStreak = rec.currentStreak;
  } else {
    rec.currentStreak = 0;
  }

  const cat = opts?.category || 'unknown';
  const diff = opts?.difficulty || 'unknown';

  rec.perCategory[cat] = rec.perCategory[cat] || { correct: 0, total: 0 };
  rec.perCategory[cat].total += 1;
  if (correct) rec.perCategory[cat].correct += 1;

  rec.perDifficulty[diff] = rec.perDifficulty[diff] || { correct: 0, total: 0 };
  rec.perDifficulty[diff].total += 1;
  if (correct) rec.perDifficulty[diff].correct += 1;

  save(rec);
  return rec;
}

export function getProgress(): ProgressRecord {
  return load();
}

export function resetProgress() {
  save({ ...DEFAULT });
}

export async function fetchServerProgress(): Promise<ProgressRecord | null> {
  try {
    const res = await fetch('/api/me/progress', { credentials: 'include' });
    if (!res.ok) return null;
    const json = await res.json();
    // normalize shape
    return {
      totalAnswered: Number(json.total_answered || json.totalAnswered || 0),
      correct: Number(json.correct || 0),
      currentStreak: Number(json.current_streak || json.currentStreak || 0),
      longestStreak: Number(json.longest_streak || json.longestStreak || 0),
      perCategory: json.per_category || json.perCategory || {},
      perDifficulty: json.per_difficulty || json.perDifficulty || {},
    } as ProgressRecord;
  } catch (e) {
    return null;
  }
}
