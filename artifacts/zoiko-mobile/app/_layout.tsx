import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider, useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';

SplashScreen.preventAutoHideAsync();

// Set API base URL at module level
setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};

function AuthGuard() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    const inAuth = segments[0] === '(auth)';
    if (!isSignedIn && !inAuth) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && inAuth) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="join"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Join Session',
            headerStyle: { backgroundColor: '#0D0B1E' },
            headerTintColor: '#F1F0FB',
          }}
        />
        <Stack.Screen
          name="session/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="session/[id]-leaderboard"
          options={{
            headerShown: true,
            title: 'Results',
            headerStyle: { backgroundColor: '#0D0B1E' },
            headerTintColor: '#F1F0FB',
          }}
        />
        <Stack.Screen
          name="solo/[mode]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#0D0B1E' },
            headerTintColor: '#F1F0FB',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey as string;

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ClerkProvider publishableKey={publishableKey ?? ''} tokenCache={tokenCache}>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ClerkProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
