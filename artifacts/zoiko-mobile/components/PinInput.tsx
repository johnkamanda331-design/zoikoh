import React, { useRef } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface PinInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}

export function PinInput({ value, onChange, length = 6 }: PinInputProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const inputRef = useRef<TextInput>(null);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={styles.container}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hidden}
        caretHidden
      />
      <View style={styles.boxes}>
        {digits.map((digit, i) => (
          <View
            key={i}
            style={[
              styles.box,
              value.length === i && styles.boxActive,
              digit !== '' && styles.boxFilled,
            ]}
          >
            <Text style={styles.digit}>{digit}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    hidden: {
      position: 'absolute',
      opacity: 0,
      width: 1,
      height: 1,
    },
    boxes: {
      flexDirection: 'row',
      gap: 10,
    },
    box: {
      width: 48,
      height: 56,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxActive: {
      borderColor: colors.primary,
    },
    boxFilled: {
      borderColor: colors.primaryLight,
    },
    digit: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.foreground,
    },
  });
}
