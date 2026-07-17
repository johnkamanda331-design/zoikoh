import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Target, Users, Zap, BookOpen, Flame, Clock, Gamepad2, Trophy, Lightbulb, CalendarDays, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { useGetDailyContent, useGetStatsOverview, useListRecentSessions } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIceBreakersPanelStore } from '@/hooks/use-icebreakers-panel';
import { getDailyMomentum, getPersonalizedRecommendations, shouldShowPracticeReminder, markPracticeToday } from '@/lib/personalization';
import { loadJSON, saveJSON } from '@/lib/storage';
import { toast } from 'sonner';

/* ── Verse summaries ───────────────────────────────────────────────────── */
const VERSE_SUMMARIES: Record<string, string> = {
  "John 3:16":         "God's love for humanity is so profound that He gave His own Son — offering eternal life to all who believe.",
  "Philippians 4:13":  "Our strength doesn't come from our own ability but from Christ who works in and through us in every situation.",
  "Psalm 23:1":        "With God as your shepherd you will never truly lack — He provides, guides, and protects you continually.",
  "Romans 8:28":       "Even in hardship God is at work — turning every circumstance into something ultimately good for those who love Him.",
  "Joshua 1:9":        "True courage isn't the absence of fear — it's trusting that God is with you wherever you go.",
  "Matthew 6:33":      "When we make God's kingdom our first priority, everything else we need falls into place.",
  "Philippians 4:6":   "Worry is replaced by peace when we bring every concern to God with thankfulness.",
  "Jeremiah 29:11":    "God's plans for you aren't to harm you — He holds a future full of hope specifically designed for you.",
  "Matthew 22:37":     "The greatest commandment is total love for God — heart, soul, and mind — as the foundation of everything.",
  "Proverbs 3:5":      "Leaning on God's understanding rather than our own keeps us on the right path even when it's unclear.",
  "Psalm 27:1":        "When God is your light and salvation, fear loses its grip — no enemy can overcome His presence.",
  "Matthew 11:28":     "Jesus personally invites the weary and burdened to come to Him — rest and relief are found in Him alone.",
  "John 14:6":         "Jesus is the exclusive path to God — not a philosophy but a person who is truth and life itself.",
  "Ephesians 2:8":     "Salvation is a gift you can never earn — it comes purely through God's grace, received through faith.",
};

/* ── Streak helpers ────────────────────────────────────────────────────── */
interface StreakData { lastDate: string | null; current: number; longest: number }

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem('zoiko_streak_data');
    return raw ? JSON.parse(raw) : { lastDate: null, current: 0, longest: 0 };
  } catch { return { lastDate: null, current: 0, longest: 0 }; }
}

/* ── Animations ────────────────────────────────────────────────────────── */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

function buildSelfPracticePrompt(dailyContent?: { verseReference?: string; summary?: string }) {
  if (!dailyContent) {
    return 'Use today’s verse as a guide for a short meaningful action: write an encouragement, pray with it in mind, or encourage someone with this truth.';
  }

  const verse = dailyContent.verseReference ?? 'today’s verse';
  return `Use ${verse} as your reflection prompt: write a short encouragement, pray with this truth, or take one small real-life action inspired by the verse.`;
}

