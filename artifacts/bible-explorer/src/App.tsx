import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { shadcn } from '@clerk/themes';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout';
import { BiblePanel } from '@/components/bible-panel';
import { OnboardingTutorial } from '@/components/onboarding-tutorial';
import { hydratePlayerFromServer } from '@/hooks/use-achievements';
import { setBaseUrl } from '@workspace/api-client-react';
import { loadPreferences, savePreferences } from '@/lib/preferences';

import { Home } from '@/pages/home';
import { SoloHub } from '@/pages/solo-hub';
import { HostWizard } from '@/pages/host-wizard';
import { JoinLobby } from '@/pages/join-lobby';
import { LiveSession } from '@/pages/live-session';
import { LiveLeaderboard } from '@/pages/live-leaderboard';
import { SessionSummary } from '@/pages/session-summary';
import { AchievementsGallery } from '@/pages/achievements-gallery';
import { SettingsPage } from '@/pages/settings-page';
import { DuelHub } from '@/pages/duel';
import { DuelSession } from '@/pages/duel-session';
import AnalyticsPage from '@/pages/analytics';

function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <h1 className="text-6xl font-heading font-extrabold text-muted mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = (
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  'pk_test_1234567890'
).trim();
const clerkProxyUrl = (
  import.meta.env.VITE_CLERK_PROXY_URL ||
  import.meta.env.CLERK_PROXY_URL ||
  import.meta.env.NEXT_PUBLIC_CLERK_PROXY_URL ||
  ''
).trim() || undefined;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#6C3AED',
    colorForeground: '#F1F0FB',
    colorMutedForeground: '#9CA3B8',
    colorDanger: '#EF4444',
    colorBackground: '#151426',
    colorInput: '#1E1B34',
    colorInputForeground: '#F1F0FB',
    colorNeutral: '#332F52',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: '0.9rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#151426] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#332F52]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-heading text-[#F1F0FB]',
    headerSubtitle: 'text-[#9CA3B8]',
    socialButtonsBlockButtonText: 'text-[#F1F0FB]',
    formFieldLabel: 'text-[#F1F0FB]',
    footerActionLink: 'text-[#6C3AED] font-semibold',
    footerActionText: 'text-[#9CA3B8]',
    dividerText: 'text-[#9CA3B8]',
    identityPreviewEditButton: 'text-[#6C3AED]',
    formFieldSuccessText: 'text-[#10B981]',
    alertText: 'text-[#F1F0FB]',
    logoBox: 'flex justify-center py-2',
    logoImage: 'h-8',
    socialButtonsBlockButton: 'border border-[#332F52] bg-[#1E1B34] hover:bg-[#251f42]',
    formButtonPrimary: 'bg-gradient-to-br from-[#6C3AED] to-[#2563EB] hover:opacity-90',
    formFieldInput: 'bg-[#1E1B34] border border-[#332F52] text-[#F1F0FB]',
    footerAction: 'text-[#9CA3B8]',
    dividerLine: 'bg-[#332F52]',
    alert: 'bg-[#1E1B34] border border-[#332F52]',
    otpCodeFieldInput: 'bg-[#1E1B34] border border-[#332F52] text-[#F1F0FB]',
    formFieldRow: 'text-[#F1F0FB]',
    main: 'gap-4',
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-3 py-6 sm:px-4">
      <div className="w-full max-w-[440px]">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} forceRedirectUrl={`${basePath}/`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-3 py-6 sm:px-4">
      <div className="w-full max-w-[440px]">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} forceRedirectUrl={`${basePath}/`} />
      </div>
    </div>
  );
}

// Keeps cached queries (player stats, sessions) from leaking across accounts.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/solo" component={SoloHub} />
        <Route path="/start" component={HostWizard} />
        <Route path="/join" component={JoinLobby} />
        <Route path="/duel" component={DuelHub} />
        <Route path="/duel/:id" component={DuelSession} />
        <Route path="/session/:id" component={LiveSession} />
        <Route path="/session/:id/leaderboard" component={LiveLeaderboard} />
        <Route path="/session/:id/summary" component={SessionSummary} />
        <Route path="/achievements" component={AchievementsGallery} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to duel and keep your progress safe',
          },
        },
        signUp: {
          start: {
            title: 'Join ZOIKOH',
            subtitle: 'Create an account to duel and track real stats',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <AppBody />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function AppBody() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    setBaseUrl('');
    hydratePlayerFromServer();

    // Initialize preferences and apply default theme/font settings on first load
    const prefs = loadPreferences();
    savePreferences({});

    if (!prefs.tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  const handleTutorialComplete = () => {
    savePreferences({ tutorialCompleted: true });
    setShowTutorial(false);
  };

  return (
    <TooltipProvider>
      <OnboardingTutorial isOpen={showTutorial} onComplete={handleTutorialComplete} />
      <Router />
      <BiblePanel />
      <Toaster position="top-center" />
    </TooltipProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
