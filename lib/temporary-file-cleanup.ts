import { withTimeout } from './with-timeout';

export type TemporaryFileDeleter = (uri: string) => Promise<void>;

export async function cleanupTemporaryFile(
  uri: string | null | undefined,
  deleteFile: TemporaryFileDeleter,
  timeoutMs = 1500,
): Promise<boolean> {
  if (typeof uri !== 'string' || uri.trim().length === 0) return true;
  try {
    await withTimeout(deleteFile(uri), timeoutMs, 'Temporary-file cleanup timed out');
    return true;
  } catch {
    return false;
  }
}
