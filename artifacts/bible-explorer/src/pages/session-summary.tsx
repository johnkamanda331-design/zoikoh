import React, { useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { Trophy, Share2, Award, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetSessionLeaderboard, useGetSession, getGetSessionQueryKey, getGetSessionLeaderboardQueryKey } from '@workspace/api-client-react';

export function SessionSummary() {
  const [, params] = useRoute('/session/:id/summary');
  const sessionId = params?.id || '';
  const [, setLocation] = useLocation();

  const { data: session } = useGetSession(sessionId, { query: { enabled: !!sessionId, queryKey: getGetSessionQueryKey(sessionId) } });
  const { data: leaderboard } = useGetSessionLeaderboard(sessionId, { query: { enabled: !!sessionId, queryKey: getGetSessionLeaderboardQueryKey(sessionId) } });

  const shareCardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    try {
      const canvas = await html2canvas(shareCardRef.current, { backgroundColor: '#0F172A', scale: 2 });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          toast.success('Summary card copied to clipboard!');
        });
      });
    } catch (err) {
      toast.error('Failed to copy card.');
    }
  };

  const topPlayer = leaderboard?.[0];
  const secondPlayer = leaderboard?.[1];
  const thirdPlayer = leaderboard?.[2];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-[80vh]">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold mb-4">Session Complete!</h1>
        <p className="text-xl text-muted-foreground">What a game. Here's how everyone did.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
        {/* Podium */}
        <div className="md:col-span-8 flex flex-col justify-end min-h-[300px] border-b border-border pb-0 relative px-4">
          <div className="flex items-end justify-center gap-2 md:gap-6 h-full pb-0">
            {/* 2nd Place */}
            {secondPlayer && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center w-1/3">
                <div className="text-center mb-4">
                  <div className="font-heading font-bold text-lg md:text-xl truncate max-w-[100px]">{secondPlayer.playerName}</div>
                  <div className="text-brand-purple font-bold">{secondPlayer.score}</div>
                </div>
                <div className="w-full h-32 md:h-40 bg-slate-200 dark:bg-slate-800 rounded-t-xl border border-slate-300 dark:border-slate-700 flex justify-center pt-4 shadow-inner">
                  <span className="text-4xl font-heading font-black text-slate-400 dark:text-slate-600">2</span>
                </div>
              </motion.div>
            )}

            {/* 1st Place */}
            {topPlayer && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center w-1/3 z-10">
                <Trophy className="w-10 h-10 text-brand-orange mb-2 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                <div className="text-center mb-4">
                  <div className="font-heading font-black text-xl md:text-2xl truncate max-w-[120px] text-brand-orange">{topPlayer.playerName}</div>
                  <div className="text-brand-purple font-bold text-lg">{topPlayer.score}</div>
                </div>
                <div className="w-full h-40 md:h-52 bg-gradient-to-t from-brand-orange/80 to-brand-orange/40 rounded-t-xl border border-brand-orange/50 flex justify-center pt-4 shadow-[0_-10px_30px_rgba(245,158,11,0.2)]">
                  <span className="text-5xl font-heading font-black text-white/50">1</span>
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {thirdPlayer && (
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col items-center w-1/3">
                <div className="text-center mb-4">
                  <div className="font-heading font-bold text-lg md:text-xl truncate max-w-[100px]">{thirdPlayer.playerName}</div>
                  <div className="text-brand-purple font-bold">{thirdPlayer.score}</div>
                </div>
                <div className="w-full h-24 md:h-32 bg-amber-700/20 rounded-t-xl border border-amber-700/30 flex justify-center pt-4 shadow-inner">
                  <span className="text-4xl font-heading font-black text-amber-700/40">3</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Share Card */}
        <div className="md:col-span-4 flex flex-col justify-end">
          <Card ref={shareCardRef} className="bg-gradient-to-br from-[#0F172A] to-[#1E1B4B] border-white/10 overflow-hidden relative mb-4">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <CardContent className="p-6 relative z-10 text-white">
              <div className="flex justify-between items-center mb-6">
                <span className="font-heading font-extrabold tracking-tighter text-xl">ZOIKO</span>
                <Badge variant="outline" className="bg-white/10 border-white/20 text-white">Session {session?.pin}</Badge>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider font-bold mb-1">Top Player</p>
                  <p className="text-2xl font-heading font-bold text-brand-orange flex items-center gap-2">
                    <Award className="w-5 h-5" /> {topPlayer?.playerName || '-'}
                  </p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wider font-bold mb-1">Top Score</p>
                    <p className="text-xl font-bold">{topPlayer?.score || 0} pts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs uppercase tracking-wider font-bold mb-1">Questions</p>
                    <p className="text-xl font-bold">{session?.questions?.length || 0}</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 text-center text-sm font-medium text-brand-purple">
                Play now at zoiko.app
              </div>
            </CardContent>
          </Card>
          <Button variant="outline" onClick={handleShare} className="w-full gap-2">
            <Share2 className="w-4 h-4" /> Share Summary Image
          </Button>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-8 border-t border-border">
        <Button variant="ghost" size="lg" onClick={() => setLocation('/')} className="rounded-full px-8">Return Home</Button>
        <Button variant="purple" size="lg" onClick={() => setLocation('/start')} className="rounded-full px-8 gap-2 shadow-lg">
          Host Another <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

