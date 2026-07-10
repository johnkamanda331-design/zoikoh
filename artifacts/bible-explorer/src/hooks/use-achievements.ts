/**
 * Achievement tracking utilities — localStorage-first with API persistence.
 * 80 achievements across 4 categories (20 each).
 */

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

export interface PlayerProgress {
  correctAnswers: number;
  totalAnswers: number;
  flashCardsKnown: number;
  wordsUnscrambled: number;
  speedRoundCorrect: number;
  speedMasterTotal: number;       // cumulative speed round correct across all games
  tfCorrect: number;
  modesPlayed: string[];
  dailyChallengeDates: string[];
  hardCompleted: boolean;
  perfectSoloRounds: number;
  sessionsPlayed: number;
  sessionsWon: number;
  sessionsHosted: number;
  crosswordSolved: number;
  quoteMatchCorrect: number;
  verseFillCorrect: number;
  numberMatchCorrect: number;
  perfectGames: number;           // games with 100% accuracy
  longestAnswerStreak: number;    // longest consecutive correct run
}

const PROGRESS_KEY = 'zoiko_progress';
const EARNED_KEY   = 'zoiko_earned_achievements';
const PLAYER_KEY   = 'zoiko_player_name';
const STREAK_KEY   = 'zoiko_streak_data';

function defaultProgress(): PlayerProgress {
  return {
    correctAnswers: 0, totalAnswers: 0, flashCardsKnown: 0,
    wordsUnscrambled: 0, speedRoundCorrect: 0, speedMasterTotal: 0,
    tfCorrect: 0, modesPlayed: [], dailyChallengeDates: [],
    hardCompleted: false, perfectSoloRounds: 0, sessionsPlayed: 0,
    sessionsWon: 0, sessionsHosted: 0, crosswordSolved: 0,
    quoteMatchCorrect: 0, verseFillCorrect: 0, numberMatchCorrect: 0,
    perfectGames: 0, longestAnswerStreak: 0,
  };
}

export function getPlayerName(): string {
  return localStorage.getItem(PLAYER_KEY) || 'Player';
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? { ...defaultProgress(), ...JSON.parse(raw) } : defaultProgress();
  } catch { return defaultProgress(); }
}

export function saveProgress(p: PlayerProgress): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  syncPlayerStats(p);
}

/**
 * Push this device's aggregate stats to the backend so progress survives
 * across devices/reinstalls. The server merges by taking the max of
 * existing vs incoming values, so this is safe to call frequently.
 */
