import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
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
      gap: 16,
    },
    message: {
      fontSize: 15,
      color: colors.muted,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
  });
}
