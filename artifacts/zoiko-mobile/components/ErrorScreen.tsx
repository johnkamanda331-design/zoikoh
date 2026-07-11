import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorScreen({ message = 'Something went wrong.', onRetry }: ErrorScreenProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: 20,
      gap: 16,
    },
    message: {
      fontSize: 16,
      color: colors.muted,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
