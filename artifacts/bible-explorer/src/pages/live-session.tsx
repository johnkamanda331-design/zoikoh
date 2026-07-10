import React, { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Clock, Trophy, ArrowRight, Play, Loader2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGetSession, useUpdateSession, useSubmitAnswer, getGetSessionQueryKey } from '@workspace/api-client-react';

export function LiveSession() {
  const [, params] = useRoute('/session/:id');
  const sessionId = params?.id || '';
  const [, setLocation] = useLocation();

  const [localPlayerName, setLocalPlayerName] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    // Check if this device is playing or just hosting
    const name = sessionStorage.getItem(`zoiko_player_${sessionId}`);
    setLocalPlayerName(name);
  }, [sessionId]);

  // Poll session data
  const { data: session, isLoading } = useGetSession(sessionId, {
    query: {
      enabled: !!sessionId,
      queryKey: getGetSessionQueryKey(sessionId),
      refetchInterval: 2000 // Poll every 2s for live updates
    }
  });

  const updateSession = useUpdateSession();
  const submitAnswer = useSubmitAnswer();

  const isHost = !localPlayerName; // Simple heuristic: if we didn't join as a player, we're likely the host who created it.

  // Handle countdown timer for active questions
  useEffect(() => {
    if (session?.status === 'active') {
      // Simple timer - in a real app, sync this strictly with server time
      setTimeLeft(20);
      const interval = setInterval(() => {
        setTimeLeft((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [session?.status, session?.currentQuestionIndex]);

  // Handle advancing question
  const handleNextQuestion = () => {
    if (!session || !isHost) return;
    
    // reset local states
    setSelectedAnswer(null);
    setAnswerResult(null);

    const isLast = session.currentQuestionIndex >= (session.questions?.length || 0) - 1;
    
    if (isLast) {
      updateSession.mutate({
        id: sessionId,
        data: { status: 'completed' }
      }, {
        onSuccess: () => setLocation(`/session/${sessionId}/summary`)
      });
    } else {
      updateSession.mutate({
        id: sessionId,
        data: { currentQuestionIndex: session.currentQuestionIndex + 1 }
      });
    }
  };

  // Handle submitting answer
  const handleAnswerSubmit = (answer: string) => {
    if (!localPlayerName || !session?.questions) return;
    
    setSelectedAnswer(answer);
    
    submitAnswer.mutate({
      id: sessionId,
      data: {
        questionId: session.questions[session.currentQuestionIndex].id,
        answer
      }
    }, {
      onSuccess: (result) => {
        setAnswerResult(result);
      }
    });
  };

  const handleStartGame = () => {
    if (!isHost) return;
    updateSession.mutate({
      id: sessionId,
      data: { status: 'active', currentQuestionIndex: 0 }
    });
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-[80vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!session) {
    return <div className="p-8 text-center text-destructive font-bold">Session not found.</div>;
  }

  if (session.status === 'completed') {
    setLocation(`/session/${sessionId}/summary`);
    return null;
  }

  // --- WAITING LOBBY ---
  if (session.status === 'waiting') {
    return (
      <div className="p-6 max-w-5xl mx-auto min-h-[80vh] flex flex-col">
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="self-start gap-2 text-muted-foreground -ml-3"
        >
          <ChevronLeft className="w-4 h-4" /> Leave Lobby
        </Button>
        <div className="text-center mb-12 mt-8">
          <Badge variant="outline" className="mb-4">Session PIN: <span className="ml-2 font-mono font-bold text-brand-purple">{session.pin}</span></Badge>
          <h1 className="text-5xl font-heading font-extrabold mb-4">Waiting for players...</h1>
          <p className="text-muted-foreground text-xl">Join at zoiko.app and enter PIN <strong className="text-foreground">{session.pin}</strong></p>
        </div>

        <div className="flex-1 bg-card/50 border border-border rounded-3xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Users className="text-brand-blue w-6 h-6" />
              <h2 className="text-2xl font-bold">{session.participants.length} Players Joined</h2>
            </div>
            {isHost && (
              <Button size="lg" onClick={handleStartGame} className="rounded-full px-8 gap-2 shadow-lg shadow-brand-purple/20 bg-brand-purple hover:bg-brand-purple/90 text-white">
                Start Game <Play className="w-4 h-4 fill-current" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {session.participants.map((p, i) => (
              <motion.div
                key={p}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="px-6 py-3 bg-secondary rounded-2xl font-bold text-lg border border-border"
              >
                {p}
              </motion.div>
            ))}
            {session.participants.length === 0 && (
              <div className="w-full text-center py-12 text-muted-foreground animate-pulse">
                Waiting for the first player to join...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE GAMEPLAY ---
  const currentQ = session.questions?.[session.currentQuestionIndex];
  
  if (!currentQ) return <div>Question not found</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <Badge variant="secondary" className="px-4 py-1.5 text-sm">
          Q {session.currentQuestionIndex + 1} / {session.questions?.length}
        </Badge>
        
        {isHost && (
          <Button variant="outline" size="sm" onClick={() => setLocation(`/session/${sessionId}/leaderboard`)} className="gap-2">
            <Trophy className="w-4 h-4" /> Live Leaderboard
          </Button>
        )}

        <div className={`flex items-center justify-center w-16 h-16 rounded-full border-4 font-bold text-2xl ${timeLeft <= 5 ? 'border-destructive text-destructive animate-pulse' : 'border-primary text-primary'}`}>
          {timeLeft}
        </div>
      </div>

      <Progress value={(timeLeft / 20) * 100} className="mb-12 h-2" indicatorColor={timeLeft <= 5 ? "bg-destructive" : "bg-primary"} />

      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-center mb-16 leading-tight max-w-4xl">
          {currentQ.text}
        </h2>

        {/* HOST VIEW */}
        {isHost ? (
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {currentQ.options.map((opt, i) => {
                // Host sees correct answer highlighted when time is up or ready to advance
                const isCorrect = opt === currentQ.correctAnswer;
                return (
                  <div key={i} className={`p-6 rounded-2xl border-2 text-center text-xl font-medium transition-colors ${timeLeft === 0 && isCorrect ? 'bg-brand-green/20 border-brand-green text-brand-green' : 'bg-card border-border'}`}>
                    {opt}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-12 flex justify-center">
               <Button size="lg" onClick={handleNextQuestion} className="rounded-full px-12 h-16 text-lg gap-3">
                 {session.currentQuestionIndex >= (session.questions?.length || 0) - 1 ? 'End Game' : 'Next Question'} <ArrowRight className="w-5 h-5" />
               </Button>
            </div>
          </div>
        ) : (
          /* PLAYER VIEW */
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedAnswer === opt;
              const hasAnswered = selectedAnswer !== null;
              
              let btnClass = "bg-card border-border hover:bg-secondary";
              if (hasAnswered) {
                if (isSelected) btnClass = "bg-brand-purple/20 border-brand-purple text-brand-purple";
                else btnClass = "opacity-40 bg-card border-border";
              }

              return (
                <button
                  key={i}
                  disabled={hasAnswered || timeLeft === 0}
                  onClick={() => handleAnswerSubmit(opt)}
                  className={`p-6 md:p-8 rounded-3xl border-2 text-left text-xl md:text-2xl font-bold transition-all duration-300 transform active:scale-95 ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}

            {answerResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-1 md:col-span-2 mt-8 text-center">
                {answerResult.correct ? (
                  <div className="inline-flex items-center justify-center p-4 bg-brand-green/20 text-brand-green rounded-full font-bold text-xl px-8">
                    Correct! +{answerResult.score} pts
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center p-4 bg-destructive/20 text-destructive rounded-full font-bold text-xl px-8">
                    Incorrect. Correct answer was {answerResult.correctAnswer}
                  </div>
                )}
                <p className="mt-4 text-muted-foreground text-lg">Waiting for host to advance...</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}