import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Trash2, Wand2, Database, UploadCloud,
  LogIn, LogOut, User, Target, Gamepad2, Users, Crown, Swords, Trophy, Flame, Settings as SettingsIcon,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useListQuestions, useDeleteQuestion, useGenerateQuestions, useSaveGeneratedQuestions, QuestionInputDifficulty, GenerateQuestionsInputDifficulty } from '@workspace/api-client-react';
import { useUser, useClerk } from '@clerk/react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { loadProgress, getPlayerName, type PlayerProgress } from '@/hooks/use-achievements';
import { PreferencesPanel } from '@/components/preferences-panel';

/* ── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div>
          <p className="text-lg font-heading font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Account tab ───────────────────────────────────────────────────────── */
function AccountTab() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [playerName, setPlayerName] = useState('Player');

  useEffect(() => {
    setProgress(loadProgress());
    setPlayerName(getPlayerName());
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully.');
    setLocation('/');
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <div className="animate-pulse">Loading…</div>
      </div>
    );
  }

  const accuracy = progress && progress.totalAnswers > 0
    ? Math.round((progress.correctAnswers / progress.totalAnswers) * 100)
    : 0;

  /* ── Signed-out state ─────────────────────────────────────────────── */
  if (!isSignedIn) {
    return (
      <div className="space-y-6">
        <Card className="border-border rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center shadow-lg shadow-brand-purple/30">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold mb-1">Sign in to ZOIKOH</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                Sign in to host sessions, join duels, and sync your stats across devices.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={() => setLocation('/sign-in')}
                className="rounded-full px-8 bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90"
              >
                Sign in
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation('/sign-up')}
                className="rounded-full px-8"
              >
                Create account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Local stats even when signed out */}
        {progress && (
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-base text-muted-foreground uppercase tracking-wider text-xs">
              Local Progress (sign in to save across devices)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Target}   label="Accuracy"       value={`${accuracy}%`}                   color="text-brand-purple" bg="bg-brand-purple/10" />
              <StatCard icon={Gamepad2} label="Q's Answered"   value={progress.correctAnswers}           color="text-brand-blue"   bg="bg-brand-blue/10" />
              <StatCard icon={Users}    label="Sessions"       value={progress.sessionsPlayed}           color="text-brand-green"  bg="bg-brand-green/10" />
              <StatCard icon={Flame}    label="Best Streak"    value={`${progress.longestAnswerStreak}`} color="text-brand-orange" bg="bg-brand-orange/10" />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Signed-in state ──────────────────────────────────────────────── */
  const displayName = user.firstName || user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Player';
  const email = user.emailAddresses?.[0]?.emailAddress;

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <Card className="border-border rounded-3xl overflow-hidden">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={displayName}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-brand-purple/30 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-heading font-bold">{displayName}</h2>
            {email && <p className="text-muted-foreground text-sm mt-0.5">{email}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Player name: <span className="text-foreground font-medium">{playerName}</span>
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10 rounded-full"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats overview */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-lg">Your Stats</h3>

        {/* Overall */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Target}   label="Accuracy"       value={`${accuracy}%`}                   color="text-brand-purple" bg="bg-brand-purple/10" />
            <StatCard icon={Gamepad2} label="Q's Answered"   value={progress?.correctAnswers ?? 0}     color="text-brand-blue"   bg="bg-brand-blue/10" />
            <StatCard icon={Flame}    label="Best Streak"    value={progress?.longestAnswerStreak ?? 0} color="text-brand-orange" bg="bg-brand-orange/10" />
            <StatCard icon={Trophy}   label="Perfect Games"  value={progress?.perfectGames ?? 0}       color="text-brand-green"  bg="bg-brand-green/10" />
          </div>
        </div>

        {/* Solo modes */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solo Play</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Gamepad2} label="Flash Cards"    value={progress?.flashCardsKnown ?? 0}    color="text-brand-blue"   bg="bg-brand-blue/10" />
            <StatCard icon={Gamepad2} label="Word Scrambles" value={progress?.wordsUnscrambled ?? 0}   color="text-brand-purple" bg="bg-brand-purple/10" />
            <StatCard icon={Gamepad2} label="Speed Rounds"   value={progress?.speedRoundCorrect ?? 0}  color="text-brand-orange" bg="bg-brand-orange/10" />
            <StatCard icon={Gamepad2} label="Modes Tried"    value={progress?.modesPlayed?.length ?? 0} color="text-brand-green" bg="bg-brand-green/10" />
          </div>
        </div>

        {/* Multiplayer */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Multiplayer</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users}  label="Sessions Played"  value={progress?.sessionsPlayed ?? 0}  color="text-brand-green"  bg="bg-brand-green/10" />
            <StatCard icon={Trophy} label="Sessions Won"     value={progress?.sessionsWon ?? 0}     color="text-brand-purple" bg="bg-brand-purple/10" />
            <StatCard icon={Crown}  label="Sessions Hosted"  value={progress?.sessionsHosted ?? 0}  color="text-brand-blue"   bg="bg-brand-blue/10" />
            <StatCard icon={Swords} label="Duels"            value={progress?.sessionsPlayed ?? 0}  color="text-brand-orange" bg="bg-brand-orange/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main settings page ────────────────────────────────────────────────── */
export function SettingsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Data hooks
  const { data: questionsData, refetch } = useListQuestions({ limit: 50 });
  const deleteQuestion = useDeleteQuestion();

  // Generator state
  const generateQuestions = useGenerateQuestions();
  const saveGeneratedQuestions = useSaveGeneratedQuestions();

  const [genDifficulty, setGenDifficulty] = useState<GenerateQuestionsInputDifficulty>(GenerateQuestionsInputDifficulty.medium);
  const [genCount, setGenCount] = useState(5);
  const [genTopic, setGenTopic] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);

  const handleDelete = (id: number) => {
    deleteQuestion.mutate({ id }, {
      onSuccess: () => {
        toast.success('Question deleted.');
        refetch();
      },
    });
  };

  const handleGenerate = () => {
    generateQuestions.mutate({
      data: { difficulty: genDifficulty, count: genCount, topic: genTopic || undefined },
    }, {
      onSuccess: (data) => {
        setPreviewQuestions(data);
        toast.success(`Generated ${data.length} questions.`);
      },
      onError: () => toast.error('Failed to generate questions.'),
    });
  };

  const handleSaveGenerated = () => {
    if (!previewQuestions.length) return;
    const inputs = previewQuestions.map(q => ({
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty as QuestionInputDifficulty,
      categoryId: 1,
      explanation: q.explanation,
      book: q.book,
    }));
    saveGeneratedQuestions.mutate({ data: { questions: inputs } }, {
      onSuccess: () => {
        toast.success('Saved to database!');
        setPreviewQuestions([]);
        refetch();
      },
    });
  };

  const questions = questionsData?.questions || [];
  const filteredQuestions = questions.filter(q =>
    q.text.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-5xl font-heading font-extrabold mb-2">Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your account, questions, and AI generator.</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8 bg-secondary/50 p-1 rounded-xl h-12">
          <TabsTrigger value="account"   className="rounded-lg font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <User className="w-4 h-4 mr-2" /> Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="rounded-lg font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <SettingsIcon className="w-4 h-4 mr-2" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="database"  className="rounded-lg font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Database className="w-4 h-4 mr-2" /> Database
          </TabsTrigger>
          <TabsTrigger value="generator" className="rounded-lg font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Wand2 className="w-4 h-4 mr-2 text-brand-purple" /> AI Generator
          </TabsTrigger>
        </TabsList>

        {/* ── Account tab ─────────────────────────────────────────────── */}
        <TabsContent value="account">
          <AccountTab />
        </TabsContent>

        {/* ── Preferences tab ──────────────────────────────────────────── */}
        <TabsContent value="preferences">
          <PreferencesPanel />
        </TabsContent>

        {/* ── Database tab ─────────────────────────────────────────────── */}
        <TabsContent value="database" className="space-y-4">
          <Card className="border-border shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-secondary/30 border-b border-border">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Question Bank</CardTitle>
                  <CardDescription>All available questions ({questionsData?.total || 0} total)</CardDescription>
                </div>
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions…"
                    className="pl-9 h-10 rounded-full bg-background"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Question</TableHead>
                    <TableHead className="w-[120px]">Difficulty</TableHead>
                    <TableHead className="w-[150px]">Book</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No questions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuestions.map(q => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium max-w-md truncate">{q.text}</TableCell>
                        <TableCell>
                          <Badge variant={q.difficulty === 'easy' ? 'green' : q.difficulty === 'hard' ? 'purple' : 'blue'} className="capitalize">
                            {q.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{q.book || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(q.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI Generator tab ─────────────────────────────────────────── */}
        <TabsContent value="generator">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-4 h-fit border-border shadow-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-brand-purple" /> Generator Settings
                </CardTitle>
                <CardDescription>Configure parameters for AI generation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={genDifficulty} onValueChange={v => setGenDifficulty(v as GenerateQuestionsInputDifficulty)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GenerateQuestionsInputDifficulty.easy}>Easy</SelectItem>
                      <SelectItem value={GenerateQuestionsInputDifficulty.medium}>Medium</SelectItem>
                      <SelectItem value={GenerateQuestionsInputDifficulty.hard}>Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Count (max 10)</Label>
                  <Input
                    type="number"
                    min={1} max={10}
                    value={genCount}
                    onChange={e => setGenCount(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Topic / Bible Book (Optional)</Label>
                  <Input
                    placeholder="e.g. Gospel of John, David, Parables"
                    value={genTopic}
                    onChange={e => setGenTopic(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleGenerate}
                  disabled={generateQuestions.isPending}
                  className="w-full bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 font-bold"
                >
                  {generateQuestions.isPending ? 'Generating…' : 'Generate Questions'}
                </Button>
              </CardFooter>
            </Card>

            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-xl">Preview ({previewQuestions.length})</h3>
                {previewQuestions.length > 0 && (
                  <Button
                    onClick={handleSaveGenerated}
                    disabled={saveGeneratedQuestions.isPending}
                    variant="outline"
                    className="gap-2 border-brand-green text-brand-green hover:bg-brand-green/10"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {saveGeneratedQuestions.isPending ? 'Saving…' : 'Save to Database'}
                  </Button>
                )}
              </div>

              {previewQuestions.length === 0 ? (
                <div className="h-64 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-card/50">
                  <Wand2 className="w-12 h-12 opacity-20 mb-4" />
                  <p>Generated questions will appear here for review before saving.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {previewQuestions.map((q, i) => (
                    <Card key={i} className="border-border shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-bold text-lg">{q.text}</h4>
                          <Badge variant="secondary" className="ml-4 shrink-0">{q.difficulty}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {q.options.map((opt: string, j: number) => (
                            <div
                              key={j}
                              className={`p-3 rounded-lg border text-sm ${opt === q.correctAnswer ? 'bg-brand-green/10 border-brand-green/50 font-bold text-brand-green' : 'bg-secondary/50 border-border text-muted-foreground'}`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="text-sm text-muted-foreground italic bg-secondary/30 p-3 rounded-lg">
                            <span className="font-bold text-foreground">Explanation: </span>{q.explanation}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
