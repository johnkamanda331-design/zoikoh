import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AnswerButton } from '@/components/AnswerButton';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';
import {
  useGetDailyChallenge,
  useListQuestions,
  type Question,
} from '@workspace/api-client-react';

type AnswerState = 'default' | 'correct' | 'wrong' | 'disabled';

const MODE_TITLES: Record<string, string> = {
  'daily-challenge': 'Daily Challenge',
  'q-and-a': 'Q&A Quiz',
  flashcards: 'Flashcards',
  'true-false': 'True or False',
  'speed-round': 'Speed Round',
  'word-scramble': 'Word Scramble',
};

function formatMode(mode: string) {
  return MODE_TITLES[mode] ?? mode.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function shuffleLetters(word: string) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr.join('');
}

function longestWord(sentence: string) {
  const words = sentence.split(/\s+/);
  return words.reduce((a, b) => (b.length > a.length ? b : a), '');
}

// ─── Q&A / Daily Challenge ───────────────────────────────────────────────────
function QAGame({ questions }: { questions: Question[] }) {
  const colors = useColors();
  const router = useRouter();
  const styles = makeStyles(colors);

  const [index, setIndex] = useState(0);
  const [answerStates, setAnswerStates] = useState<AnswerState[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];

  useEffect(() => {
    if (q) setAnswerStates(q.options.map(() => 'default'));
    setSubmitted(false);
  }, [index]);

  const handleAnswer = useCallback(
    (opt: string, i: number) => {
      if (submitted || !q) return;
      setSubmitted(true);
      const isCorrect = opt === q.correctAnswer;
      if (isCorrect) setCorrect((c) => c + 1);
      setAnswerStates(
        q.options.map((o, j) => {
          if (o === q.correctAnswer) return 'correct';
          if (j === i && !isCorrect) return 'wrong';
          return 'disabled';
        }),
      );
      setTimeout(() => {
        if (index + 1 >= questions.length) setDone(true);
        else setIndex((n) => n + 1);
      }, 1500);
    },
    [submitted, q, index, questions.length],
  );

  if (done) {
    return (
      <ScoreCard
        correct={correct}
        total={questions.length}
        onPlayAgain={() => { setIndex(0); setCorrect(0); setDone(false); }}
      />
    );
  }
  if (!q) return null;

  const LABELS = ['A', 'B', 'C', 'D'];
  const progress = (index + 1) / questions.length;

  return (
    <View style={styles.gameContainer}>
      <View style={styles.header}>
        <Text style={styles.qCount}>{index + 1} / {questions.length}</Text>
        <Text style={styles.scoreLabel}>✅ {correct}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.questionCard}>
        {q.book ? <Text style={styles.bookTag}>{q.book}</Text> : null}
        <Text style={styles.questionText}>{q.text}</Text>
      </View>
      {submitted && q.explanation ? (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>💡 {q.explanation}</Text>
        </View>
      ) : null}
      <View style={styles.answers}>
        {q.options.map((opt, i) => (
          <AnswerButton
            key={i}
            label={LABELS[i] ?? String(i + 1)}
            text={opt}
            state={answerStates[i] ?? 'default'}
            onPress={() => handleAnswer(opt, i)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Flashcards ──────────────────────────────────────────────────────────────
function FlashcardsGame({ questions }: { questions: Question[] }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const q = questions[index];

  const flip = () => {
    if (!flipped) {
      Animated.timing(flipAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start(() =>
        setFlipped(true),
      );
    }
  };

  const next = (gotIt: boolean) => {
    setFlipped(false);
    flipAnim.setValue(0);
    if (index + 1 >= questions.length) setDone(true);
    else setIndex((n) => n + 1);
  };

  if (done) {
    return <ScoreCard correct={questions.length} total={questions.length} onPlayAgain={() => { setIndex(0); setFlipped(false); flipAnim.setValue(0); setDone(false); }} />;
  }
  if (!q) return null;

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] });

  return (
    <View style={styles.gameContainer}>
      <Text style={styles.qCount}>{index + 1} / {questions.length}</Text>
      <TouchableOpacity onPress={flip} activeOpacity={0.9}>
        {!flipped ? (
          <Animated.View style={[styles.flashCard, { transform: [{ rotateY: frontRotate }] }]}>
            <Text style={styles.flashLabel}>Question — tap to flip</Text>
            <Text style={styles.flashText}>{q.text}</Text>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.flashCard, styles.flashCardBack, { transform: [{ rotateY: backRotate }] }]}>
            <Text style={styles.flashLabel}>Answer</Text>
            <Text style={styles.flashAnswer}>{q.correctAnswer}</Text>
            {q.explanation ? <Text style={styles.flashExplanation}>{q.explanation}</Text> : null}
          </Animated.View>
        )}
      </TouchableOpacity>
      {flipped && (
        <View style={styles.flashButtons}>
          <TouchableOpacity style={styles.reviewBtn} onPress={() => next(false)}>
            <Text style={styles.reviewBtnText}>Review 🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gotItBtn} onPress={() => next(true)}>
            <Text style={styles.gotItBtnText}>Got it ✓</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── True / False ─────────────────────────────────────────────────────────────
function TrueFalseGame({ questions }: { questions: Question[] }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];

  const answer = useCallback(
    (value: boolean) => {
      if (feedback || !q) return;
      const correctIsTrue = q.correctAnswer.toLowerCase() === 'true';
      const isCorrect = value === correctIsTrue;
      if (isCorrect) setCorrect((c) => c + 1);
      setFeedback(isCorrect ? 'correct' : 'wrong');
      setTimeout(() => {
        setFeedback(null);
        if (index + 1 >= questions.length) setDone(true);
        else setIndex((n) => n + 1);
      }, 1200);
    },
    [feedback, q, index, questions.length],
  );

  if (done) return <ScoreCard correct={correct} total={questions.length} onPlayAgain={() => { setIndex(0); setCorrect(0); setDone(false); }} />;
  if (!q) return null;

  return (
    <View style={styles.gameContainer}>
      <Text style={styles.qCount}>{index + 1} / {questions.length}</Text>
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{q.text}</Text>
      </View>
      {feedback ? (
        <View style={[styles.feedbackBox, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackText}>{feedback === 'correct' ? '✅ Correct!' : '❌ Wrong!'}</Text>
        </View>
      ) : null}
      <View style={styles.tfButtons}>
        <TouchableOpacity style={styles.trueBtn} onPress={() => answer(true)} disabled={!!feedback}>
          <Text style={styles.trueBtnText}>TRUE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.falseBtn} onPress={() => answer(false)} disabled={!!feedback}>
          <Text style={styles.falseBtnText}>FALSE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Speed Round ─────────────────────────────────────────────────────────────
function SpeedRound({ questions }: { questions: Question[] }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (timeLeft <= 0) { setDone(true); return; }
    const t = setTimeout(() => setTimeLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, done]);

  const q = questions[index % questions.length];

  const handleAnswer = useCallback(
    (opt: string) => {
      if (!q || done) return;
      if (opt === q.correctAnswer) setCorrect((c) => c + 1);
      setIndex((n) => {
        if (n + 1 >= questions.length) { setDone(true); return n; }
        return n + 1;
      });
    },
    [q, done, questions.length],
  );

  if (done) return <ScoreCard correct={correct} total={Math.min(index, questions.length)} onPlayAgain={() => { setIndex(0); setCorrect(0); setTimeLeft(30); setDone(false); }} />;
  if (!q) return null;

  const LABELS = ['A', 'B', 'C', 'D'];
  const timerPct = (timeLeft / 30) * 100;

  return (
    <View style={styles.gameContainer}>
      <View style={styles.header}>
        <Text style={[styles.timerNum, timeLeft <= 10 && styles.timerDanger]}>{timeLeft}s</Text>
        <Text style={styles.scoreLabel}>✅ {correct}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.timerFill, { width: `${timerPct}%`, backgroundColor: timeLeft <= 10 ? colors.destructive : colors.warning }]} />
      </View>
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{q.text}</Text>
      </View>
      <View style={styles.answers}>
        {q.options.map((opt, i) => (
          <AnswerButton key={i} label={LABELS[i] ?? String(i + 1)} text={opt} state="default" onPress={() => handleAnswer(opt)} />
        ))}
      </View>
    </View>
  );
}

// ─── Word Scramble ────────────────────────────────────────────────────────────
function WordScramble({ questions }: { questions: Question[] }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const target = q ? longestWord(q.correctAnswer) : '';
  const scrambled = useRef('');

  useEffect(() => {
    scrambled.current = shuffleLetters(target);
    setGuess('');
    setFeedback(null);
  }, [index, target]);

  const submit = () => {
    if (!q) return;
    const isCorrect = guess.trim().toLowerCase() === target.toLowerCase();
    if (isCorrect) setCorrect((c) => c + 1);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => {
      setFeedback(null);
      if (index + 1 >= questions.length) setDone(true);
      else setIndex((n) => n + 1);
    }, 1200);
  };

  if (done) return <ScoreCard correct={correct} total={questions.length} onPlayAgain={() => { setIndex(0); setCorrect(0); setDone(false); }} />;
  if (!q) return null;

  return (
    <View style={styles.gameContainer}>
      <Text style={styles.qCount}>{index + 1} / {questions.length}</Text>
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{q.text}</Text>
      </View>
      <View style={styles.scrambleBox}>
        {scrambled.current.split('').map((ch, i) => (
          <View key={i} style={styles.tile}>
            <Text style={styles.tileText}>{ch.toUpperCase()}</Text>
          </View>
        ))}
      </View>
      {feedback ? (
        <View style={[styles.feedbackBox, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <Text style={styles.feedbackText}>{feedback === 'correct' ? '✅ Correct!' : `❌ Answer: ${target}`}</Text>
        </View>
      ) : null}
      <TextInput
        style={styles.scrambleInput}
        value={guess}
        onChangeText={setGuess}
        placeholder="Type your answer..."
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={!!feedback || !guess.trim()}>
        <Text style={styles.submitBtnText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Score Card ───────────────────────────────────────────────────────────────
function ScoreCard({ correct, total, onPlayAgain }: { correct: number; total: number; onPlayAgain: () => void }) {
  const colors = useColors();
  const router = useRouter();
  const styles = makeStyles(colors);
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <View style={styles.scoreCard}>
      <Text style={styles.scoreEmoji}>{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📖'}</Text>
      <Text style={styles.scoreBig}>{correct}/{total}</Text>
      <Text style={styles.scorePct}>{pct}% correct</Text>
      <TouchableOpacity style={styles.playAgainBtn} onPress={onPlayAgain} activeOpacity={0.85}>
        <Text style={styles.playAgainText}>Play Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
        <Text style={styles.homeBtnText}>Home</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function SoloGameScreen() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = makeStyles(colors);

  useEffect(() => {
    navigation.setOptions({ title: formatMode(mode ?? '') });
  }, [mode]);

  const isDailyChallenge = mode === 'daily-challenge';

  const dailyResult = useGetDailyChallenge({ query: { enabled: isDailyChallenge, queryKey: ['/api/daily/challenge'] } });
  const listResult = useListQuestions({ limit: 10 }, { query: { enabled: !isDailyChallenge, queryKey: ['/api/questions', { limit: 10 }] } });

  const result = isDailyChallenge ? dailyResult : listResult;
  const rawData = isDailyChallenge ? dailyResult.data : listResult.data;
  const questions: Question[] = Array.isArray(rawData) ? rawData : (rawData as { questions?: Question[] })?.questions ?? [];

  if (result.isLoading) return <LoadingScreen message="Loading questions..." />;
  if (result.isError) return <ErrorScreen message="Failed to load questions." onRetry={result.refetch} />;
  if (!questions.length) return <ErrorScreen message="No questions available." />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {mode === 'flashcards' ? (
        <FlashcardsGame questions={questions} />
      ) : mode === 'true-false' ? (
        <TrueFalseGame questions={questions} />
      ) : mode === 'speed-round' ? (
        <SpeedRound questions={questions} />
      ) : mode === 'word-scramble' ? (
        <WordScramble questions={questions} />
      ) : (
        <QAGame questions={questions} />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    gameContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    qCount: { fontSize: 14, fontWeight: '700', color: colors.muted, marginBottom: 12 },
    scoreLabel: { fontSize: 14, fontWeight: '700', color: colors.primary },
    progressTrack: { height: 4, backgroundColor: colors.surface2, borderRadius: 2, marginBottom: 16 },
    progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
    timerFill: { height: 4, borderRadius: 2 },
    timerNum: { fontSize: 22, fontWeight: '700', color: colors.warning },
    timerDanger: { color: colors.destructive },
    questionCard: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 16,
    },
    bookTag: { fontSize: 12, color: colors.primary, fontWeight: '700', marginBottom: 6 },
    questionText: { fontSize: 18, fontWeight: '600', color: colors.foreground, lineHeight: 26 },
    explanationBox: {
      backgroundColor: colors.surface2,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 12,
    },
    explanationText: { fontSize: 14, color: colors.muted, lineHeight: 20 },
    answers: { flex: 1 },
    // Flashcard
    flashCard: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 28,
      minHeight: 200,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    flashCardBack: { borderColor: colors.primary },
    flashLabel: { fontSize: 12, color: colors.muted, marginBottom: 12, textAlign: 'center' },
    flashText: { fontSize: 18, fontWeight: '600', color: colors.foreground, textAlign: 'center', lineHeight: 26 },
    flashAnswer: { fontSize: 20, fontWeight: '700', color: colors.primary, textAlign: 'center' },
    flashExplanation: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 10, lineHeight: 20 },
    flashButtons: { flexDirection: 'row', gap: 12 },
    reviewBtn: { flex: 1, backgroundColor: colors.surface2, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border, padding: 14, alignItems: 'center' },
    reviewBtnText: { fontSize: 15, fontWeight: '600', color: colors.foreground },
    gotItBtn: { flex: 1, backgroundColor: colors.success, borderRadius: colors.radius, padding: 14, alignItems: 'center' },
    gotItBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    // True/False
    tfButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
    trueBtn: { flex: 1, backgroundColor: colors.success, borderRadius: colors.radius, padding: 24, alignItems: 'center' },
    trueBtnText: { fontSize: 20, fontWeight: '800', color: '#fff' },
    falseBtn: { flex: 1, backgroundColor: colors.destructive, borderRadius: colors.radius, padding: 24, alignItems: 'center' },
    falseBtnText: { fontSize: 20, fontWeight: '800', color: '#fff' },
    feedbackBox: { borderRadius: colors.radius, padding: 12, marginBottom: 12, alignItems: 'center' },
    feedbackCorrect: { backgroundColor: colors.successBg },
    feedbackWrong: { backgroundColor: '#450a0a' },
    feedbackText: { fontSize: 16, fontWeight: '700', color: colors.foreground },
    // Word Scramble
    scrambleBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
    tile: {
      width: 40, height: 44, borderRadius: 8,
      backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    tileText: { fontSize: 18, fontWeight: '700', color: colors.primary },
    scrambleInput: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      fontSize: 16,
      color: colors.foreground,
      marginBottom: 12,
    },
    submitBtn: { backgroundColor: colors.primary, borderRadius: colors.radius, padding: 14, alignItems: 'center' },
    submitBtnText: { fontSize: 16, fontWeight: '700', color: colors.primaryForeground },
    // Score Card
    scoreCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
    scoreEmoji: { fontSize: 64 },
    scoreBig: { fontSize: 48, fontWeight: '800', color: colors.foreground },
    scorePct: { fontSize: 20, color: colors.muted },
    playAgainBtn: { width: '100%', backgroundColor: colors.primary, borderRadius: colors.radius, padding: 16, alignItems: 'center' },
    playAgainText: { fontSize: 17, fontWeight: '700', color: colors.primaryForeground },
    homeBtn: { width: '100%', backgroundColor: colors.surface, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border, padding: 16, alignItems: 'center' },
    homeBtnText: { fontSize: 17, fontWeight: '600', color: colors.foreground },
  });
}
