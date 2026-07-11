import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SOLO_MODES: {
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconName;
}[] = [
  { id: 'daily-challenge', title: 'Daily Challenge', subtitle: '5 questions daily', icon: 'calendar' },
  { id: 'q-and-a', title: 'Q&A Quiz', subtitle: 'Multiple choice', icon: 'help-circle' },
  { id: 'flashcards', title: 'Flashcards', subtitle: 'Study & review', icon: 'layers' },
  { id: 'true-false', title: 'True or False', subtitle: 'True or false', icon: 'git-merge' },
  { id: 'speed-round', title: 'Speed Round', subtitle: '30 second blitz', icon: 'flash' },
  { id: 'word-scramble', title: 'Word Scramble', subtitle: 'Unscramble', icon: 'shuffle' },
];

export default function PlayScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Play</Text>

      {/* Solo section */}
      <Text style={styles.sectionHeader}>SOLO</Text>
      <View style={styles.grid}>
        {SOLO_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={styles.modeCard}
            onPress={() => router.push(`/solo/${mode.id}`)}
            activeOpacity={0.8}
          >
            <Ionicons name={mode.icon} size={28} color={colors.primary} />
            <Text style={styles.modeTitle}>{mode.title}</Text>
            <Text style={styles.modeSub}>{mode.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Group play section */}
      <View style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <Ionicons name="people" size={28} color="#F1F0FB" />
          <Text style={styles.groupTitle}>Group & Camp Play</Text>
        </View>
        <Text style={styles.groupDesc}>
          Join your leader's session with a PIN. Perfect for Sunday school, youth groups & camps.
        </Text>
        <TouchableOpacity
          style={styles.pinButton}
          onPress={() => router.push('/join')}
          activeOpacity={0.85}
        >
          <Text style={styles.pinButtonText}>Enter PIN →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20 },
    pageTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 20,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.muted,
      letterSpacing: 1.2,
      marginBottom: 12,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    modeCard: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 8,
    },
    modeTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.foreground,
    },
    modeSub: {
      fontSize: 12,
      color: colors.muted,
    },
    groupCard: {
      backgroundColor: colors.surface2,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.primary,
      padding: 20,
      gap: 12,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    groupTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
    },
    groupDesc: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
    },
    pinButton: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      padding: 14,
      alignItems: 'center',
    },
    pinButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryForeground,
    },
  });
}
