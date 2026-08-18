import AsyncStorage from '@react-native-async-storage/async-storage';

export const CLIPBOARD_STORAGE_KEY = 'clipboard-manager-items';

let writeQueue: Promise<void> = Promise.resolve();

/** Parse persisted list data without allowing corrupt JSON to crash the history screen. */
export function parseStoredArray<T>(saved: string | null): T[] {
  if (!saved) return [];
  try {
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function queueClipboardWrite<T>(items: T[]): Promise<void> {
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      await AsyncStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(items));
    });
  return writeQueue;
}

export function readClipboardStorage(): Promise<string | null> {
  return AsyncStorage.getItem(CLIPBOARD_STORAGE_KEY);
}

export function updateClipboardStorage<T>(updater: (items: T[]) => T[]): Promise<void> {
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      const saved = await AsyncStorage.getItem(CLIPBOARD_STORAGE_KEY);
      const next = updater(parseStoredArray<T>(saved));
      if (!Array.isArray(next)) {
        throw new Error('Clipboard storage updater must return an array');
      }
      await AsyncStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(next));
    });
  return writeQueue;
}
