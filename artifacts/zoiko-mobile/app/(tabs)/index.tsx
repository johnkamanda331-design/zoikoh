import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { VerseCard } from '@/components/VerseCard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useGetDailyContent, useGetPlayer } from '@workspace/api-client-react';

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const playerName = user?.username ?? user?.firstName ?? 'Guest';

  const { data: dailyContent, isLoading: loadingContent } = useGetDailyContent();
  const { data: player } = useGetPlayer(playerName, {
    query: { enabled: playerName !== 'Guest', queryKey: [`/api/players/${playerName}`] },
  });

  const styles = makeStyles(colors);

  if (loadingContent) return <LoadingScreen message="Loading today's content..." />;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>ZOIKO</Text>
          <Text style={styles.appSubtitle}>Bible Explorer</Text>
        </View>
        <View style={styles.greetingBox}>
          <Text style={styles.greeting}>👋 {playerName}</Text>
        </View>
      </View>

      {/* Stats row */}
      {player ? (
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statText}>🔥 {player.streakCurrent} day streak</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statText}>✅ {player.correctAnswers} correct</Text>
          </View>
        </View>
      ) : null}

      {/* Verse of the Day */}
      {dailyContent ? (
        <>
          <VerseCard
            label="Verse of the Day"
            reference={dailyContent.verseReference}
            text={dailyContent.verse}
          />
          <VerseCard
            label="Memory Verse"
            reference={dailyContent.verseReference}
            text={dailyContent.memoryVerse}
          />
        </>
      ) : null}

      {/* Today's Challenge */}
      <TouchableOpacity
        style={styles.challengeCard}
        onPress={() => router.push('/solo/daily-challenge')}
        activeOpacity={0.85}
      >
        <Text style={styles.challengeEmoji}>📖</Text>
        <View style={styles.challengeText}>
          <Text style={styles.challengeTitle}>Today's Challenge</Text>
          <Text style={styles.challengeSubtitle}>
            {dailyContent?.challenge ?? '5 daily Bible questions'}
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* Join Group Session */}
      <TouchableOpacity
        style={styles.joinCard}
        onPress={() => router.push('/join')}
        activeOpacity={0.85}
      >
        <Text style={styles.joinEmoji}>👥</Text>
        <View style={styles.joinText}>
          <Text style={styles.joinTitle}>Join Group Session</Text>
          <Text style={styles.joinSubtitle}>Enter a PIN to join your leader's game</Text>
        </View>
        <Text style={styles.arrowBlue}>›</Text>
      </TouchableOpacity>

      {/* Quick Play */}
      <TouchableOpacity
        style={styles.quickPlay}
        onPress={() => router.push('/play')}
        activeOpacity={0.85}
      >
        <Text style={styles.quickPlayText}>⚡ Quick Play</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    appTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1,
    },
    appSubtitle: { fontSize: 13, color: colors.muted },
    greetingBox: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    greeting: { fontSize: 13, color: colors.foreground },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    statPill: {
      backgroundColor: colors.surface2,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statText: { fontSize: 13, color: colors.foreground, fontWeight: '600' },
    challengeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
      gap: 12,
    },
    challengeEmoji: { fontSize: 28 },
    challengeText: { flex: 1 },
    challengeTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 2 },
    challengeSubtitle: { fontSize: 13, color: colors.muted },
    arrow: { fontSize: 22, color: colors.primary, fontWeight: '700' },
    joinCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#0f2044',
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: '#1e3a6e',
      padding: 16,
      marginBottom: 12,
      gap: 12,
    },
    joinEmoji: { fontSize: 28 },
    joinText: { flex: 1 },
    joinTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 2 },
    joinSubtitle: { fontSize: 13, color: '#7ab3ef' },
    arrowBlue: { fontSize: 22, color: '#7ab3ef', fontWeight: '700' },
    quickPlay: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      padding: 18,
      alignItems: 'center',
      marginTop: 4,
    },
    quickPlayText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryForeground,
    },
  });
}
