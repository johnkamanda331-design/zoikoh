import { loadPreferences } from '@/lib/preferences';
import { getStreak, loadProgress } from '@/hooks/use-achievements';
import { loadJSON, saveJSON } from '@/lib/storage';

export interface RecommendationCard {
  title: string;
  description: string;
  actionLabel: string;
  actionType: 'route' | 'open-bible' | 'practice';
  href?: string;
}

function getAccuracy(progress: ReturnType<typeof loadProgress>) {
  if (!progress.totalAnswers) return 0;
  return Math.round((progress.correctAnswers / progress.totalAnswers) * 100);
}

export function getDailyMomentum() {
  const prefs = loadPreferences();
  const progress = loadProgress();
  const streak = getStreak();
  const accuracy = getAccuracy(progress);
  const nextMilestone = streak.current >= 3 ? 7 : 3;
  const remainingToMilestone = Math.max(0, nextMilestone - streak.current);

  return {
    prefs,
    progress,
    streak,
    accuracy,
    nextMilestone,
    remainingToMilestone,
  };
}

export function getPersonalizedRecommendations(): RecommendationCard[] {
  const { prefs, progress, streak, accuracy } = getDailyMomentum();
  const favorites = loadJSON<string[]>('zoiko-bible-favorites', []);
  const recents = loadJSON<string[]>('zoiko-bible-recent', []);
  const recommendations: RecommendationCard[] = [];

  if (!progress.totalAnswers) {
    recommendations.push({
      title: 'Start with a warm-up',
      description: 'A quick daily challenge is the easiest way to begin building your rhythm.',
      actionLabel: 'Open daily challenge',
      actionType: 'route',
      href: '/solo',
    });
  } else if (accuracy >= 80) {
    recommendations.push({
      title: 'You are improving quickly',
      description: 'Your accuracy is strong, so a harder challenge should feel rewarding.',
      actionLabel: 'Try a tougher round',
      actionType: 'route',
      href: '/solo',
    });
  } else if (accuracy < 60) {
    recommendations.push({
      title: 'A gentler pace may help',
      description: 'Easy rounds can build confidence while you sharpen your recall.',
      actionLabel: 'Start easy',
      actionType: 'route',
      href: '/solo',
    });
  }

  if (streak.current >= 2) {
    recommendations.push({
      title: 'Protect your streak',
      description: 'Keep the momentum going with one short practice session today.',
      actionLabel: 'Practice now',
      actionType: 'practice',
      href: '/self-practice',
    });
  }

  if (favorites.length || recents.length) {
    recommendations.push({
      title: 'Pick up where you left off',
      description: 'Your recent and favorite passages are ready to revisit in one tap.',
      actionLabel: 'Open Bible',
      actionType: 'open-bible',
    });
  }

  if (!prefs.adaptiveDifficulty) {
    recommendations.push({
      title: 'Turn on adaptive difficulty',
      description: 'Let the app gradually adjust challenge levels as your accuracy changes.',
      actionLabel: 'Enable adaptive play',
      actionType: 'route',
      href: '/settings',
    });
  }

  return recommendations.slice(0, 3);
}

export function shouldShowPracticeReminder(): boolean {
  const prefs = loadPreferences();
  if (prefs.dailyReminder === false) return false;
  const today = new Date().toISOString().split('T')[0];
  const lastPractice = loadJSON<string>('zoiko_last_practice_date', '');
  return lastPractice !== today;
}

export function markPracticeToday() {
  const today = new Date().toISOString().split('T')[0];
  saveJSON('zoiko_last_practice_date', today);
}
