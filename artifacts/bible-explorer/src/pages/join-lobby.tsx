import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { LogIn, User, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useJoinSession } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { AuthGate } from '@/components/auth-gate';

export function JoinLobby() {
  return (
    <AuthGate title="Sign in to join" description="Joining a session now requires an account so no one can play under your name or steal your score.">
      <JoinLobbyInner />
    </AuthGate>
  );
}

function JoinLobbyInner() {
  const [, setLocation] = useLocation();
  const joinSession = useJoinSession();
  
  const [pin, setPin] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || !playerName) return;

    joinSession.mutate({
      data: {
        pin: pin.toUpperCase(),
        playerName: playerName.trim()
      }
    }, {
      onSuccess: (data) => {
        // Store player name in session storage so the live session knows who this device is
        sessionStorage.setItem(`zoiko_player_${data.id}`, playerName.trim());
        toast.success('Joined successfully!');
        setLocation(`/session/${data.id}`);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || 'Invalid PIN or session unavailable.');
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-brand-blue/20 to-brand-purple/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <Button
        variant="ghost"
        onClick={() => setLocation('/')}
        className="absolute top-4 left-4 gap-2 text-muted-foreground"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-4">Join Game</h1>
          <p className="text-muted-foreground text-lg">Enter the PIN on the host's screen</p>
        </div>

        <Card className="bg-card/60 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Game PIN</label>
                <div className="relative">
                  <Input 
                    value={pin}
                    onChange={(e) => setPin(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="e.g. A7X9B2"
                    className="h-16 text-center text-3xl font-heading font-bold tracking-[0.2em] bg-background/50 border-white/10 rounded-2xl focus-visible:ring-brand-purple"
                    maxLength={6}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Nickname</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <User className="w-5 h-5" />
                  </div>
                  <Input 
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name..."
                    className="h-14 pl-12 text-lg font-medium bg-background/50 border-white/10 rounded-2xl focus-visible:ring-brand-purple"
                    maxLength={20}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-brand-purple to-brand-blue hover:from-brand-purple/90 hover:to-brand-blue/90 shadow-lg shadow-brand-purple/20 transition-all"
                disabled={!pin || !playerName || joinSession.isPending}
              >
                {joinSession.isPending ? 'Joining...' : 'Join Game'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}