export function Home() {
  const {
    data: dailyContent,
    isLoading: isLoadingDaily,
    isError: dailyError,
  } = useGetDailyContent();
  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: statsError,
  } = useGetStatsOverview();
  const {
    data: recentSessions,
    isLoading: isLoadingRecent,
    isError: recentError,
  } = useListRecentSessions({ limit: 5 } as any);

  const [streak, setStreak] = useState<StreakData>({ lastDate: null, current: 0, longest: 0 });
  const [showReminder, setShowReminder] = useState(false);
  const [favoritePassages, setFavoritePassages] = useState<string[]>([]);
  const [recentPassages, setRecentPassages] = useState<string[]>([]);
  const iceBreakersPanelStore = useIceBreakersPanelStore();

  useEffect(() => {
    setStreak(loadStreak());
    setFavoritePassages(loadJSON<string[]>('zoiko-bible-favorites', []));
    setRecentPassages(loadJSON<string[]>('zoiko-bible-recent', []));
    setShowReminder(shouldShowPracticeReminder());
  }, []);

  const momentum = useMemo(() => getDailyMomentum(), []);
  const recommendations = useMemo(() => getPersonalizedRecommendations(), []);
  const reminderGoal = Math.min(100, Math.round((momentum.progress.totalAnswers / 12) * 100));

  const verseRef = dailyContent?.verseReference ?? "";
  const summary = VERSE_SUMMARIES[verseRef] ?? (dailyContent?.verse ? "Take a moment to meditate on this verse and reflect on how it applies to your day." : "");

  type HomeCard = {
    title: string;
    description: string;
    href?: string;
    action: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    onClick?: () => void;
  };

  const cards: HomeCard[] = [
    { title: 'Jump into Solo Modes', description: 'Explore 11 solo challenges from trivia to puzzles.', href: '/solo', action: 'Go Solo', icon: Gamepad2 },
    { title: 'Host a Group Session', description: 'Invite friends to play Bible trivia together in real time.', href: '/start', action: 'Host Now', icon: Users },
    { title: 'Try a 1v1 Duel', description: 'Challenge another player in a quick head-to-head match.', href: '/duel', action: 'Duel Now', icon: Zap },
    { title: 'Join an Active Game', description: 'Jump into a live session already in progress.', href: '/join', action: 'Join Game', icon: Target },
    { title: 'Open Ice-Breakers', description: 'Discover faith-based activities and conversation starters for your next gathering.', action: 'Explore Ice-Breakers', icon: Sparkles, onClick: () => iceBreakersPanelStore.open() },
  ];

  const handleReminderAction = async (mode: 'practice' | 'later') => {
    if (mode === 'practice') {
      markPracticeToday();
      setShowReminder(false);
      toast.success('Reminder saved. A short practice session is ready when you are.');
      return;
    }

    saveJSON('zoiko_reminder_dismissed', true);
    setShowReminder(false);
    toast.success('Reminder hidden for today.');
  };

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-border/60 bg-gradient-to-br from-card via-card to-brand-purple/5 p-5 md:p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="purple" className="font-heading tracking-[0.3em] uppercase text-[10px]">
                Daily practice
              </Badge>
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                Your spiritual rhythm
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight mb-1">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">
                ZOIKOH
              </span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Make scripture feel interactive, meaningful, and easy to revisit through guided play and reflection.
            </p>
          </div>
          <Link href="/solo" className="focus-ring">
            <Button size="sm" className="rounded-full px-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow-lg shadow-brand-purple/20">
              Explore modes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-5">
        <Card className="border-border/60 bg-gradient-to-br from-card via-card to-brand-purple/5 rounded-[28px] p-5 md:p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="purple" className="font-heading tracking-[0.3em] uppercase text-[10px]">Daily momentum</Badge>
              <h2 className="mt-3 text-2xl font-heading font-bold">Stay on track with a small win today</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {momentum.streak.current > 0
                  ? `You’re on a ${momentum.streak.current}-day streak and only ${momentum.remainingToMilestone} more day${momentum.remainingToMilestone === 1 ? '' : 's'} until your next milestone.`
                  : 'Start a short session today to build your first streak.'}
              </p>
            </div>
            <div className="rounded-2xl bg-brand-purple/10 p-3 text-brand-purple">
              <Flame className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
              <p className="text-2xl font-heading font-bold">{momentum.streak.current}</p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Current streak</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
              <p className="text-2xl font-heading font-bold">{momentum.accuracy}%</p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Accuracy</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
              <p className="text-2xl font-heading font-bold">{momentum.progress.totalAnswers}</p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Answers logged</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Today’s practice goal</span>
              <span className="text-muted-foreground">{reminderGoal}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" style={{ width: `${reminderGoal}%` }} />
            </div>
          </div>
        </Card>

        <Card className="border-border/60 rounded-[28px] p-5 md:p-6 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-brand-purple" />
            <h2 className="text-lg font-heading font-bold">Quick actions</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <Link href="/self-practice" className="focus-ring rounded-2xl border border-border/60 bg-background/70 p-3 text-left transition hover:border-brand-purple/30 hover:bg-brand-purple/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Practice today</p>
                  <p className="text-sm text-muted-foreground">A small reflection or challenge to keep the streak alive.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-brand-purple" />
              </div>
            </Link>
            <Link href="/solo" className="focus-ring rounded-2xl border border-border/60 bg-background/70 p-3 text-left transition hover:border-brand-purple/30 hover:bg-brand-purple/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Explore modes</p>
                  <p className="text-sm text-muted-foreground">Jump into solo play, daily challenges, or quicker rounds.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-brand-purple" />
              </div>
            </Link>
            <Link href="/settings" className="focus-ring rounded-2xl border border-border/60 bg-background/70 p-3 text-left transition hover:border-brand-purple/30 hover:bg-brand-purple/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Personalize experience</p>
                  <p className="text-sm text-muted-foreground">Tune reminders, difficulty pacing, and accessibility helpers.</p>
                </div>
                <ArrowRight className="h-4 w-4 text-brand-purple" />
              </div>
            </Link>
          </div>

          {showReminder && (
            <div className="mt-4 rounded-2xl border border-brand-purple/20 bg-brand-purple/10 p-4">
              <div className="flex items-start gap-2">
                <BellRing className="mt-0.5 h-4 w-4 text-brand-purple" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">A quick reminder keeps your rhythm strong.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Take one short action today to protect your streak.</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" className="rounded-full" onClick={() => handleReminderAction('practice')}>Practice now</Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleReminderAction('later')}>Later</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-12 gap-5"
      >
        {/* ── Verse of the Day card ─────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="md:col-span-8 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-purple to-brand-blue rounded-3xl blur opacity-20 group-hover:opacity-35 transition duration-500 pointer-events-none" />
          <Card className="relative h-full border-border/50 overflow-hidden flex flex-col rounded-3xl">
            <CardHeader className="pb-2">
              <Badge variant="purple" className="font-heading tracking-wider uppercase text-[10px] w-fit">
                Verse of the Day
              </Badge>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-center py-4 md:py-6">
              {isLoadingDaily ? (
                <div role="status" aria-live="polite" className="space-y-3 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-6 bg-muted rounded w-full" />
                  <div className="h-6 bg-muted rounded w-5/6" />
                </div>
              ) : dailyError ? (
                <div role="alert" className="space-y-3 p-4 rounded-3xl border border-red-200 bg-red-50 text-red-700">
                  <p className="font-semibold">Unable to load the verse of the day.</p>
                  <p className="text-sm">Please check your internet connection and try again.</p>
                </div>
              ) : (
                <>
                  <blockquote className="text-2xl md:text-3xl font-heading font-bold leading-snug mb-4 text-foreground">
                    "{dailyContent?.verse ?? "For God so loved the world, that he gave his only Son…"}"
                  </blockquote>
                  <cite className="text-base md:text-lg font-semibold text-brand-purple flex items-center gap-2 not-italic mb-5">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    {verseRef || "John 3:16"}
                  </cite>

                  {summary && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-secondary/60 border border-border/50">
                      <Lightbulb className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Right column: Memory Verse + Today's Challenge ────────────── */}
        <motion.div variants={fadeUp} className="md:col-span-4 flex flex-col gap-4">

          {/* Memory Verse card */}
          <Card className="bg-gradient-to-br from-brand-orange/10 to-brand-purple/10 border-brand-orange/20 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-5 opacity-10 pointer-events-none">
              <Flame className="w-28 h-28" />
            </div>
            <CardHeader>
              <Badge variant="orange" className="w-fit mb-2">Memory Verse</Badge>
              <CardTitle className="text-lg leading-snug">
                {dailyContent?.memoryVerse ?? "Trust in the LORD with all your heart"}
              </CardTitle>
              <CardDescription className="text-sm mt-1 text-foreground/70">
                Commit this to memory today — say it aloud 3 times.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1 text-brand-orange">
                  <Flame className="w-3.5 h-3.5" /> Daily practice
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> ~30 sec
                </div>
                {/* Daily streak counter */}
                {streak.current > 0 && (
                  <div className="flex items-center gap-1 text-brand-purple font-semibold ml-auto">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {streak.current} day streak
                  </div>
                )}
              </div>
              {streak.longest > 0 && (
                <p className="text-[10px] text-muted-foreground mt-2 opacity-70">
                  Best streak: {streak.longest} day{streak.longest !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Today's Challenge card — below Memory Verse */}
          <Card className="border-border/50 rounded-2xl bg-gradient-to-r from-brand-purple/5 to-brand-blue/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                  Self-Practice Challenge
                </p>
                <Link href="/self-practice" className="shrink-0">
                  <Button size="sm" variant="purple" className="rounded-full gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Practice
                  </Button>
                </Link>
              </div>
              {dailyError ? (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Could not load today's practice prompt. Please refresh or try again later.
                </div>
              ) : (
                <p className="text-sm font-medium text-foreground leading-snug">
                  {dailyContent ? buildSelfPracticePrompt(dailyContent) : "Reflect on today’s verse in a short personal or social activity that connects the scripture to real life."}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Questions Answered", value: String(stats?.totalQuestions ?? 0), icon: Target, color: "text-brand-purple", bg: "bg-brand-purple/10" },
            { label: "Sessions Played",    value: String(stats?.totalSessions ?? 0),   icon: Gamepad2, color: "text-brand-blue",   bg: "bg-brand-blue/10" },
            { label: "Players Engaged",    value: String(stats?.totalPlayers ?? 0),     icon: Users,    color: "text-brand-green",  bg: "bg-brand-green/10" },
            { label: "Avg Score",          value: `${stats?.averageScore ?? 0}%`,      icon: Trophy,   color: "text-brand-orange", bg: "bg-brand-orange/10" },
          ].map((stat, i) => (
            <Card key={i} className="rounded-2xl border-border/50">
              <CardContent className="p-4 md:p-5 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-heading font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* ── Recommendations & passages ─────────────────────────────── */}
        <motion.div variants={fadeUp} className="md:col-span-12 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-3xl border-border/50 bg-card/90">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recommended for you</CardTitle>
              <CardDescription>Suggestions based on your recent activity and current streak.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((item, index) => (
                <div key={index} className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                    <div className="rounded-full bg-brand-purple/10 p-2 text-brand-purple">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    {item.href ? (
                      <Link href={item.href} className="text-sm font-semibold text-brand-purple hover:underline">{item.actionLabel}</Link>
                    ) : (
                      <span className="text-sm font-semibold text-brand-purple">{item.actionLabel}</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/50 bg-card/90">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Favorites & recent passages</CardTitle>
              <CardDescription>Jump back into content you’ve already highlighted or opened.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {favoritePassages.length === 0 && recentPassages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                  Save a favorite passage in the Bible reader and it will appear here for quick access.
                </div>
              ) : (
                <>
                  {favoritePassages.slice(0, 3).map((passage) => (
                    <div key={`fav-${passage}`} className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/70 p-3">
                      <BookmarkCheck className="h-4 w-4 text-brand-purple" />
                      <span className="text-sm font-medium">{passage}</span>
                    </div>
                  ))}
                  {recentPassages.slice(0, 3).map((passage) => (
                    <div key={`recent-${passage}`} className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/70 p-3">
                      <Clock className="h-4 w-4 text-brand-blue" />
                      <span className="text-sm font-medium">{passage}</span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Play more cards ───────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="md:col-span-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.title} className="group soft-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-purple/30 hover:shadow-[0_18px_36px_-20px_rgba(108,58,237,0.35)]">
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">More ways to play</p>
                    {card.badge ? (
                      <span className="rounded-full bg-brand-purple/10 text-brand-purple px-2 py-1 text-[10px] uppercase tracking-[0.3em] font-semibold">
                        {card.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    {card.icon ? <card.icon className="w-5 h-5 text-brand-purple" /> : null}
                    <h3 className="text-xl font-heading font-bold">{card.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{card.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => card.onClick ? card.onClick() : window.location.assign(card.href!)}
                  className="focus-ring rounded-full px-4"
                >
                  {card.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* ── Recent Sessions ───────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="md:col-span-12">
          <Card className="rounded-3xl overflow-hidden border-border/50">
            <CardHeader className="flex flex-row items-center justify-between bg-secondary/20 border-b border-border/50 py-4">
              <div>
                <CardTitle className="text-base">Recent Sessions</CardTitle>
                <CardDescription className="text-xs">Jump back into your recent games</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="focus-ring text-xs">View All</Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingRecent ? (
                <div role="status" aria-live="polite" className="space-y-3 p-6">
                  <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              ) : recentError ? (
                <div role="alert" className="p-8 text-center rounded-3xl border border-red-200 bg-red-50 text-red-700">
                  Unable to load recent sessions. Please refresh the page or try again later.
                </div>
              ) : recentSessions && recentSessions.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentSessions.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-heading font-bold text-xs">
                          {session.pin}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{session.playStyle || "Classic Mode"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.createdAt).toLocaleDateString()} · {session.participants?.length || 0} players
                          </p>
                        </div>
                      </div>
                      <Badge variant={session.status === "active" ? "green" : "secondary"} className="text-xs">
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/70">
                    <Gamepad2 className="w-6 h-6 opacity-70" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">No sessions yet</p>
                    <p className="text-sm">Host one to get started and build your next shared experience.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
