import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
}

export function StatCard({ value, label, icon }: StatCardProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.card}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      alignItems: 'center',
      flex: 1,
    },
    icon: {
      fontSize: 20,
      marginBottom: 4,
    },
    value: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 2,
    },
    label: {
      fontSize: 12,
      color: colors.muted,
      textAlign: 'center',
    },
  });
}
