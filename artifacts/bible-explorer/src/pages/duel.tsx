import { useState } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@clerk/react';
import { Swords, Loader2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useCreateDuel, useJoinDuel } from '@workspace/api-client-react';
import { AuthGate } from '@/components/auth-gate';

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
] as const;

function displayNameFor(user: ReturnType<typeof useUser>['user']) {
  return user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Player';
}

function DuelHubSignedIn() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [joinCode, setJoinCode] = useState('');

  const createDuel = useCreateDuel();
  const joinDuel = useJoinDuel();

  const handleCreate = () => {
    createDuel.mutate(
      { data: { difficulty, totalQuestions: 10, hostName: displayNameFor(user) } },
      {
        onSuccess: (session) => setLocation(`/duel/${session.id}`),
        onError: () => toast.error('Could not create duel. Try again.'),
      },
    );
  };

  const handleJoin = () => {
    if (!joinCode.trim()) {
      toast.error('Enter your opponent\'s code');
      return;
    }
    joinDuel.mutate(
      { data: { pin: joinCode.trim(), playerName: displayNameFor(user) } },
      {
        onSuccess: (session) => setLocation(`/duel/${session.id}`),
        onError: () => toast.error('Duel not found or already full'),
      },
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-[80vh] flex flex-col">
      <Button variant="ghost" onClick={() => setLocation('/')} className="self-start gap-2 text-muted-foreground -ml-3">
        <ChevronLeft className="w-4 h-4" /> Back
      </Button>

      <div className="text-center mt-6 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-purple/30">
          <Swords className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-heading font-extrabold mb-2">1v1 Duel</h1>
        <p className="text-muted-foreground text-lg">Face off head-to-head. Both of you answer every question live.</p>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">Start a duel</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm border-2 transition-colors ${
                difficulty === d.value
                  ? 'bg-brand-purple text-white border-brand-purple'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <Button size="lg" onClick={handleCreate} disabled={createDuel.isPending} className="w-full rounded-full h-14 text-lg gap-2 bg-brand-purple hover:bg-brand-purple/90 text-white">
          {createDuel.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
          Create duel &amp; get a code
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-lg mb-4">Join with a code</h2>
        <div className="flex gap-3">
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="text-lg h-14 rounded-2xl text-center font-mono tracking-widest"
            maxLength={6}
          />
          <Button size="lg" onClick={handleJoin} disabled={joinDuel.isPending} className="rounded-2xl h-14 px-8">
            {joinDuel.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function DuelHub() {
  return (
    <AuthGate
      title="Sign in to duel"
      description="1v1 duels use your account to keep scores fair — sign in so no one can play under your name."
    >
      <DuelHubSignedIn />
    </AuthGate>
  );
}
