import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Gamepad2,
  Users,
  Trophy,
  Settings,
  BookOpen,
  Moon,
  Sun,
  Plus,
  Swords,
  LogIn,
  User,
  Sparkles,
} from 'lucide-react';
import { useBiblePanelStore } from '@/hooks/use-bible-panel';
import { useIceBreakersPanelStore } from '@/hooks/use-icebreakers-panel';
import { Button } from '@/components/ui/button';
import { useUser, useClerk } from '@clerk/react';

/* ── Logo ─────────────────────────────────────────────────────────────── */
export function Logo({ size = 'md', className, src }: { size?: 'sm' | 'md' | 'lg'; className?: string; src?: string }) {
  const cls = size === 'sm' ? 'h-6 w-auto' : size === 'lg' ? 'h-12 w-auto' : 'h-8 w-auto';
  const combined = className ? `${className} object-contain max-w-full` : `${cls} object-contain max-w-full`;
  return (
    <img
      src={src ?? '/logo.png'}
      alt="ZOIKOH logo"
      className={combined}
      loading="eager"
    />
  );
}

/* ── Routes where the nav is hidden (active gameplay) ─────────────────── */
function isPlayingRoute(location: string) {
  return /^\/(session|duel)\/[^/]+(\/.*)?$/.test(location);
}

/* ── Play FAB options (Solo has its own bottom-nav icon) ──────────────── */
const PLAY_OPTIONS = [
  { href: '/start', icon: Trophy,  label: 'Host Session', color: 'bg-brand-purple text-white', requiresAuth: true },
  { href: '/join',  icon: Users,  label: 'Join Game',    color: 'bg-brand-blue text-white',   requiresAuth: true },
  { href: '/duel',  icon: Swords, label: '1v1 Duel',     color: 'bg-brand-orange text-white', requiresAuth: true },
];

/* ── Bottom nav items (flanking the FAB) ──────────────────────────────── */
const LEFT_NAV = [
  { href: '/',     icon: Home,     label: 'Home' },
  { href: '/solo', icon: Gamepad2, label: 'Solo' },
];
const RIGHT_NAV = [
  { href: '/achievements', icon: Trophy,   label: 'Trophies' },
  { href: '/settings',     icon: Settings, label: 'Settings' },
];

/* ── User avatar / initials ───────────────────────────────────────────── */
function UserAvatar({ name, imageUrl }: { name: string; imageUrl?: string }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-purple/40"
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-brand-purple/40">
      {initials || <User className="w-3.5 h-3.5" />}
    </div>
  );
}

