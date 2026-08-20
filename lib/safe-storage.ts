import AsyncStorage from '@react-native-async-storage/async-storage';
import { withTimeout } from './with-timeout';

export function readStorageValue(key: string, timeoutMs = 5000): Promise<string | null> {
  return withTimeout(
    AsyncStorage.getItem(key),
    timeoutMs,
    'Local settings read timed out. Please try again.',
  );
}
