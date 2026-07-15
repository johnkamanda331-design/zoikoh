export function safeJSONParse<T>(value: string | null, fallback: T): T {
  if (value === null) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    return safeJSONParse<T>(raw, fallback);
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignored
  }
}

export function loadString(key: string, fallback = ''): string {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveString(key: string, value: string) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, value);
  } catch {
    // ignored
  }
}