export function syncPlayerStats(p: PlayerProgress): void {
  const playerName = getPlayerName();
  const streak = getStreak();
  fetch(`${BASE}/api/players/${encodeURIComponent(playerName)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correctAnswers: p.correctAnswers,
      totalAnswers: p.totalAnswers,
      sessionsPlayed: p.sessionsPlayed,
      sessionsWon: p.sessionsWon,
      sessionsHosted: p.sessionsHosted,
      streakCurrent: streak.current,
      streakLongest: streak.longest,
    }),
  }).catch(() => { /* offline — local cache still tracks it, will retry on next save */ });
}

/**
 * Pull this player's stats from the backend and merge them into the local
 * cache (taking the higher value for each counter). Call this once on app
 * load so progress made on another device isn't lost.
 */
export async function hydratePlayerFromServer(): Promise<void> {
  const playerName = getPlayerName();
  try {
    const res = await fetch(`${BASE}/api/players/${encodeURIComponent(playerName)}`);
    if (!res.ok) return;
    const remote = await res.json();

    const local = loadProgress();
    const merged: PlayerProgress = {
      ...local,
      correctAnswers: Math.max(local.correctAnswers, remote.correctAnswers ?? 0),
      totalAnswers: Math.max(local.totalAnswers, remote.totalAnswers ?? 0),
      sessionsPlayed: Math.max(local.sessionsPlayed, remote.sessionsPlayed ?? 0),
      sessionsWon: Math.max(local.sessionsWon, remote.sessionsWon ?? 0),
      sessionsHosted: Math.max(local.sessionsHosted, remote.sessionsHosted ?? 0),
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));

    const streak = getStreak();
    if ((remote.streakLongest ?? 0) > streak.longest) {
      localStorage.setItem(STREAK_KEY, JSON.stringify({ ...streak, longest: remote.streakLongest }));
    }
  } catch {
    /* offline — proceed with local-only data */
  }
}

export function getEarnedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(EARNED_KEY) || '[]'); }
  catch { return []; }
}

export function updateStreak(): { current: number; longest: number } {
  const today = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const data = raw ? JSON.parse(raw) : { lastDate: null, current: 0, longest: 0 };
    if (data.lastDate === today) return data;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newCurrent = data.lastDate === yesterday ? data.current + 1 : 1;
    const newLongest = Math.max(newCurrent, data.longest || 0);
    const updated = { lastDate: today, current: newCurrent, longest: newLongest };
    localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    return updated;
  } catch { return { current: 1, longest: 1 }; }
}

export function getStreak(): { current: number; longest: number } {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? JSON.parse(raw) : { current: 0, longest: 0 };
  } catch { return { current: 0, longest: 0 }; }
}

export function getSeenIds(modeKey: string): number[] {
  try { return JSON.parse(localStorage.getItem(`zoiko_seen_${modeKey}`) || '[]'); }
  catch { return []; }
}

export function markSeen(modeKey: string, ids: number[]): void {
  const existing = getSeenIds(modeKey);
  const merged = Array.from(new Set([...existing, ...ids]));
  localStorage.setItem(`zoiko_seen_${modeKey}`, JSON.stringify(merged));
}

export function resetSeen(modeKey: string): void {
  localStorage.removeItem(`zoiko_seen_${modeKey}`);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickUnseen<T extends { id: number }>(all: T[], modeKey: string, count: number): T[] {
  const seen = getSeenIds(modeKey);
  const unseen = shuffle(all.filter(q => !seen.includes(q.id)));
  if (unseen.length >= count) {
    const picked = unseen.slice(0, count);
    markSeen(modeKey, picked.map(q => q.id));
    return picked;
  }
  const remaining = unseen;
  resetSeen(modeKey);
  const remainingIds = new Set(remaining.map(q => q.id));
  const topUp = shuffle(all.filter(q => !remainingIds.has(q.id))).slice(0, count - remaining.length);
  const picked = [...remaining, ...topUp];
  markSeen(modeKey, picked.map(q => q.id));
  return picked;
}

const ALL_SOLO_MODES = ['daily','qa','flash','scramble','true-false','speed-round','verse-fill','number-match','crossword','quote-match'];

interface AchDef {
  id: string;
  title: string;
  desc: string;
  check: (p: PlayerProgress, streak: { current: number; longest: number }) => boolean;
}

export const ACHIEVEMENT_DEFS: AchDef[] = [
  // ── Overall (20) ─────────────────────────────────────────────────────
  { id: 'first_play',    title: 'First Steps',        desc: 'Complete any game for the first time.',                    check: (p) => p.totalAnswers >= 1 },
  { id: 'ans_25',        title: 'Getting Started',     desc: 'Answer 25 questions correctly.',                           check: (p) => p.correctAnswers >= 25 },
  { id: 'ans_50',        title: 'On a Roll',           desc: 'Answer 50 questions correctly.',                           check: (p) => p.correctAnswers >= 50 },
  { id: 'scholar',       title: 'Bible Scholar',       desc: 'Answer 100 questions correctly across all modes.',         check: (p) => p.correctAnswers >= 100 },
  { id: 'ans_250',       title: 'Diligent Student',    desc: 'Answer 250 questions correctly.',                          check: (p) => p.correctAnswers >= 250 },
  { id: 'scholar_500',   title: 'Scripture Sage',      desc: 'Answer 500 questions correctly.',                          check: (p) => p.correctAnswers >= 500 },
  { id: 'scholar_1000',  title: 'Bible Master',        desc: 'Answer 1,000 questions correctly — remarkable!',          check: (p) => p.correctAnswers >= 1000 },
  { id: 'total_50',      title: 'Active Learner',      desc: 'Answer 50 questions in total (any result).',               check: (p) => p.totalAnswers >= 50 },
  { id: 'century',       title: 'Centurion',           desc: 'Answer 200 questions in total.',                           check: (p) => p.totalAnswers >= 200 },
  { id: 'total_500',     title: 'Relentless',          desc: 'Answer 500 questions in total.',                           check: (p) => p.totalAnswers >= 500 },
  { id: 'streak_3',      title: 'Three-Peat',          desc: 'Play on 3 consecutive days.',                              check: (_p, s) => s.current >= 3 },
  { id: 'streak_7',      title: 'Devoted',             desc: 'Play on 7 consecutive days.',                              check: (_p, s) => s.current >= 7 },
  { id: 'streak_14',     title: 'Fortnight Faithful',  desc: 'Play on 14 consecutive days.',                             check: (_p, s) => s.current >= 14 },
  { id: 'streak_30',     title: 'Faithful',            desc: 'Play on 30 consecutive days.',                             check: (_p, s) => s.current >= 30 },
  { id: 'streak_60',     title: 'Unbroken',            desc: 'Play on 60 consecutive days.',                             check: (_p, s) => s.current >= 60 },
  { id: 'try_3',         title: 'Explorer',            desc: 'Try 3 different solo modes.',                              check: (p) => p.modesPlayed.length >= 3 },
  { id: 'versatile',     title: 'Versatile',           desc: 'Try 5 different solo modes.',                              check: (p) => p.modesPlayed.length >= 5 },
  { id: 'all_modes',     title: 'Mode Master',         desc: 'Try all 10 solo modes at least once.',                    check: (p) => ALL_SOLO_MODES.every(m => p.modesPlayed.includes(m)) },
  { id: 'perfect_game',  title: 'Flawless Victory',    desc: 'Score 100% in any single game.',                          check: (p) => p.perfectGames >= 1 },
  { id: 'perfect_3',     title: 'Consistently Perfect', desc: 'Score 100% in 3 different games.',                       check: (p) => p.perfectGames >= 3 },

  // ── Solo Play (20) ───────────────────────────────────────────────────
  { id: 'daily_first',   title: 'Day One',             desc: 'Complete the Daily Challenge for the first time.',         check: (p) => p.dailyChallengeDates.length >= 1 },
  { id: 'daily_5',       title: 'Daily Habit',         desc: 'Complete the Daily Challenge on 5 separate days.',         check: (p) => p.dailyChallengeDates.length >= 5 },
  { id: 'daily_7',       title: 'Consistent',          desc: 'Complete the Daily Challenge 7 days in a row.',            check: (p) => p.dailyChallengeDates.length >= 7 },
  { id: 'daily_30',      title: 'Daily Devotion',      desc: 'Complete the Daily Challenge on 30 different days.',       check: (p) => p.dailyChallengeDates.length >= 30 },
  { id: 'perfect_solo',  title: 'Flawless Solo',       desc: 'Score 100% on any 10-question solo Q&A round.',           check: (p) => p.perfectSoloRounds >= 1 },
  { id: 'hard_first',    title: 'Challenge Accepted',  desc: 'Complete a full hard-difficulty Q&A round.',              check: (p) => p.hardCompleted },
  { id: 'hard_master',   title: 'Hard Mode Hero',      desc: 'Score 80%+ on a hard-difficulty Q&A round.',             check: (p) => p.hardCompleted && p.perfectSoloRounds >= 1 },
  { id: 'flash_10',      title: 'Card Starter',        desc: 'Mark 10 flash cards as "Got it!"',                       check: (p) => p.flashCardsKnown >= 10 },
  { id: 'flash_25',      title: 'Card Learner',        desc: 'Mark 25 flash cards as "Got it!"',                       check: (p) => p.flashCardsKnown >= 25 },
  { id: 'flash_fan',     title: 'Flash Card Fan',      desc: 'Mark 50 flash cards as "Got it!"',                       check: (p) => p.flashCardsKnown >= 50 },
  { id: 'flash_100',     title: 'Memory Champion',     desc: 'Mark 100 flash cards as "Got it!"',                      check: (p) => p.flashCardsKnown >= 100 },
  { id: 'scramble_5',    title: 'Word Finder',         desc: 'Correctly unscramble 5 Bible words.',                     check: (p) => p.wordsUnscrambled >= 5 },
  { id: 'word_wizard',   title: 'Word Wizard',         desc: 'Correctly unscramble 20 Bible words.',                    check: (p) => p.wordsUnscrambled >= 20 },
  { id: 'scramble_50',   title: 'Word Master',         desc: 'Correctly unscramble 50 Bible words.',                    check: (p) => p.wordsUnscrambled >= 50 },
  { id: 'verse_first',   title: 'First Word',          desc: 'Complete your first Verse Fill-In correctly.',            check: (p) => p.verseFillCorrect >= 1 },
  { id: 'verse_25',      title: 'Verse Keeper',        desc: 'Complete 25 Verse Fill-In answers correctly.',            check: (p) => p.verseFillCorrect >= 25 },
  { id: 'numbers_first', title: 'By the Numbers',      desc: 'Answer your first Bible Numbers question correctly.',     check: (p) => p.numberMatchCorrect >= 1 },
  { id: 'crossword_first',title: 'First Across',       desc: 'Solve your first Bible Crossword word.',                  check: (p) => p.crosswordSolved >= 1 },
  { id: 'crossword_10',  title: 'Crossword Buff',      desc: 'Solve 10 Bible Crossword words.',                         check: (p) => p.crosswordSolved >= 10 },
  { id: 'quote_first',   title: 'Name Dropper',        desc: 'Correctly identify your first Bible quote speaker.',      check: (p) => p.quoteMatchCorrect >= 1 },

  // ── Team / Multiplayer (20) ──────────────────────────────────────────
  { id: 'join_first',    title: 'Joined Up',           desc: 'Join your first multiplayer session by PIN.',             check: (p) => p.sessionsPlayed >= 1 },
  { id: 'first_win',     title: 'First Victory',       desc: 'Win your first multiplayer session.',                     check: (p) => p.sessionsWon >= 1 },
  { id: 'first_host',    title: 'Host Mode',           desc: 'Host your first multiplayer session.',                    check: (p) => p.sessionsHosted >= 1 },
  { id: 'mp_sessions_3', title: 'Social Learner',      desc: 'Play 3 multiplayer sessions.',                            check: (p) => p.sessionsPlayed >= 3 },
  { id: 'mp_sessions_5', title: 'Team Player',         desc: 'Play 5 multiplayer sessions.',                            check: (p) => p.sessionsPlayed >= 5 },
  { id: 'host_master',   title: 'Gatherer',            desc: 'Host 5 multiplayer sessions.',                            check: (p) => p.sessionsHosted >= 5 },
  { id: 'mp_sessions_10',title: 'Committed',           desc: 'Play 10 multiplayer sessions.',                           check: (p) => p.sessionsPlayed >= 10 },
  { id: 'team_player',   title: 'Team Spirit',         desc: 'Participate in 10 multiplayer sessions.',                 check: (p) => p.sessionsPlayed >= 10 },
  { id: 'top_score',     title: 'Top of the Class',    desc: 'Finish first on the leaderboard in a session.',           check: (p) => p.sessionsWon >= 3 },
  { id: 'mp_sessions_15',title: 'Regular',             desc: 'Play 15 multiplayer sessions.',                           check: (p) => p.sessionsPlayed >= 15 },
  { id: 'grand_host',    title: 'Grand Host',          desc: 'Host 15 multiplayer sessions.',                           check: (p) => p.sessionsHosted >= 15 },
  { id: 'win_3',         title: 'Hat-Trick',           desc: 'Win 3 multiplayer sessions.',                             check: (p) => p.sessionsWon >= 3 },
  { id: 'win_5',         title: 'Champion Run',        desc: 'Win 5 multiplayer sessions.',                             check: (p) => p.sessionsWon >= 5 },
  { id: 'mp_sessions_25',title: 'Devoted Competitor',  desc: 'Play 25 multiplayer sessions.',                           check: (p) => p.sessionsPlayed >= 25 },
  { id: 'host_25',       title: 'Master Host',         desc: 'Host 25 multiplayer sessions.',                           check: (p) => p.sessionsHosted >= 25 },
  { id: 'win_10',        title: 'Dominant',            desc: 'Win 10 multiplayer sessions.',                            check: (p) => p.sessionsWon >= 10 },
  { id: 'mp_sessions_50',title: 'Community Pillar',    desc: 'Play 50 multiplayer sessions.',                           check: (p) => p.sessionsPlayed >= 50 },
  { id: 'win_25',        title: 'Legendary Winner',    desc: 'Win 25 multiplayer sessions.',                            check: (p) => p.sessionsWon >= 25 },
  { id: 'host_50',       title: 'Pastor',              desc: 'Host 50 multiplayer sessions — you build the community.', check: (p) => p.sessionsHosted >= 50 },
  { id: 'mp_legend',     title: 'Multiplayer Legend',  desc: 'Play 100 multiplayer sessions total.',                    check: (p) => p.sessionsPlayed >= 100 },

  // ── Speed & Accuracy (20) ────────────────────────────────────────────
  { id: 'speed_first',   title: 'Off the Blocks',      desc: 'Complete your first Speed Round.',                        check: (p) => p.speedMasterTotal >= 1 },
  { id: 'speed_5',       title: 'Quick Thinker',       desc: 'Answer 5 questions correctly in a Speed Round.',          check: (p) => p.speedRoundCorrect >= 5 },
  { id: 'speed_10',      title: 'Speed Starter',       desc: 'Answer 10 questions correctly in a single Speed Round.',  check: (p) => p.speedRoundCorrect >= 10 },
  { id: 'speed_demon',   title: 'Speed Demon',         desc: 'Answer 5 Speed Round questions correctly in one game.',   check: (p) => p.speedRoundCorrect >= 5 },
  { id: 'lightning_speed',title: 'Lightning Speed',    desc: 'Answer 15 questions correctly in a single Speed Round.', check: (p) => p.speedRoundCorrect >= 15 },
  { id: 'speed_20',      title: 'Blazing Fast',        desc: 'Answer 20 questions correctly in a single Speed Round.',  check: (p) => p.speedRoundCorrect >= 20 },
  { id: 'speed_master',  title: 'Speed Master',        desc: 'Answer 100 questions correctly across all Speed Rounds.', check: (p) => p.speedMasterTotal >= 100 },
  { id: 'true_first',    title: 'True Believer',       desc: 'Answer your first True or False question correctly.',     check: (p) => p.tfCorrect >= 1 },
  { id: 'true_10',       title: 'T/F Learner',         desc: 'Answer 10 True or False questions correctly.',            check: (p) => p.tfCorrect >= 10 },
  { id: 'true_ace',      title: 'True/False Ace',      desc: 'Answer 30 True or False questions correctly.',            check: (p) => p.tfCorrect >= 30 },
  { id: 'true_50',       title: 'Truth Seeker',        desc: 'Answer 50 True or False questions correctly.',            check: (p) => p.tfCorrect >= 50 },
  { id: 'true_100',      title: 'T/F Champion',        desc: 'Answer 100 True or False questions correctly.',           check: (p) => p.tfCorrect >= 100 },
  { id: 'fill_perfect',  title: 'Scripture Perfect',   desc: 'Score 100% on a Verse Fill-In round.',                   check: (p) => p.verseFillCorrect >= 10 },
  { id: 'numbers_perfect',title: 'Numerically Blessed',desc: 'Score 100% on a Bible Numbers round.',                   check: (p) => p.numberMatchCorrect >= 15 },
  { id: 'crossword_25',  title: 'Crossword Expert',    desc: 'Solve 25 Bible Crossword words.',                         check: (p) => p.crosswordSolved >= 25 },
  { id: 'quote_10',      title: 'Word Recognition',    desc: 'Correctly match 10 Bible quotes to their speakers.',     check: (p) => p.quoteMatchCorrect >= 10 },
  { id: 'quote_25',      title: 'Quote Scholar',       desc: 'Correctly match 25 Bible quotes to their speakers.',     check: (p) => p.quoteMatchCorrect >= 25 },
  { id: 'acc_champion',  title: 'Accuracy Champion',   desc: 'Achieve 100% accuracy in 5 different games.',            check: (p) => p.perfectGames >= 5 },
  { id: 'streak_ans_5',  title: 'Five in a Row',       desc: 'Build a streak of 5+ consecutive correct answers.',      check: (p) => p.longestAnswerStreak >= 5 },
  { id: 'streak_ans_10', title: 'Ten Straight',        desc: 'Build a streak of 10+ consecutive correct answers.',     check: (p) => p.longestAnswerStreak >= 10 },
];

export const PROGRESS_TARGETS: Record<string, { value: (p: PlayerProgress) => number; max: number }> = {
  // Overall
  ans_25:        { value: p => p.correctAnswers,    max: 25 },
  ans_50:        { value: p => p.correctAnswers,    max: 50 },
  scholar:       { value: p => p.correctAnswers,    max: 100 },
  ans_250:       { value: p => p.correctAnswers,    max: 250 },
  scholar_500:   { value: p => p.correctAnswers,    max: 500 },
  scholar_1000:  { value: p => p.correctAnswers,    max: 1000 },
  total_50:      { value: p => p.totalAnswers,       max: 50 },
  century:       { value: p => p.totalAnswers,       max: 200 },
  total_500:     { value: p => p.totalAnswers,       max: 500 },
  try_3:         { value: p => p.modesPlayed.length, max: 3 },
  versatile:     { value: p => p.modesPlayed.length, max: 5 },
  all_modes:     { value: p => ALL_SOLO_MODES.filter(m => p.modesPlayed.includes(m)).length, max: 10 },
  perfect_game:  { value: p => p.perfectGames,      max: 1 },
  perfect_3:     { value: p => p.perfectGames,       max: 3 },
  // Solo
  daily_5:       { value: p => p.dailyChallengeDates.length, max: 5 },
  daily_7:       { value: p => p.dailyChallengeDates.length, max: 7 },
  daily_30:      { value: p => p.dailyChallengeDates.length, max: 30 },
  flash_10:      { value: p => p.flashCardsKnown,   max: 10 },
  flash_25:      { value: p => p.flashCardsKnown,   max: 25 },
  flash_fan:     { value: p => p.flashCardsKnown,   max: 50 },
  flash_100:     { value: p => p.flashCardsKnown,   max: 100 },
  scramble_5:    { value: p => p.wordsUnscrambled,  max: 5 },
  word_wizard:   { value: p => p.wordsUnscrambled,  max: 20 },
  scramble_50:   { value: p => p.wordsUnscrambled,  max: 50 },
  verse_25:      { value: p => p.verseFillCorrect,  max: 25 },
  crossword_10:  { value: p => p.crosswordSolved,   max: 10 },
  crossword_25:  { value: p => p.crosswordSolved,   max: 25 },
  quote_10:      { value: p => p.quoteMatchCorrect, max: 10 },
  quote_25:      { value: p => p.quoteMatchCorrect, max: 25 },
  // Multiplayer
  mp_sessions_3: { value: p => p.sessionsPlayed,    max: 3 },
  mp_sessions_5: { value: p => p.sessionsPlayed,    max: 5 },
  mp_sessions_10:{ value: p => p.sessionsPlayed,    max: 10 },
  mp_sessions_15:{ value: p => p.sessionsPlayed,    max: 15 },
  mp_sessions_25:{ value: p => p.sessionsPlayed,    max: 25 },
  mp_sessions_50:{ value: p => p.sessionsPlayed,    max: 50 },
  mp_legend:     { value: p => p.sessionsPlayed,    max: 100 },
  host_master:   { value: p => p.sessionsHosted,    max: 5 },
  grand_host:    { value: p => p.sessionsHosted,    max: 15 },
  host_25:       { value: p => p.sessionsHosted,    max: 25 },
  host_50:       { value: p => p.sessionsHosted,    max: 50 },
  win_3:         { value: p => p.sessionsWon,       max: 3 },
  win_5:         { value: p => p.sessionsWon,       max: 5 },
  win_10:        { value: p => p.sessionsWon,       max: 10 },
  win_25:        { value: p => p.sessionsWon,       max: 25 },
  // Speed & Accuracy
  speed_5:       { value: p => p.speedRoundCorrect, max: 5 },
  speed_10:      { value: p => p.speedRoundCorrect, max: 10 },
  speed_demon:   { value: p => p.speedRoundCorrect, max: 5 },
  lightning_speed:{ value: p => p.speedRoundCorrect, max: 15 },
  speed_20:      { value: p => p.speedRoundCorrect, max: 20 },
  speed_master:  { value: p => p.speedMasterTotal,  max: 100 },
  true_10:       { value: p => p.tfCorrect,         max: 10 },
  true_ace:      { value: p => p.tfCorrect,         max: 30 },
  true_50:       { value: p => p.tfCorrect,         max: 50 },
  true_100:      { value: p => p.tfCorrect,         max: 100 },
  fill_perfect:  { value: p => p.verseFillCorrect,  max: 10 },
  numbers_perfect:{ value: p => p.numberMatchCorrect,max: 15 },
  acc_champion:  { value: p => p.perfectGames,      max: 5 },
  streak_ans_5:  { value: p => p.longestAnswerStreak,max: 5 },
  streak_ans_10: { value: p => p.longestAnswerStreak,max: 10 },
};

export async function checkAndAward(progress: PlayerProgress): Promise<string[]> {
  const streak = getStreak();
  const earnedIds = getEarnedIds();
  const newlyEarned: string[] = [];
  const playerName = getPlayerName();

  for (const ach of ACHIEVEMENT_DEFS) {
    if (earnedIds.includes(ach.id)) continue;
    if (!ach.check(progress, streak)) continue;
    try {
      await fetch(`${BASE}/api/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, type: ach.id, title: ach.title, description: ach.desc }),
      });
    } catch { /* offline — local cache still tracks it */ }
    earnedIds.push(ach.id);
    newlyEarned.push(ach.id);
  }

  if (newlyEarned.length > 0) {
    localStorage.setItem(EARNED_KEY, JSON.stringify(earnedIds));
  }
  return newlyEarned;
}