/* ── Layout ───────────────────────────────────────────────────────────── */
export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [fabOpen, setFabOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const biblePanelStore = useBiblePanelStore();
  const iceBreakersPanelStore = useIceBreakersPanelStore();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const playing = isPlayingRoute(location);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    const isDarkTheme = storedTheme === 'dark' || (storedTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkTheme);

    if (storedTheme === 'dark' || (storedTheme === 'auto' && isDarkTheme)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Keep top-bar theme state in sync when preferences change elsewhere
  useEffect(() => {
    const handler = (event: Event) => {
      try {
        const detail = (event as CustomEvent).detail;
        const theme = detail?.theme ?? localStorage.getItem('theme') ?? 'light';
        const isDarkTheme = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDark(isDarkTheme);
        const html = document.documentElement;
        if (isDarkTheme) html.classList.add('dark'); else html.classList.remove('dark');
      } catch {
        // ignore
      }
    };

    window.addEventListener('zoiko-preferences-changed', handler as EventListener);
    return () => window.removeEventListener('zoiko-preferences-changed', handler as EventListener);
  }, []);

  // Close FAB when route changes
  useEffect(() => {
    setFabOpen(false);
  }, [location]);

  const toggleTheme = () => {
    const html = document.documentElement;
    const nextTheme = isDark ? 'light' : 'dark';

    if (nextTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    localStorage.setItem('theme', nextTheme);
    setIsDark(nextTheme === 'dark');
  };

  const handlePlayOption = (href: string, requiresAuth: boolean) => {
    setFabOpen(false);
    if (requiresAuth && !isSignedIn) {
      setLocation('/sign-in');
    } else {
      setLocation(href);
    }
  };

  const displayName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'You';

  return (
    <div
      className="relative flex flex-col min-h-[100dvh] w-full bg-background overflow-x-hidden selection:bg-brand-purple selection:text-white"
      style={{
        backgroundImage: isDark
          ? "linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.05)), url('/logo.png')"
          : "linear-gradient(rgba(0,0,0,0.04), rgba(0,0,0,0.04)), url('/dark_logo.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: '70%',
        backgroundAttachment: 'fixed',
        backgroundBlendMode: 'normal',
      }}
    >

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-20 sm:h-20 md:h-24 px-3 sm:px-4 border-b border-border bg-card/80 backdrop-blur-md shrink-0">
        {/* Logo → navigates home on click */}
        <Link href="/" className="cursor-pointer">
          <div className="flex items-center justify-center h-14 sm:h-16 md:h-18 lg:h-20 xl:h-24 w-full">
            <Logo
              src={isDark ? '/dark_web_logo.png' : '/web_logo.png'}
              className="max-h-full w-auto object-contain"
            />
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {/* Bible reader */}
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-brand-purple"
            onClick={() => biblePanelStore.open()}
            title="Open Bible"
          >
            <BookOpen className="w-5 h-5" />
          </Button>

          {/* Ice-breakers */}
          <Button
            id="icebreakers-button"
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={() => iceBreakersPanelStore.open()}
            title="Open Ice-Breakers"
          >
            <Sparkles className="w-4 h-4 text-brand-purple" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {isDark
              ? <Sun className="w-4 h-4 text-muted-foreground" />
              : <Moon className="w-4 h-4 text-muted-foreground" />}
          </Button>

          {/* Sign-in / user avatar */}
          {isSignedIn ? (
            <button
              onClick={() => setLocation('/settings')}
              className="flex items-center gap-1.5 h-9 px-2 rounded-lg hover:bg-secondary/60 transition-colors"
              title={`Signed in as ${displayName}`}
            >
              <UserAvatar
                name={displayName}
                imageUrl={user?.imageUrl}
              />
              <span className="text-xs font-medium text-foreground hidden sm:block max-w-[80px] truncate">
                {displayName}
              </span>
            </button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-brand-purple hover:text-brand-purple hover:bg-brand-purple/10 font-semibold text-xs px-3"
              onClick={() => setLocation('/sign-in')}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in
            </Button>
          )}
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────────── */}
      <main className={`flex-1 overflow-y-auto hide-scrollbar ${!playing ? 'pb-[calc(104px+env(safe-area-inset-bottom))]' : ''}`}>
        {children}
      </main>

      {/* ── Bottom nav (hidden during active gameplay) ────────────────── */}
      <AnimatePresence>
        {!playing && (
          <motion.nav
            role="navigation"
            aria-label="Bottom app navigation"
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 z-40 w-full px-0 pb-[env(safe-area-inset-bottom)] supports-[backdrop-filter]:bg-transparent"
          >
            {/* FAB overlay backdrop */}
            <AnimatePresence>
              {fabOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setFabOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* FAB play options */}
            <AnimatePresence>
              {fabOpen && (
                <div className="absolute bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
                  {PLAY_OPTIONS.map((opt, i) => (
                    <motion.div
                      key={opt.href}
                      initial={{ opacity: 0, y: 20, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.9 }}
                      transition={{ delay: i * 0.06, type: 'spring', damping: 22, stiffness: 280 }}
                    >
                      <button
                        onClick={() => handlePlayOption(opt.href, opt.requiresAuth)}
                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl cursor-pointer ${opt.color} font-semibold text-sm whitespace-nowrap`}
                      >
                        <opt.icon className="w-4 h-4 shrink-0" />
                        {opt.label}
                        {opt.requiresAuth && !isSignedIn && (
                          <LogIn className="w-3 h-3 opacity-70" />
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Nav bar */}
            <div className="relative flex items-center justify-between h-[78px] w-full max-w-full bg-card/95 backdrop-blur-xl border-t border-border px-3 md:px-5 shadow-[0_-4px_24px_rgba(0,0,0,0.14)]">
              {/* Left items */}
              {LEFT_NAV.map(item => {
                const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    className={`relative flex flex-col items-center justify-center gap-1 min-w-[72px] flex-1 h-full px-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="bottom-nav-active"
                        className="absolute w-8 h-0.5 bg-primary rounded-full top-0"
                        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                      />
                    )}
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Centre FAB */}
              <div className="flex items-center justify-center w-20">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setFabOpen(v => !v)}
                  className="relative -top-5 w-14 h-14 rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-white shadow-lg shadow-brand-purple/40 flex items-center justify-center focus:outline-none ring-2 ring-white/90 ring-offset-2 ring-offset-card"
                  aria-label="Open play options"
                >
                  <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ type: 'spring', damping: 18, stiffness: 260 }}>
                    <Plus className="w-6 h-6" />
                  </motion.div>
                </motion.button>
              </div>

              {/* Right items */}
              {RIGHT_NAV.map(item => {
                const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    className={`relative flex flex-col items-center justify-center gap-1 min-w-[72px] flex-1 h-full px-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="bottom-nav-active"
                        className="absolute w-8 h-0.5 bg-primary rounded-full top-0"
                        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                      />
                    )}
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
