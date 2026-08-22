export const readJsonStorage = (storage, key, fallback) => {
  if (!storage) return fallback;
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    storage.removeItem(key);
    return fallback;
  }
};

export const writeJsonStorage = (storage, key, value) => {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing or when quota is full.
  }
};

export const getBrowserStorage = (kind = 'local') => {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
};
