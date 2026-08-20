import AsyncStorage from '@react-native-async-storage/async-storage';
import { withTimeout } from './with-timeout';

export function readStorageValue(key: string, timeoutMs = 5000): Promise<string | null> {
  return withTimeout(
    AsyncStorage.getItem(key),
    timeoutMs,
    'Local settings read timed out. Please try again.',
  );
}

export function writeStorageValue(key: string, value: string, timeoutMs = 5000): Promise<void> {
  return withTimeout(
    AsyncStorage.setItem(key, value),
    timeoutMs,
    'Local settings save timed out. Please try again.',
  );
}

export function removeStorageValues(keys: string[], timeoutMs = 5000): Promise<void> {
  return withTimeout(
    AsyncStorage.multiRemove(keys),
    timeoutMs,
    'Local settings cleanup timed out. Please try again.',
  );
}
