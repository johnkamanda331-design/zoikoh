import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Star, Zap, Clock, Shield, Award, Crown, Target,
  Gamepad2, Users, Flame, BookOpen, CheckCircle, Swords, Brain, Hash,
  Puzzle, MessageSquare, Heart, BookMarked, RotateCcw, Timer, CalendarDays,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useListAchievements } from '@workspace/api-client-react';
import {
  ACHIEVEMENT_DEFS, PROGRESS_TARGETS,
  loadProgress, getEarnedIds, getStreak,
} from '@/hooks/use-achievements';

/* ── Icon map ──────────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  // Overall
  first_play: CheckCircle, ans_25: Target, ans_50: Target, scholar: Award, ans_250: Award,
  scholar_500: Award, scholar_1000: Crown, total_50: BookOpen, century: Star, total_500: Star,
  streak_3: CalendarDays, streak_7: Clock, streak_14: Clock, streak_30: Flame, streak_60: Flame,
  try_3: Gamepad2, versatile: Target, all_modes: BookOpen, perfect_game: Star, perfect_3: Trophy,
  // Solo
  daily_first: Zap, daily_5: Zap, daily_7: Zap, daily_30: CalendarDays,
  perfect_solo: Star, hard_first: Shield, hard_master: Shield,
  flash_10: Brain, flash_25: Brain, flash_fan: Brain, flash_100: Brain,
  scramble_5: RotateCcw, word_wizard: Hash, scramble_50: RotateCcw,
  verse_first: BookMarked, verse_25: BookMarked,
  numbers_first: Hash, crossword_first: Puzzle, crossword_10: Puzzle, quote_first: MessageSquare,
  // Multiplayer
  join_first: Users, first_win: Trophy, first_host: Crown,
  mp_sessions_3: Users, mp_sessions_5: Users, host_master: Crown, mp_sessions_10: Users,
  team_player: Heart, top_score: Star, mp_sessions_15: Users, grand_host: Crown,
  win_3: Trophy, win_5: Trophy, mp_sessions_25: Users, host_25: Crown,
  win_10: Trophy, mp_sessions_50: Users, win_25: Trophy, host_50: Crown, mp_legend: Swords,
  // Speed & Accuracy
  speed_first: Timer, speed_5: Zap, speed_10: Zap, speed_demon: Zap,
  lightning_speed: Flame, speed_20: Flame, speed_master: Crown,
  true_first: Shield, true_10: Shield, true_ace: Shield, true_50: Shield, true_100: Shield,
  fill_perfect: BookMarked, numbers_perfect: Hash, crossword_25: Puzzle,
  quote_10: MessageSquare, quote_25: MessageSquare,
  acc_champion: Star, streak_ans_5: Zap, streak_ans_10: Flame,
};

const COLOR_MAP: Record<string, string> = {
  // Overall
  first_play: 'text-brand-green', ans_25: 'text-brand-green', ans_50: 'text-brand-blue',
  scholar: 'text-amber-500', ans_250: 'text-amber-500', scholar_500: 'text-amber-500',
  scholar_1000: 'text-brand-orange', total_50: 'text-brand-purple', century: 'text-brand-purple',
  total_500: 'text-brand-purple', streak_3: 'text-brand-green', streak_7: 'text-brand-green',
  streak_14: 'text-brand-orange', streak_30: 'text-brand-orange', streak_60: 'text-red-500',
  try_3: 'text-brand-blue', versatile: 'text-brand-blue', all_modes: 'text-brand-green',
  perfect_game: 'text-brand-orange', perfect_3: 'text-brand-orange',
  // Solo
  daily_first: 'text-brand-orange', daily_5: 'text-brand-orange', daily_7: 'text-brand-orange',
  daily_30: 'text-red-500', perfect_solo: 'text-brand-purple', hard_first: 'text-red-400',
  hard_master: 'text-red-400', flash_10: 'text-brand-blue', flash_25: 'text-brand-blue',
  flash_fan: 'text-brand-blue', flash_100: 'text-cyan-500', scramble_5: 'text-brand-green',
  word_wizard: 'text-teal-500', scramble_50: 'text-teal-500', verse_first: 'text-pink-500',
  verse_25: 'text-pink-500', numbers_first: 'text-violet-500', crossword_first: 'text-amber-500',
  crossword_10: 'text-amber-500', quote_first: 'text-sky-500',
  // Multiplayer
  join_first: 'text-brand-blue', first_win: 'text-brand-orange', first_host: 'text-indigo-400',
  mp_sessions_3: 'text-brand-blue', mp_sessions_5: 'text-brand-blue', host_master: 'text-indigo-400',
  mp_sessions_10: 'text-brand-blue', team_player: 'text-brand-blue', top_score: 'text-brand-orange',
  mp_sessions_15: 'text-brand-purple', grand_host: 'text-brand-purple',
  win_3: 'text-brand-orange', win_5: 'text-brand-orange', mp_sessions_25: 'text-brand-purple',
  host_25: 'text-brand-purple', win_10: 'text-amber-500', mp_sessions_50: 'text-amber-500',
  win_25: 'text-amber-500', host_50: 'text-amber-500', mp_legend: 'text-brand-orange',
  // Speed & Accuracy
  speed_first: 'text-brand-green', speed_5: 'text-brand-green', speed_10: 'text-brand-blue',
  speed_demon: 'text-brand-blue', lightning_speed: 'text-red-500', speed_20: 'text-red-500',
  speed_master: 'text-red-500', true_first: 'text-teal-500', true_10: 'text-teal-500',
  true_ace: 'text-teal-500', true_50: 'text-brand-green', true_100: 'text-brand-green',
  fill_perfect: 'text-pink-500', numbers_perfect: 'text-violet-500', crossword_25: 'text-amber-500',
  quote_10: 'text-sky-500', quote_25: 'text-sky-500', acc_champion: 'text-brand-orange',
  streak_ans_5: 'text-brand-purple', streak_ans_10: 'text-brand-purple',
};

/* ── Category groupings ────────────────────────────────────────────────── */
const CATEGORIES = [
  {
    id: 'overall',
    label: 'Overall',
    icon: Trophy,
    color: 'text-brand-orange',
    badgeVariant: 'orange' as const,
    ids: [
      'first_play','ans_25','ans_50','scholar','ans_250','scholar_500','scholar_1000',
      'total_50','century','total_500',
      'streak_3','streak_7','streak_14','streak_30','streak_60',
      'try_3','versatile','all_modes','perfect_game','perfect_3',
    ],
  },
  {
    id: 'solo',
    label: 'Solo Play',
    icon: Gamepad2,
    color: 'text-brand-purple',
    badgeVariant: 'purple' as const,
    ids: [
      'daily_first','daily_5','daily_7','daily_30',
      'perfect_solo','hard_first','hard_master',
      'flash_10','flash_25','flash_fan','flash_100',
      'scramble_5','word_wizard','scramble_50',
      'verse_first','verse_25','numbers_first',
      'crossword_first','crossword_10','quote_first',
    ],
  },
  {
    id: 'team',
    label: 'Team / Hosting',
    icon: Users,
    color: 'text-brand-blue',
    badgeVariant: 'blue' as const,
    ids: [
      'join_first','first_win','first_host',
      'mp_sessions_3','mp_sessions_5','host_master','mp_sessions_10','team_player','top_score',
      'mp_sessions_15','grand_host','win_3','win_5','mp_sessions_25','host_25',
      'win_10','mp_sessions_50','win_25','host_50','mp_legend',
    ],
  },
  {
    id: 'speed',
    label: 'Speed & Accuracy',
    icon: Zap,
    color: 'text-brand-green',
    badgeVariant: 'green' as const,
    ids: [
      'speed_first','speed_5','speed_10','speed_demon','lightning_speed','speed_20','speed_master',
      'true_first','true_10','true_ace','true_50','true_100',
      'fill_perfect','numbers_perfect','crossword_25','quote_10','quote_25',
      'acc_champion','streak_ans_5','streak_ans_10',
    ],
  },
];

