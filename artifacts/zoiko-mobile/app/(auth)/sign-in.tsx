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
import { useSignIn, useOAuth } from '@clerk/expo';
import { useRouter, Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useColors } from '@/hooks/useColors';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: passwordError } = await signIn.password({
        password,
        identifier: email,
      });
      if (passwordError) {
        setError(passwordError.message ?? 'Sign in failed. Check your credentials.');
        return;
      }
      if (signIn.status === 'complete') {
        await signIn.finalize({ navigate: () => router.replace('/(tabs)') });
      } else {
        setError('Additional verification is required for this account.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive: setActiveOAuth } = await startGoogleOAuth();
      if (createdSessionId && setActiveOAuth) {
        await setActiveOAuth({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed.';
      setError(msg);
    }
  };

  const s = styles(colors);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logo}>ZOIKO</Text>
          <Text style={s.subtitle}>Bible Explorer</Text>
          <Text style={s.tagline}>Sign in to continue</Text>
        </View>

        <View style={s.form}>
          {error ? <Text style={s.error}>{error}</Text> : null}

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity style={s.primaryBtn} onPress={handleSignIn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.secondaryBtn} onPress={handleGoogleSignIn}>
            <Text style={s.secondaryBtnText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/sign-up" style={s.link}>Sign up</Link>
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
    tagline: { fontSize: 14, color: colors.muted, marginTop: 24 },
    form: { gap: 8 },
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
    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.muted, fontSize: 13 },
    secondaryBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      padding: 16,
      alignItems: 'center',
    },
    secondaryBtnText: { color: colors.foreground, fontSize: 16, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
    footerText: { color: colors.muted, fontSize: 14 },
    link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  });
