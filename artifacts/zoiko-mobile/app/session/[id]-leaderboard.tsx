import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { PlayerBadge } from '@/components/PlayerBadge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';
import { useGetSessionLeaderboard } from '@workspace/api-client-react';

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const playerName = user?.username ?? user?.firstName ?? 'Player';
  const styles = makeStyles(colors);

  const { data: leaderboard, isLoading, isError, refetch } = useGetSessionLeaderboard(id);

  if (isLoading) return <LoadingScreen message="Loading results..." />;
  if (isError) return <ErrorScreen message="Failed to load leaderboard." onRetry={refetch} />;

  const entries = leaderboard ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>🏆 Final Results</Text>

      {/* Podium for top 3 */}
      {top3.length > 0 && (
        <View style={styles.podium}>
          {top3.map((entry) => (
            <View key={entry.playerName} style={styles.podiumItem}>
              <Text style={styles.podiumMedal}>
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
              </Text>
              <Text
                style={[
                  styles.podiumName,
                  entry.playerName === playerName && styles.podiumNameSelf,
                ]}
                numberOfLines={1}
              >
                {entry.playerName === playerName ? 'You' : entry.playerName}
              </Text>
              <Text style={styles.podiumScore}>{entry.score} pts</Text>
            </View>
          ))}
        </View>
      )}

      {/* Full list */}
      <FlatList
        data={rest}
        keyExtractor={(e) => e.playerName}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <PlayerBadge
            name={item.playerName}
            rank={item.rank}
            score={item.score}
            isCurrentPlayer={item.playerName === playerName}
          />
        )}
        ListFooterComponent={
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.playAgain}
              onPress={() => router.push('/play')}
              activeOpacity={0.85}
            >
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={styles.homeBtnText}>Home</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.foreground,
      textAlign: 'center',
      paddingVertical: 20,
    },
    podium: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 16,
    },
    podiumItem: { alignItems: 'center', flex: 1 },
    podiumMedal: { fontSize: 32, marginBottom: 4 },
    podiumName: { fontSize: 13, fontWeight: '600', color: colors.foreground, textAlign: 'center' },
    podiumNameSelf: { color: colors.primary },
    podiumScore: { fontSize: 13, color: colors.gold, fontWeight: '700', marginTop: 2 },
    list: { paddingTop: 8 },
    actions: { marginTop: 24, gap: 12 },
    playAgain: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      padding: 16,
      alignItems: 'center',
    },
    playAgainText: { fontSize: 16, fontWeight: '700', color: colors.primaryForeground },
    homeBtn: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      alignItems: 'center',
    },
    homeBtnText: { fontSize: 16, fontWeight: '600', color: colors.foreground },
  });
}
