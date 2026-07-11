import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface VerseCardProps {
  reference: string;
  text: string;
  label?: string;
  onPress?: () => void;
}

export function VerseCard({ reference, text, label, onPress }: VerseCardProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const content = (
    <View style={styles.card}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Text style={styles.reference}>{reference}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    reference: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 8,
    },
    text: {
      fontSize: 16,
      color: colors.foreground,
      lineHeight: 24,
      fontStyle: 'italic',
    },
  });
}
