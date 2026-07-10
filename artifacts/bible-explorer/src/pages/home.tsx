import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Target, Users, Zap, BookOpen, Flame, Clock, Gamepad2, Trophy, Lightbulb, CalendarDays } from 'lucide-react';
import { useGetDailyContent, useGetStatsOverview, useListRecentSessions } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

export function Home() {
  const { data: dailyContent, isLoading: isLoadingDaily } = useGetDailyContent();
  const { data: stats } = useGetStatsOverview();
  const { data: recentSessions } = useListRecentSessions({ limit: 5 } as any);

  const [streak, setStreak] = useState<StreakData>({ lastDate: null, current: 0, longest: 0 });

  useEffect(() => {
    setStreak(loadStreak());
  }, []);

  const verseRef = dailyContent?.verseReference ?? "";
  const summary = VERSE_SUMMARIES[verseRef] ?? "";

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight mb-1">
          Welcome to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-blue">
            ZOIKOH
          </span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">Where scripture becomes an adventure.</p>
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
                <div className="space-y-3 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-6 bg-muted rounded w-full" />
                  <div className="h-6 bg-muted rounded w-5/6" />
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
                  Today's Challenge
                </p>
                <Link href="/solo?mode=daily" className="shrink-0">
                  <Button size="sm" variant="purple" className="rounded-full gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Play
                  </Button>
                </Link>
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">
                {dailyContent?.challenge ?? "5 rapid-fire questions from today's reading"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Questions Answered", value: stats?.totalQuestions != null ? String(stats.totalQuestions) : "0", icon: Target, color: "text-brand-purple", bg: "bg-brand-purple/10" },
            { label: "Sessions Played",    value: stats?.totalSessions != null ? String(stats.totalSessions) : "0",   icon: Gamepad2, color: "text-brand-blue",   bg: "bg-brand-blue/10" },
            { label: "Players Engaged",    value: stats?.totalPlayers != null ? String(stats.totalPlayers) : "0",     icon: Users,    color: "text-brand-green",  bg: "bg-brand-green/10" },
            { label: "Avg Score",          value: stats?.averageScore != null ? `${stats.averageScore}%` : "0%",      icon: Trophy,   color: "text-brand-orange", bg: "bg-brand-orange/10" },
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

        {/* ── Recent Sessions ───────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="md:col-span-12">
          <Card className="rounded-3xl overflow-hidden border-border/50">
            <CardHeader className="flex flex-row items-center justify-between bg-secondary/20 border-b border-border/50 py-4">
              <div>
                <CardTitle className="text-base">Recent Sessions</CardTitle>
                <CardDescription className="text-xs">Jump back into your recent games</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">View All</Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentSessions && recentSessions.length > 0 ? (
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
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Gamepad2 className="w-8 h-8 opacity-20" />
                  <p className="text-sm">No sessions yet — host one to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
