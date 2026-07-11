import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface AnswerButtonProps {
  label: string;
  text: string;
  state: 'default' | 'correct' | 'wrong' | 'disabled';
  onPress: () => void;
}

export function AnswerButton({ label, text, state, onPress }: AnswerButtonProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  const isDisabled = state === 'disabled' || state === 'correct' || state === 'wrong';

  const containerStyle = [
    styles.button,
    state === 'correct' && styles.correct,
    state === 'wrong' && styles.wrong,
    state === 'disabled' && styles.disabled,
  ];

  const labelStyle = [
    styles.labelBadge,
    state === 'correct' && styles.labelCorrect,
    state === 'wrong' && styles.labelWrong,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      <View style={labelStyle}>
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <Text style={styles.text} numberOfLines={3}>{text}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 12,
      marginBottom: 10,
    },
    correct: {
      backgroundColor: colors.successBg,
      borderColor: colors.success,
    },
    wrong: {
      backgroundColor: '#450a0a',
      borderColor: colors.destructive,
    },
    disabled: {
      opacity: 0.5,
    },
    labelBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    labelCorrect: {
      backgroundColor: colors.success,
    },
    labelWrong: {
      backgroundColor: colors.destructive,
    },
    labelText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.foreground,
    },
    text: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      lineHeight: 21,
    },
  });
}
