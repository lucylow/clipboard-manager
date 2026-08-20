import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { queueClipboardWrite, repairStoredPayload } from '@/lib/clipboard-storage';
import { createSingleFlight } from '@/lib/single-flight';
import { withTimeout } from '@/lib/with-timeout';

type HistoryPersistenceOptions<T> = {
  storageKey: string;
  initialValue: T[];
  normalize: (value: unknown) => T[];
  onNotice: (message: string) => void;
};

type HistoryPersistenceResult<T> = {
  items: T[];
  loadItems: () => Promise<boolean>;
  persist: (next: T[]) => Promise<boolean>;
};

export function useHistoryPersistence<T>({
  storageKey,
  initialValue,
  normalize,
  onNotice,
}: HistoryPersistenceOptions<T>): HistoryPersistenceResult<T> {
  const [items, setItems] = useState<T[]>(initialValue);
  const itemsRef = useRef(initialValue);
  const persistRevisionRef = useRef(0);
  const loadItemsFlightRef = useRef(createSingleFlight<boolean>());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const loadItems = useCallback(() => loadItemsFlightRef.current.run(async (): Promise<boolean> => {
    try {
      const saved = await withTimeout(AsyncStorage.getItem(storageKey), 5000, 'History storage read timed out');
      if (!saved) {
        setItems(initialValue);
        itemsRef.current = initialValue;
        await AsyncStorage.setItem(storageKey, JSON.stringify(initialValue));
        return true;
      }

      const repaired = repairStoredPayload<T>(saved, (item): item is T => normalize([item]).length === 1);
      const normalized = normalize(repaired.items);
      setItems(normalized);
      itemsRef.current = normalized;
      if (repaired.repaired || normalized.length !== repaired.items.length) {
        onNotice('History repaired: invalid entries were removed');
      }
      await AsyncStorage.setItem(storageKey, JSON.stringify(normalized));
      return true;
    } catch {
      setItems(initialValue);
      itemsRef.current = initialValue;
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(initialValue));
      } catch {
        // Keep the in-memory fallback when local recovery also fails.
      }
      onNotice('Saved history could not be read, so starter items were restored');
      return false;
    }
  }), [initialValue, normalize, onNotice, storageKey]);

  const persist = useCallback(async (next: T[]) => {
    const previous = itemsRef.current;
    const revision = persistRevisionRef.current + 1;
    persistRevisionRef.current = revision;
    itemsRef.current = next;
    setItems(next);

    try {
      await queueClipboardWrite(next);
      return true;
    } catch {
      if (persistRevisionRef.current === revision) {
        itemsRef.current = previous;
        setItems(previous);
      }
      onNotice('Could not save the latest history change. Your previous saved history is still available.');
      return false;
    }
  }, [onNotice]);

  return { items, loadItems, persist };
}
