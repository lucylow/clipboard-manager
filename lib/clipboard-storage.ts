import AsyncStorage from '@react-native-async-storage/async-storage';
import { withTimeout } from './with-timeout';

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
      await withTimeout(
        AsyncStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(items)),
        5000,
        'Clipboard storage write timed out',
      );
    });
  writeQueue.catch(() => undefined);
  return writeQueue;
}

export function readClipboardStorage(): Promise<string | null> {
  return AsyncStorage.getItem(CLIPBOARD_STORAGE_KEY);
}

export function updateClipboardStorage<T>(updater: (items: T[]) => T[]): Promise<void> {
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      const saved = await withTimeout(
        AsyncStorage.getItem(CLIPBOARD_STORAGE_KEY),
        5000,
        'Clipboard storage read timed out',
      );
      const next = updater(parseStoredArray<T>(saved));
      if (!Array.isArray(next)) {
        throw new Error('Clipboard storage updater must return an array');
      }
      await withTimeout(
        AsyncStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(next)),
        5000,
        'Clipboard storage update timed out',
      );
    });
  writeQueue.catch(() => undefined);
  return writeQueue;
}
