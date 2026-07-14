import React, { useEffect, useState } from 'react';
import { getProgress, fetchServerProgress } from '@/lib/progress';
import { useUser } from '@clerk/react';
import { flush } from '@/lib/analytics';

export function ProgressTracker() {
  const [stats, setStats] = useState(getProgress());
  const { isSignedIn } = useUser();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const onStorage = () => setStats(getProgress());
    window.addEventListener('storage', onStorage);
    window.addEventListener('zoiko:progress', onStorage as any);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('zoiko:progress', onStorage as any);
    };
  }, []);

  // If user is signed in, attempt to fetch server-side progress and prefer it
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      if (!isSignedIn) return;
      setSyncing(true);
      try {
        // flush local events first so server sees recent activity
        await flush();
        const server = await fetchServerProgress();
        if (server && !cancelled) {
          setStats(server);
        }
      } finally {
        setSyncing(false);
      }
    }
    sync();
    return () => { cancelled = true; };
  }, [isSignedIn]);

  const accuracy = stats.totalAnswered ? Math.round((stats.correct / stats.totalAnswered) * 100) : 0;

  return (
    <div className="w-full p-3 rounded-xl bg-secondary/30 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-muted-foreground">Accuracy</p>
          <p className="text-lg font-semibold">{accuracy}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Current Streak</p>
          <p className="text-lg font-semibold">{stats.currentStreak}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Answered</p>
          <p className="text-lg font-semibold">{stats.totalAnswered}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {isSignedIn && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={async () => {
              setSyncing(true);
              try {
                await flush();
                const server = await fetchServerProgress();
                if (server) setStats(server);
              } finally {
                setSyncing(false);
              }
            }}
            disabled={syncing}
          >
            {syncing ? 'Syncing…' : 'Sync with server'}
          </button>
        )}
      </div>

      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-purple to-brand-blue"
          style={{ width: `${accuracy}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressTracker;
