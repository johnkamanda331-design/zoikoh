import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useClerk, useUser } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { StatCard } from '@/components/StatCard';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useGetPlayer } from '@workspace/api-client-react';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useClerk();
  const styles = makeStyles(colors);

  const playerName = user?.username ?? user?.firstName ?? 'Guest';
  const initials = playerName.slice(0, 2).toUpperCase();

  const { data: player, isLoading } = useGetPlayer(playerName, {
    query: { enabled: playerName !== 'Guest', queryKey: [`/api/players/${playerName}`] },
  });

  if (isLoading) return <LoadingScreen message="Loading profile..." />;

  const accuracy =
    player && player.totalAnswers > 0
      ? Math.round((player.correctAnswers / player.totalAnswers) * 100)
      : 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        {user?.imageUrl ? (
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <Text style={styles.name}>
          {user?.fullName ?? user?.firstName ?? playerName}
        </Text>
        <Text style={styles.username}>@{playerName}</Text>
      </View>

      {/* Stats */}
      {player ? (
        <>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.grid}>
            <StatCard value={player.correctAnswers} label="Correct Answers" icon="✅" />
            <StatCard value={player.totalAnswers} label="Total Answers" icon="❓" />
          </View>
          <View style={styles.grid}>
            <StatCard value={`${accuracy}%`} label="Accuracy" icon="🎯" />
            <StatCard value={player.sessionsPlayed} label="Sessions Played" icon="🎮" />
          </View>
          <View style={styles.grid}>
            <StatCard value={player.sessionsWon} label="Sessions Won" icon="🏆" />
            <StatCard value={player.streakCurrent} label="Current Streak" icon="🔥" />
          </View>
          <View style={styles.gridSingle}>
            <StatCard value={player.streakLongest} label="Longest Streak" icon="⭐" />
          </View>
        </>
      ) : (
        <View style={styles.noStats}>
          <Text style={styles.noStatsText}>Play some games to see your stats here!</Text>
        </View>
      )}

      {/* Sign out */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={() => signOut()}
        activeOpacity={0.8}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20 },
    avatarSection: { alignItems: 'center', marginBottom: 28 },
    avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
    avatarFallback: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    initials: { fontSize: 32, fontWeight: '700', color: colors.primaryForeground },
    name: { fontSize: 22, fontWeight: '700', color: colors.foreground, marginBottom: 4 },
    username: { fontSize: 14, color: colors.muted },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 12,
    },
    grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    gridSingle: { flexDirection: 'row', marginBottom: 12 },
    noStats: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      alignItems: 'center',
      marginBottom: 20,
    },
    noStatsText: { fontSize: 15, color: colors.muted, textAlign: 'center' },
    signOutBtn: {
      backgroundColor: colors.destructive,
      borderRadius: colors.radius,
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    signOutText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  });
}
