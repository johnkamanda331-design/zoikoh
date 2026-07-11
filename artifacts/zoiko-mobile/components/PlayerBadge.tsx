import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface PlayerBadgeProps {
  name: string;
  rank: number;
  score: number;
  isCurrentPlayer?: boolean;
}

export function PlayerBadge({ name, rank, score, isCurrentPlayer }: PlayerBadgeProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <View style={[styles.row, isCurrentPlayer && styles.highlighted]}>
      <View style={styles.rankContainer}>
        {medalEmoji ? (
          <Text style={styles.medal}>{medalEmoji}</Text>
        ) : (
          <Text style={styles.rank}>#{rank}</Text>
        )}
      </View>
      <Text style={[styles.name, isCurrentPlayer && styles.nameHighlighted]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.score}>{score} pts</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 8,
      gap: 12,
    },
    highlighted: {
      borderColor: colors.primary,
      backgroundColor: colors.surface2,
    },
    rankContainer: {
      width: 36,
      alignItems: 'center',
    },
    medal: {
      fontSize: 22,
    },
    rank: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.muted,
    },
    name: {
      flex: 1,
      fontSize: 16,
      fontWeight: '500',
      color: colors.foreground,
    },
    nameHighlighted: {
      color: colors.primaryLight,
      fontWeight: '700',
    },
    score: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.gold,
    },
  });
}