export function recordGamePlayed(opts: {
  mode: string;
  correct: number;
  total: number;
  difficulty?: string;
  perfect?: boolean;
}): PlayerProgress {
  const p = loadProgress();
  const today = new Date().toISOString().split('T')[0];

  p.totalAnswers   += opts.total;
  p.correctAnswers += opts.correct;

  if (!p.modesPlayed.includes(opts.mode)) {
    p.modesPlayed = [...p.modesPlayed, opts.mode];
  }
  if (opts.mode === 'daily' && !p.dailyChallengeDates.includes(today)) {
    p.dailyChallengeDates = [...p.dailyChallengeDates, today];
  }
  if (opts.difficulty === 'hard' && opts.total > 0) {
    p.hardCompleted = true;
  }
  if (opts.perfect && opts.total >= 10) {
    p.perfectSoloRounds += 1;
    p.perfectGames      += 1;
  } else if (opts.total > 0 && opts.correct === opts.total) {
    p.perfectGames += 1;
  }
  if (opts.mode === 'verse-fill')   p.verseFillCorrect   += opts.correct;
  if (opts.mode === 'number-match') p.numberMatchCorrect += opts.correct;

  saveProgress(p);
  updateStreak();
  return p;
}

export function recordFlashCard(known: number): PlayerProgress {
  const p = loadProgress();
  p.flashCardsKnown += known;
  if (!p.modesPlayed.includes('flash')) p.modesPlayed = [...p.modesPlayed, 'flash'];
  saveProgress(p);
  updateStreak();
  return p;
}

