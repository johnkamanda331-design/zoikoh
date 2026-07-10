import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Plus, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCreateSession, SessionInputDifficulty } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { AuthGate } from '@/components/auth-gate';

export function HostWizard() {
  return (
    <AuthGate title="Sign in to host" description="Hosting a session now requires an account so your name and stats can't be spoofed by others.">
      <HostWizardInner />
    </AuthGate>
  );
}

function HostWizardInner() {
  const [, setLocation] = useLocation();
  const createSession = useCreateSession();
  
  const [step, setStep] = useState(1);
  const [difficulty, setDifficulty] = useState<SessionInputDifficulty>(SessionInputDifficulty.medium);
  const [playStyle, setPlayStyle] = useState('Classic');
  const [participants, setParticipants] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  
  const [createdSession, setCreatedSession] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && !participants.includes(newName.trim())) {
      setParticipants([...participants, newName.trim()]);
      setNewName('');
    }
  };

  const handleRemoveParticipant = (name: string) => {
    setParticipants(participants.filter(p => p !== name));
  };

  const handleLaunch = () => {
    createSession.mutate({
      data: {
        difficulty,
        playStyle,
        participants,
        totalQuestions: 10
      }
    }, {
      onSuccess: (data) => {
        setCreatedSession(data);
        setStep(5); // Success step
      },
      onError: () => {
        toast.error('Failed to create session');
      }
    });
  };

  const copyPin = () => {
    if (createdSession?.pin) {
      navigator.clipboard.writeText(createdSession.pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('PIN copied to clipboard');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto min-h-[80vh] flex flex-col justify-center">
      {/* Progress Indicator */}
      {step < 5 && (
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${step >= i ? 'bg-brand-purple' : 'bg-secondary'}`} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-heading font-extrabold mb-2">Select Difficulty</h2>
                <p className="text-muted-foreground">Tailor the questions to your group's knowledge level.</p>
              </div>
              <Button variant="ghost" size="lg" onClick={() => setLocation('/')} className="gap-2 shrink-0">
                <ChevronLeft className="w-4 h-4" /> Cancel
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: 'easy', label: 'Easy', desc: 'Basics & well-known stories', color: 'bg-brand-green' },
                { id: 'medium', label: 'Medium', desc: 'Deeper concepts & details', color: 'bg-brand-blue' },
                { id: 'hard', label: 'Hard', desc: 'Scholarly trivia & obscure facts', color: 'bg-brand-purple' },
                { id: 'mixed', label: 'Mixed', desc: 'A blend of easy, medium & hard questions', color: 'bg-brand-orange' },
              ].map(diff => (
                <Card 
                  key={diff.id} 
                  className={`cursor-pointer border-2 transition-all duration-200 ${difficulty === diff.id ? 'border-primary shadow-[0_0_20px_rgba(108,58,237,0.3)] bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => setDifficulty(diff.id as SessionInputDifficulty)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-3 h-3 rounded-full ${diff.color} mx-auto mb-4`} />
                    <h3 className="font-heading font-bold text-xl mb-2 capitalize">{diff.label}</h3>
                    <p className="text-sm text-muted-foreground">{diff.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end pt-8">
              <Button size="lg" onClick={handleNext} className="gap-2 rounded-full px-8">Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div>
              <h2 className="text-3xl font-heading font-extrabold mb-2">Play Style</h2>
              <p className="text-muted-foreground">How do you want to run the game?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'Classic', desc: 'Host controls the pace, advancing questions manually.' },
                { id: 'Speed Round', desc: '10 second timer per question. Fast paced.' }
              ].map(style => (
                <Card 
                  key={style.id} 
                  className={`cursor-pointer border-2 transition-all duration-200 ${playStyle === style.id ? 'border-primary shadow-[0_0_20px_rgba(108,58,237,0.3)] bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => setPlayStyle(style.id)}
                >
                  <CardContent className="p-6">
                    <h3 className="font-heading font-bold text-xl mb-2">{style.id}</h3>
                    <p className="text-sm text-muted-foreground">{style.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-between pt-8">
              <Button variant="ghost" size="lg" onClick={handlePrev} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
              <Button size="lg" onClick={handleNext} className="gap-2 rounded-full px-8">Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div>
              <h2 className="text-3xl font-heading font-extrabold mb-2">Pre-add Participants (Optional)</h2>
              <p className="text-muted-foreground">Players can also join themselves via PIN later.</p>
            </div>
            <form onSubmit={handleAddParticipant} className="flex gap-2">
              <Input 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Enter player name..."
                className="h-12 text-lg"
              />
              <Button type="submit" size="lg" className="h-12 w-12 p-0"><Plus className="w-5 h-5" /></Button>
            </form>
            <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-secondary/50 rounded-2xl border border-border">
              {participants.length === 0 && <span className="text-muted-foreground text-sm italic m-auto">No pre-added players</span>}
              {participants.map(p => (
                <div key={p} className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full text-sm font-medium">
                  {p}
                  <button onClick={() => handleRemoveParticipant(p)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-8">
              <Button variant="ghost" size="lg" onClick={handlePrev} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
              <Button size="lg" onClick={handleNext} className="gap-2 rounded-full px-8">Review <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div>
              <h2 className="text-3xl font-heading font-extrabold mb-2">Ready to Launch</h2>
              <p className="text-muted-foreground">Review your settings before creating the session.</p>
            </div>
            <Card className="bg-card border-border overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground font-medium">Difficulty</span>
                  <span className="font-bold capitalize text-brand-purple">{difficulty}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground font-medium">Play Style</span>
                  <span className="font-bold">{playStyle}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground font-medium">Pre-registered Players</span>
                  <span className="font-bold">{participants.length}</span>
                </div>
              </div>
            </Card>
            <div className="flex justify-between pt-8">
              <Button variant="ghost" size="lg" onClick={handlePrev} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
              <Button 
                variant="purple" 
                size="lg" 
                onClick={handleLaunch} 
                className="gap-2 rounded-full px-8 shadow-lg shadow-brand-purple/20"
                disabled={createSession.isPending}
              >
                {createSession.isPending ? 'Creating...' : 'Launch Session'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 5 && createdSession && (
          <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-10">
            <div className="w-20 h-20 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-brand-green" />
            </div>
            <h2 className="text-4xl font-heading font-extrabold">Session Created!</h2>
            <p className="text-xl text-muted-foreground">Ask players to join using this PIN:</p>
            
            <div className="flex justify-center my-8">
              <div 
                className="group relative flex items-center justify-center bg-secondary/80 border border-border rounded-3xl px-12 py-6 cursor-pointer hover:bg-secondary transition-colors"
                onClick={copyPin}
              >
                <span className="text-7xl font-heading font-black tracking-widest text-brand-purple">{createdSession.pin}</span>
                <div className="absolute -right-4 -top-4 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  {copied ? <Check className="w-5 h-5 text-brand-green" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={() => setLocation(`/session/${createdSession.id}`)}
              className="h-16 px-12 text-xl rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-xl"
            >
              Enter Game Lobby
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}