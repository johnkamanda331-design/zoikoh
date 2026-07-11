import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AnswerButton } from '@/components/AnswerButton';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';
import {
  useGetSession,
  useSubmitAnswer,
  type Question,
} from '@workspace/api-client-react';

type AnswerState = 'default' | 'correct' | 'wrong' | 'disabled';

export default function SessionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const playerName = user?.username ?? user?.firstName ?? 'Player';
  const styles = makeStyles(colors);

  const [answerStates, setAnswerStates] = useState<AnswerState[]>(['default', 'default', 'default', 'default']);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const timerAnim = useRef(new Animated.Value(1)).current;

  const { data: session, isLoading, isError, refetch } = useGetSession(id, {
    query: { refetchInterval: 2000, queryKey: [`/api/sessions/${id}`] },
  });

  const { mutate: submitAnswer } = useSubmitAnswer({
    mutation: {
      onSuccess: (result) => {
        setScore((s) => s + (result.score ?? 0));
      },
    },
  });

  const currentQuestion: Question | undefined =
    session?.questions?.[session.currentQuestionIndex];

  // Reset answer state when question changes
  useEffect(() => {
    setAnswerStates(['default', 'default', 'default', 'default']);
    setSubmitted(false);
    // Timer animation
    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: 20000,
      useNativeDriver: false,
    }).start();
  }, [session?.currentQuestionIndex]);

  // Navigate to leaderboard when session completes
  useEffect(() => {
    if (session?.status === 'completed') {
      router.replace(`/session/${id}-leaderboard`);
    }
  }, [session?.status]);

  const handleAnswer = (option: string, index: number) => {
    if (submitted || !currentQuestion) return;
    setSubmitted(true);

    const isCorrect = option === currentQuestion.correctAnswer;
    const newStates: AnswerState[] = currentQuestion.options.map((opt, i) => {
      if (opt === currentQuestion.correctAnswer) return 'correct';
      if (i === index && !isCorrect) return 'wrong';
      return 'disabled';
    });
    setAnswerStates(newStates);

    submitAnswer({
      id,
      data: {
        questionId: currentQuestion.id,
        answer: option,
      },
    });
  };

  if (isLoading) return <LoadingScreen message="Connecting to session..." />;
  if (isError) return <ErrorScreen message="Failed to load session." onRetry={refetch} />;
  if (!session) return <LoadingScreen />;

  const LABELS = ['A', 'B', 'C', 'D'];

  // Waiting state
  if (session.status === 'waiting') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.waiting}>
          <Text style={styles.waitEmoji}>⏳</Text>
          <Text style={styles.waitTitle}>Waiting for host to start...</Text>
          <Text style={styles.waitSub}>Get ready! The game will begin soon.</Text>

          {session.participants.length > 0 && (
            <View style={styles.participantsBox}>
              <Text style={styles.participantsLabel}>
                {session.participants.length} player{session.participants.length !== 1 ? 's' : ''} joined
              </Text>
              {session.participants.map((p) => (
                <Text key={p} style={styles.participantName}>
                  {p === playerName ? `${p} (you)` : p}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  // Active state
  if (session.status === 'active' && currentQuestion) {
    const total = session.questions?.length ?? session.totalQuestions ?? 1;
    const progress = (session.currentQuestionIndex + 1) / total;

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.sessionHeader}>
          <Text style={styles.questionCount}>
            {session.currentQuestionIndex + 1} / {total}
          </Text>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Timer */}
        <View style={styles.timerTrack}>
          <Animated.View
            style={[
              styles.timerFill,
              { width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          {currentQuestion.book ? (
            <Text style={styles.questionBook}>{currentQuestion.book}</Text>
          ) : null}
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
        </View>

        {/* Answers */}
        <View style={styles.answers}>
          {currentQuestion.options.map((opt, i) => (
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

  return <LoadingScreen message="Loading question..." />;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
    waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    waitEmoji: { fontSize: 56 },
    waitTitle: { fontSize: 22, fontWeight: '700', color: colors.foreground, textAlign: 'center' },
    waitSub: { fontSize: 15, color: colors.muted, textAlign: 'center' },
    participantsBox: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      width: '100%',
      gap: 6,
      marginTop: 8,
    },
    participantsLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 4 },
    participantName: { fontSize: 15, color: colors.foreground },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    questionCount: { fontSize: 14, fontWeight: '700', color: colors.muted },
    scoreText: { fontSize: 14, fontWeight: '700', color: colors.primary },
    progressTrack: {
      height: 4,
      backgroundColor: colors.surface2,
      borderRadius: 2,
      marginBottom: 4,
    },
    progressFill: {
      height: 4,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    timerTrack: {
      height: 3,
      backgroundColor: colors.surface2,
      borderRadius: 2,
      marginBottom: 16,
    },
    timerFill: {
      height: 3,
      backgroundColor: colors.warning,
      borderRadius: 2,
    },
    questionCard: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 16,
    },
    questionBook: { fontSize: 12, color: colors.primary, fontWeight: '700', marginBottom: 6 },
    questionText: { fontSize: 18, fontWeight: '600', color: colors.foreground, lineHeight: 26 },
    answers: { flex: 1 },
  });
}