export function recordScramble(correct: number): PlayerProgress {
  const p = loadProgress();
  p.wordsUnscrambled += correct;
  p.totalAnswers     += correct;
  p.correctAnswers   += correct;
  if (!p.modesPlayed.includes('scramble')) p.modesPlayed = [...p.modesPlayed, 'scramble'];
  saveProgress(p);
  updateStreak();
  return p;
}

export function recordSpeedRound(correct: number, total: number): PlayerProgress {
  const p = loadProgress();
  p.speedRoundCorrect  = correct;           // single-game best
  p.speedMasterTotal  += correct;           // cumulative
  p.totalAnswers      += total;
  p.correctAnswers    += correct;
  if (correct === total && total > 0) p.perfectGames += 1;
  if (!p.modesPlayed.includes('speed-round')) p.modesPlayed = [...p.modesPlayed, 'speed-round'];
  saveProgress(p);
  updateStreak();
  return p;
}

export function recordTrueFalse(correct: number, total: number): PlayerProgress {
  const p = loadProgress();
  p.tfCorrect      += correct;
  p.totalAnswers   += total;
  p.correctAnswers += correct;
  if (correct === total && total > 0) p.perfectGames += 1;
  if (!p.modesPlayed.includes('true-false')) p.modesPlayed = [...p.modesPlayed, 'true-false'];
  saveProgress(p);
  updateStreak();
  return p;
}

export function recordCrossword(solved: number): PlayerProgress {
  const p = loadProgress();
  p.crosswordSolved += solved;
  p.totalAnswers    += solved;
  p.correctAnswers  += solved;
  if (!p.modesPlayed.includes('crossword')) p.modesPlayed = [...p.modesPlayed, 'crossword'];
  saveProgress(p);
  updateStreak();
  return p;
}

export function recordQuoteMatch(correct: number, total: number): PlayerProgress {
  const p = loadProgress();
  p.quoteMatchCorrect += correct;
  p.totalAnswers      += total;
  p.correctAnswers    += correct;
  if (correct === total && total > 0) p.perfectGames += 1;
  if (!p.modesPlayed.includes('quote-match')) p.modesPlayed = [...p.modesPlayed, 'quote-match'];
  saveProgress(p);
  updateStreak();
  return p;
}

export function recordAnswerStreak(streak: number): void {
  const p = loadProgress();
  if (streak > p.longestAnswerStreak) {
    p.longestAnswerStreak = streak;
    saveProgress(p);
  }
}
