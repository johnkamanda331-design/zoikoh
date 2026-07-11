import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'ZOIKO',
  slug: 'zoiko-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'zoiko',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  splash: { image: './assets/images/icon.png', resizeMode: 'contain', backgroundColor: '#0D0B1E' },
  ios: { supportsTablet: false, bundleIdentifier: 'com.zoiko.mobile' },
  android: { package: 'com.zoiko.mobile', adaptiveIcon: { foregroundImage: './assets/images/icon.png', backgroundColor: '#0D0B1E' } },
  plugins: [
    ['expo-router', { origin: 'https://replit.com/' }],
    'expo-font', 'expo-web-browser', 'expo-secure-store',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY },
};
export default config;
