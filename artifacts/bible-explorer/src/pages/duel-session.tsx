import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Loader2, ChevronLeft, Trophy, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AuthGate } from '@/components/auth-gate';
import {
  useGetSession,
  useSubmitAnswer,
  useGetSessionLeaderboard,
  getGetSessionQueryKey,
  getGetSessionLeaderboardQueryKey,
} from '@workspace/api-client-react';

function DuelSessionSignedIn() {
  const [, params] = useRoute('/duel/:id');
  const sessionId = params?.id || '';
  const [, setLocation] = useLocation();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { data: session, isLoading } = useGetSession(sessionId, {
    query: {
      enabled: !!sessionId,
      queryKey: getGetSessionQueryKey(sessionId),
      refetchInterval: 1500,
    },
  });

  const { data: leaderboard } = useGetSessionLeaderboard(sessionId, {
    query: {
      enabled: !!sessionId && session?.status !== 'waiting',
      queryKey: getGetSessionLeaderboardQueryKey(sessionId),
      refetchInterval: 1500,
    },
  });

  const submitAnswer = useSubmitAnswer();

  // Reset local answer state whenever the server advances the question —
  // this is the signal that both duelists have answered, since duels have
  // no host to click "next".
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswerResult(null);
  }, [session?.currentQuestionIndex]);

  const handleCopy = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.pin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleAnswer = (answer: string) => {
    if (!session?.questions || selectedAnswer) return;
    setSelectedAnswer(answer);
    submitAnswer.mutate(
      { id: sessionId, data: { questionId: session.questions[session.currentQuestionIndex].id, answer } },
      {
        onSuccess: (result) => setAnswerResult(result),
        onError: () => {
          setSelectedAnswer(null);
          toast.error("Couldn't submit — try again");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || session.type !== 'duel') {
    return <div className="p-8 text-center text-destructive font-bold">Duel not found.</div>;
  }

  // The server resolves "who am I in this session" from the verified
  // participant record (session.myDisplayName) rather than trusting a
  // client-guessed name — dedupe can rename a joiner (e.g. "Alex" -> "Alex 2"),
  // so matching on the raw Clerk profile name would misidentify players.
  const myName = session.myDisplayName;
  const opponentName = session.participants.find((p) => p !== myName);
  const myScore = leaderboard?.find((l) => l.playerName === myName);
  const opponentScore = leaderboard?.find((l) => l.playerName === opponentName);

  // ── WAITING ──────────────────────────────────────────────────────────
  if (session.status === 'waiting') {
    return (
      <div className="p-6 max-w-lg mx-auto min-h-[80vh] flex flex-col">
        <Button variant="ghost" onClick={() => setLocation('/duel')} className="self-start gap-2 text-muted-foreground -ml-3">
          <ChevronLeft className="w-4 h-4" /> Cancel
        </Button>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center mb-6 shadow-lg shadow-brand-purple/30">
            <Swords className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-heading font-extrabold mb-2">Waiting for your opponent…</h1>
          <p className="text-muted-foreground text-lg mb-8">Share this code — the duel starts the moment they join.</p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-3 px-8 py-5 bg-secondary rounded-2xl border border-border font-mono text-3xl font-bold tracking-widest hover:bg-secondary/70 transition-colors"
          >
            {session.pin}
            {copied ? <Check className="w-6 h-6 text-brand-green" /> : <Copy className="w-6 h-6 text-muted-foreground" />}
          </button>
        </div>
      </div>
    );
  }

  // ── COMPLETED ────────────────────────────────────────────────────────
  if (session.status === 'completed') {
    const iWon = (myScore?.score ?? 0) > (opponentScore?.score ?? 0);
    const tied = (myScore?.score ?? 0) === (opponentScore?.score ?? 0);

    return (
      <div className="p-6 max-w-2xl mx-auto min-h-[80vh] flex flex-col items-center justify-center text-center">
        <Trophy className={`w-16 h-16 mb-6 ${iWon ? 'text-brand-orange' : 'text-muted-foreground'}`} />
        <h1 className="text-4xl font-heading font-extrabold mb-2">
          {tied ? "It's a tie!" : iWon ? 'You won!' : `${opponentName} won`}
        </h1>
        <p className="text-muted-foreground text-lg mb-10">Duel complete — here's the final score.</p>

        <div className="w-full grid grid-cols-2 gap-4 mb-10">
          <div className={`p-6 rounded-3xl border-2 ${iWon || tied ? 'border-brand-purple bg-brand-purple/10' : 'border-border bg-card'}`}>
            <p className="text-sm text-muted-foreground mb-1">You</p>
            <p className="text-4xl font-heading font-extrabold">{myScore?.score ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">{myScore?.correctAnswers ?? 0}/{myScore?.totalAnswers ?? 0} correct</p>
          </div>
          <div className={`p-6 rounded-3xl border-2 ${!iWon && !tied ? 'border-brand-blue bg-brand-blue/10' : 'border-border bg-card'}`}>
            <p className="text-sm text-muted-foreground mb-1">{opponentName}</p>
            <p className="text-4xl font-heading font-extrabold">{opponentScore?.score ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">{opponentScore?.correctAnswers ?? 0}/{opponentScore?.totalAnswers ?? 0} correct</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button size="lg" variant="outline" onClick={() => setLocation('/duel')} className="rounded-full px-8">
            New duel
          </Button>
          <Button size="lg" onClick={() => setLocation('/')} className="rounded-full px-8">
            Home
          </Button>
        </div>
      </div>
    );
  }

  // ── ACTIVE ───────────────────────────────────────────────────────────
  const currentQ = session.questions?.[session.currentQuestionIndex];
  if (!currentQ) return <div className="p-8 text-center">Loading question…</div>;

  const hasAnswered = selectedAnswer !== null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <Badge variant="secondary" className="px-4 py-1.5 text-sm">
          Q {session.currentQuestionIndex + 1} / {session.questions?.length}
        </Badge>
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="text-brand-purple">You: {myScore?.score ?? 0}</span>
          <span className="text-muted-foreground">vs</span>
          <span className="text-brand-blue">{opponentName}: {opponentScore?.score ?? 0}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-2xl md:text-4xl font-heading font-bold text-center mb-12 leading-tight max-w-3xl">
          {currentQ.text}
        </h2>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQ.options.map((opt, i) => {
            const isSelected = selectedAnswer === opt;
            let btnClass = 'bg-card border-border hover:bg-secondary';
            if (hasAnswered) {
              btnClass = isSelected ? 'bg-brand-purple/20 border-brand-purple text-brand-purple' : 'opacity-40 bg-card border-border';
            }
            return (
              <button
                key={i}
                disabled={hasAnswered}
                onClick={() => handleAnswer(opt)}
                className={`p-6 md:p-8 rounded-3xl border-2 text-left text-lg md:text-xl font-bold transition-all duration-300 active:scale-95 ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {answerResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
              {answerResult.correct ? (
                <div className="inline-flex items-center justify-center p-4 bg-brand-green/20 text-brand-green rounded-full font-bold text-xl px-8">
                  Correct! +{answerResult.score} pts
                </div>
              ) : (
                <div className="inline-flex items-center justify-center p-4 bg-destructive/20 text-destructive rounded-full font-bold text-xl px-8">
                  Incorrect. Answer: {answerResult.correctAnswer}
                </div>
              )}
              <p className="mt-4 text-muted-foreground text-lg">Waiting for {opponentName}…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function DuelSession() {
  return (
    <AuthGate title="Sign in to view this duel" description="This duel is tied to a signed-in account so scores can't be spoofed.">
      <DuelSessionSignedIn />
    </AuthGate>
  );
}
