// Lightweight analytics helper: stores events locally and posts to /api/analytics when available
type AnalyticsEvent = {
  name: string;
  payload?: Record<string, any>;
  ts: number;
};

const KEY = 'zoiko_analytics_queue_v1';

export function trackEvent(name: string, payload?: Record<string, any>) {
  try {
    const qRaw = localStorage.getItem(KEY) || '[]';
    const queue: AnalyticsEvent[] = JSON.parse(qRaw);
    queue.push({ name, payload: payload || {}, ts: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(queue));
    // best-effort send
    flush().catch(() => {});
  } catch (e) {
    // ignore
  }
}

export async function flush() {
  try {
    const qRaw = localStorage.getItem(KEY) || '[]';
    const queue: AnalyticsEvent[] = JSON.parse(qRaw);
    if (!queue.length) return;
    // attempt to POST to server endpoint; if it fails, keep events locally
    const res = await fetch('/api/analytics', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: queue, clientMeta: { sessionId: window.sessionStorage.getItem('zoiko_session') || null } }),
    });
    if (res.ok) {
      localStorage.removeItem(KEY);
    }
  } catch (e) {
    // keep queue for later
    // optionally trim very large queues
    try {
      const qRaw = localStorage.getItem(KEY) || '[]';
      const queue: AnalyticsEvent[] = JSON.parse(qRaw);
      if (queue.length > 1000) {
        localStorage.setItem(KEY, JSON.stringify(queue.slice(-500)));
      }
    } catch {}
  }
}

export function getQueuedEvents() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as AnalyticsEvent[];
  } catch {
    return [];
  }
}
