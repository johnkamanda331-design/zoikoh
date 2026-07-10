import React, { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetSessionLeaderboard, useGetSession, getGetSessionQueryKey, getGetSessionLeaderboardQueryKey } from '@workspace/api-client-react';

export function LiveLeaderboard() {
  const [, params] = useRoute('/session/:id/leaderboard');
  const sessionId = params?.id || '';
  const [, setLocation] = useLocation();

  const { data: session } = useGetSession(sessionId, { query: { enabled: !!sessionId, queryKey: getGetSessionQueryKey(sessionId) } });
  const { data: leaderboard, isLoading } = useGetSessionLeaderboard(sessionId, {
    query: { enabled: !!sessionId, queryKey: getGetSessionLeaderboardQueryKey(sessionId), refetchInterval: 3000 } // Poll every 3s
  });

  const [hasCelebrated, setHasCelebrated] = useState(false);

  useEffect(() => {
    if (session?.status === 'completed' && !hasCelebrated) {
      setHasCelebrated(true);
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6C3AED', '#2563EB', '#10B981', '#F59E0B']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6C3AED', '#2563EB', '#10B981', '#F59E0B']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [session?.status, hasCelebrated]);

  if (isLoading && !leaderboard) {
    return <div className="flex-1 flex items-center justify-center min-h-[80vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto min-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between mb-12">
        <Button variant="ghost" onClick={() => setLocation(`/session/${sessionId}`)} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to Game
        </Button>
        <Badge variant="outline" className="font-mono">{session?.pin}</Badge>
      </div>

      <div className="text-center mb-16 relative">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 text-brand-orange opacity-20"
        >
          <Sparkles className="w-32 h-32" />
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-orange relative z-10 py-2">
          Live Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">Rankings update in real-time</p>
      </div>

      <div className="flex-1 space-y-4 relative z-10">
        <AnimatePresence>
          {leaderboard?.map((entry, index) => (
            <motion.div
              key={entry.playerName}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.1 }}
              className={`flex items-center p-4 md:p-6 rounded-2xl border ${
                index === 0 ? 'bg-gradient-to-r from-brand-orange/20 to-transparent border-brand-orange shadow-[0_0_20px_rgba(245,158,11,0.2)]' :
                index === 1 ? 'bg-gradient-to-r from-slate-300/10 to-transparent border-slate-300/30' :
                index === 2 ? 'bg-gradient-to-r from-amber-700/10 to-transparent border-amber-700/30' :
                'bg-card border-border'
              }`}
            >
              <div className="w-12 md:w-16 text-center font-heading font-extrabold text-2xl md:text-3xl text-muted-foreground shrink-0">
                #{entry.rank}
              </div>
              
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-bold shrink-0 mx-4">
                {entry.playerName.substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-xl md:text-2xl truncate">{entry.playerName}</h3>
                <p className="text-sm text-muted-foreground">
                  {entry.correctAnswers} / {entry.totalAnswers} correct
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="font-heading font-extrabold text-2xl md:text-4xl text-brand-purple">
                  {entry.score}
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Points
                </div>
              </div>
            </motion.div>
          ))}

          {(!leaderboard || leaderboard.length === 0) && (
            <div className="text-center py-20 text-muted-foreground">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl font-medium">No scores recorded yet</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {session?.status === 'completed' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 flex justify-center">
          <Button size="lg" onClick={() => setLocation(`/session/${sessionId}/summary`)} className="rounded-full px-12 h-14 gap-2 shadow-xl">
            View Final Summary <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