/* ── Component ─────────────────────────────────────────────────────────── */
export function AchievementsGallery() {
  const [activeTab, setActiveTab] = useState('overall');
  const [earnedIds, setEarnedIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(loadProgress());
  const [streak, setStreak] = useState(getStreak());

  // Load local state
  useEffect(() => {
    setEarnedIds(getEarnedIds());
    setProgress(loadProgress());
    setStreak(getStreak());
  }, []);

  // Also load from API and merge
  const { data: apiData } = useListAchievements();
  useEffect(() => {
    if (apiData) {
      const apiIds = apiData.map((a: any) => a.type);
      setEarnedIds(prev => Array.from(new Set([...prev, ...apiIds])));
    }
  }, [apiData]);

  const allDefs = ACHIEVEMENT_DEFS;
  const totalEarned = allDefs.filter(a => earnedIds.includes(a.id)).length;

  const activeCategory = CATEGORIES.find(c => c.id === activeTab)!;
  const activeDefs = allDefs.filter(a => activeCategory.ids.includes(a.id));

  /* Streak-aware earned check */
  function isEarned(id: string): boolean {
    if (earnedIds.includes(id)) return true;
    // Check live for streak-based ones
    if (id === 'streak_3'  && streak.current >= 3)  return true;
    if (id === 'streak_7'  && streak.current >= 7)  return true;
    if (id === 'streak_14' && streak.current >= 14) return true;
    if (id === 'streak_30' && streak.current >= 30) return true;
    if (id === 'streak_60' && streak.current >= 60) return true;
    return false;
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-purple py-0.5">
            Trophy Room
          </h1>
          <p className="text-muted-foreground">Track your progress and accomplishments across every mode.</p>
        </div>

        {/* Overall progress */}
        <Card className="border-border/50 rounded-2xl min-w-[240px] shadow-sm shrink-0">
          <CardContent className="p-5">
            <div className="flex justify-between items-end mb-2">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Completion</span>
              <span className="font-heading font-black text-xl">{totalEarned} / {allDefs.length}</span>
            </div>
            <Progress value={(totalEarned / allDefs.length) * 100} indicatorColor="bg-gradient-to-r from-brand-orange to-brand-purple" className="h-2.5" />
          </CardContent>
        </Card>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Correct Answers', value: progress.correctAnswers, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
          { label: 'Questions Total', value: progress.totalAnswers,   color: 'text-brand-blue',   bg: 'bg-brand-blue/10' },
          { label: 'Daily Streak',    value: streak.current,          color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
          { label: 'Modes Played',    value: progress.modesPlayed.length, color: 'text-brand-green', bg: 'bg-brand-green/10' },
        ].map((s, i) => (
          <Card key={i} className="rounded-2xl border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
                <span className={`font-heading font-black text-sm ${s.color}`}>{s.value}</span>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-tight">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => {
          const catDefs = allDefs.filter(a => cat.ids.includes(a.id));
          const catEarned = catDefs.filter(a => isEarned(a.id)).length;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-secondary text-muted-foreground'}`}>
                {catEarned}/{catDefs.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeDefs.map((ach, i) => {
          const earned = isEarned(ach.id);
          const Icon = ICON_MAP[ach.id] || Star;
          const iconColor = COLOR_MAP[ach.id] || 'text-brand-purple';
          const progressDef = PROGRESS_TARGETS[ach.id];
          const currentVal = progressDef ? progressDef.value(progress) : null;
          const maxVal = progressDef?.max ?? null;
          const progressPct = currentVal !== null && maxVal ? Math.min((currentVal / maxVal) * 100, 100) : null;

          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                className={`h-full border-2 transition-all duration-300 rounded-2xl overflow-hidden ${
                  earned
                    ? 'border-brand-orange/30 hover:border-brand-orange/60 shadow-sm'
                    : 'border-border/40'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${earned ? 'bg-secondary' : 'bg-secondary/50'}`}>
                      <Icon className={`w-6 h-6 ${earned ? iconColor : 'text-muted-foreground opacity-30'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-heading font-bold text-base leading-tight ${!earned && 'text-muted-foreground'}`}>{ach.title}</h3>
                        {earned && <Badge variant="orange" className="text-[9px] px-1.5 py-0">Earned ✓</Badge>}
                      </div>
                      {!earned && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Shield className="w-3 h-3" /> Locked
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{ach.desc}</p>

                  {/* Progress bar for countable achievements */}
                  {!earned && progressPct !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground">Progress</span>
                        <span className="text-[10px] font-semibold text-foreground">{currentVal} / {maxVal}</span>
                      </div>
                      <Progress
                        value={progressPct}
                        className="h-1.5"
                        indicatorColor="bg-gradient-to-r from-brand-purple to-brand-blue"
                      />
                    </div>
                  )}

                  {/* Streak indicator for streak achievements */}
                  {!earned && ['streak_3','streak_7','streak_14','streak_30','streak_60'].includes(ach.id) && (
                    <div className="space-y-1">
                      {(() => {
                        const targets: Record<string,number> = { streak_3:3, streak_7:7, streak_14:14, streak_30:30, streak_60:60 };
                        const target = targets[ach.id];
                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-muted-foreground">Current streak</span>
                              <span className="text-[10px] font-semibold text-foreground">{streak.current} / {target} days</span>
                            </div>
                            <Progress
                              value={Math.min((streak.current / target) * 100, 100)}
                              className="h-1.5"
                              indicatorColor="bg-gradient-to-r from-brand-orange to-brand-purple"
                            />
                          </>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
