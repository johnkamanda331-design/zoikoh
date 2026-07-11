import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useUser } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';
import { useListAchievements } from '@workspace/api-client-react';

function achievementEmoji(type: string) {
  if (type.includes('streak') || type.includes('fire')) return '🔥';
  if (type.includes('star') || type.includes('perfect')) return '⭐';
  return '🏆';
}

export default function AchievementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const playerName = user?.username ?? user?.firstName ?? 'Guest';
  const styles = makeStyles(colors);

  const { data: achievements, isLoading, isError, refetch } = useListAchievements(
    { playerName },
    { query: { enabled: playerName !== 'Guest', queryKey: ['/api/achievements', playerName] } },
  );

  if (isLoading) return <LoadingScreen message="Loading achievements..." />;
  if (isError) return <ErrorScreen message="Failed to load achievements." onRetry={refetch} />;

  const list = achievements ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.count}>{list.length} earned</Text>
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyText}>Complete challenges to earn your first achievement!</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(a) => a.id.toString()}
          numColumns={2}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 100 }]}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardEmoji}>{achievementEmoji(item.type)}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>
              <Text style={styles.cardDate}>
                {new Date(item.earnedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 28, fontWeight: '700', color: colors.foreground },
    count: {
      fontSize: 14,
      color: colors.muted,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    grid: { paddingHorizontal: 16, paddingTop: 16 },
    row: { gap: 12, marginBottom: 12 },
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 6,
    },
    cardEmoji: { fontSize: 30 },
    cardTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
    cardDesc: { fontSize: 12, color: colors.muted, lineHeight: 17 },
    cardDate: { fontSize: 11, color: colors.muted },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 16,
    },
    emptyEmoji: { fontSize: 56 },
    emptyText: {
      fontSize: 16,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 24,
    },
  });
}
