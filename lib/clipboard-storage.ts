import AsyncStorage from '@react-native-async-storage/async-storage';

export const CLIPBOARD_STORAGE_KEY = 'clipboard-manager-items';

let writeQueue: Promise<void> = Promise.resolve();

export function queueClipboardWrite<T>(items: T[]) {
  writeQueue = writeQueue.catch(() => undefined).then(() => AsyncStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(items)));
  return writeQueue;
}

export async function readClipboardStorage<T>() {
  return AsyncStorage.getItem(CLIPBOARD_STORAGE_KEY) as Promise<string | null>;
}

export async function updateClipboardStorage<T>(updater: (items: T[]) => T[]) {
  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    const saved = await AsyncStorage.getItem(CLIPBOARD_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    const next = updater(Array.isArray(parsed) ? parsed as T[] : []);
    await AsyncStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(next));
  });
  return writeQueue;
}
