import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSignUp } from '@clerk/expo';
import { useRouter, Link } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signUp } = useSignUp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: createError } = await signUp.password({
        password,
        emailAddress: email,
        firstName,
        lastName,
      });
      if (createError) {
        setError(createError.message ?? 'Sign up failed.');
        return;
      }
      const { error: codeError } = await signUp.verifications.sendEmailCode();
      if (codeError) {
        setError(codeError.message ?? 'Could not send verification code.');
        return;
      }
      setPendingVerification(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyError) {
        setError(verifyError.message ?? 'Verification failed. Check your code.');
        return;
      }
      if (signUp.status === 'complete') {
        await signUp.finalize({ navigate: () => router.replace('/(tabs)') });
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed. Check your code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors);

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <Text style={s.logo}>ZOIKO</Text>
            <Text style={s.tagline}>Check your email for a verification code</Text>
          </View>
          <View style={s.form}>
            {error ? <Text style={s.error}>{error}</Text> : null}
            <Text style={s.label}>Verification Code</Text>
            <TextInput
              style={s.input}
              value={code}
              onChangeText={setCode}
              placeholder="Enter 6-digit code"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              autoFocus
            />
            <TouchableOpacity style={s.primaryBtn} onPress={handleVerify} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Verify Email</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logo}>ZOIKO</Text>
          <Text style={s.subtitle}>Bible Explorer</Text>
          <Text style={s.tagline}>Create your account</Text>
        </View>

        <View style={s.form}>
          {error ? <Text style={s.error}>{error}</Text> : null}

          <View style={s.row}>
            <View style={s.half}>
              <Text style={s.label}>First Name</Text>
              <TextInput style={s.input} value={firstName} onChangeText={setFirstName} placeholder="Jane" placeholderTextColor={colors.muted} autoCapitalize="words" />
            </View>
            <View style={s.half}>
              <Text style={s.label}>Last Name</Text>
              <TextInput style={s.input} value={lastName} onChangeText={setLastName} placeholder="Doe" placeholderTextColor={colors.muted} autoCapitalize="words" />
            </View>
          </View>

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" />

          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={colors.muted} secureTextEntry />

          <TouchableOpacity style={s.primaryBtn} onPress={handleSignUp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" style={s.link}>Sign in</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 40 },
    logo: { fontSize: 40, fontWeight: '800', color: colors.primary, letterSpacing: 2 },
    subtitle: { fontSize: 16, color: colors.muted, marginTop: 4 },
    tagline: { fontSize: 14, color: colors.muted, marginTop: 24, textAlign: 'center' },
    form: { gap: 8 },
    row: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },
    label: { fontSize: 14, color: colors.muted, marginTop: 8 },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      padding: 14,
      color: colors.foreground,
      fontSize: 16,
    },
    error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: 4 },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      padding: 16,
      alignItems: 'center',
      marginTop: 16,
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
    footerText: { color: colors.muted, fontSize: 14 },
    link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  });
