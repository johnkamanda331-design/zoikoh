import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { PinInput } from '@/components/PinInput';
import { useJoinSession } from '@workspace/api-client-react';

export default function JoinScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const styles = makeStyles(colors);

  const [pin, setPin] = useState('');
  const [playerName, setPlayerName] = useState(
    user?.username ?? user?.firstName ?? '',
  );
  const [error, setError] = useState<string | null>(null);

  const { mutate: joinSession, isPending } = useJoinSession({
    mutation: {
      onSuccess: (data) => {
        router.replace(`/session/${data.id}`);
      },
      onError: (err: unknown) => {
        const msg =
          err && typeof err === 'object' && 'error' in err
            ? String((err as { error: string }).error)
            : 'Failed to join session. Check your PIN.';
        setError(msg);
      },
    },
  });

  const handleJoin = () => {
    setError(null);
    if (pin.length < 4) {
      setError('Please enter the full PIN.');
      return;
    }
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    joinSession({ data: { pin, playerName: playerName.trim() } });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.inner, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.title}>Join a Session</Text>
        <Text style={styles.subtitle}>
          Ask your leader for the PIN code and enter it below.
        </Text>

        <Text style={styles.label}>Session PIN</Text>
        <PinInput value={pin} onChange={setPin} length={6} />

        <Text style={[styles.label, { marginTop: 24 }]}>Your Name</Text>
        <TextInput
          style={styles.input}
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Enter your name"
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
          returnKeyType="done"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (isPending || pin.length < 4) && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={isPending || pin.length < 4}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {isPending ? 'Joining...' : 'Join Session'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    inner: { flex: 1, padding: 20, justifyContent: 'center' },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: colors.muted,
      textAlign: 'center',
      marginBottom: 36,
      lineHeight: 22,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      fontSize: 16,
      color: colors.foreground,
    },
    error: {
      marginTop: 12,
      fontSize: 14,
      color: colors.destructive,
      textAlign: 'center',
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.primaryForeground,
    },
  });
}
