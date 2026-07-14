import React, { useEffect, useState } from 'react';
import { getQueuedEvents } from '@/lib/analytics';

export function AnalyticsPage() {
  const [events, setEvents] = useState(getQueuedEvents());

  useEffect(() => {
    const onStorage = () => setEvents(getQueuedEvents());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Analytics Queue</h1>
      <p className="text-sm text-muted-foreground mb-4">Events stored locally (for debugging)</p>
      <div className="space-y-3">
        {events.length === 0 && <div className="text-sm text-muted-foreground">No queued events</div>}
        {events.map((e: any, i: number) => (
          <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div className="text-xs text-muted-foreground mb-1">{new Date(e.ts).toLocaleString()}</div>
            <div className="font-mono text-sm">{e.name}</div>
            <pre className="text-xs text-muted-foreground mt-2">{JSON.stringify(e.payload, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AnalyticsPage;
