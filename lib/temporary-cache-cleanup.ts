import { withTimeout } from './with-timeout';

export type CacheDirectoryReader = (directory: string) => Promise<unknown>;
export type CacheFileDeleter = (uri: string) => Promise<void>;

const MANAGED_FILE_NAMES = [/^clipboard-export\.txt$/, /^clipboard-image-[A-Za-z0-9_-]+\.png$/];
const DEFAULT_TIMEOUT_MS = 1500;
const DEFAULT_MAX_FILES = 8;

export function isManagedTemporaryFile(name: unknown): name is string {
  return typeof name === 'string' && MANAGED_FILE_NAMES.some((pattern) => pattern.test(name));
}

function normalizeMaxFiles(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_MAX_FILES;
  return Math.max(0, Math.floor(value as number));
}

function joinCacheUri(directory: string, name: string): string {
  return `${directory}${directory.endsWith('/') ? '' : '/'}${name}`;
}

export async function cleanupManagedTemporaryFiles(
  cacheDirectory: string,
  readDirectory: CacheDirectoryReader,
  deleteFile: CacheFileDeleter,
  options: { timeoutMs?: number; maxFiles?: number } = {},
): Promise<number> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxFiles = normalizeMaxFiles(options.maxFiles);
  let names: unknown;
  try {
    names = await withTimeout(readDirectory(cacheDirectory), timeoutMs, 'Cache scan timed out');
  } catch {
    return 0;
  }

  if (!Array.isArray(names) || maxFiles === 0) return 0;

  const managedNames = names.filter(isManagedTemporaryFile).slice(0, maxFiles);
  let deletedCount = 0;
  for (const name of managedNames) {
    try {
      await withTimeout(deleteFile(joinCacheUri(cacheDirectory, name)), timeoutMs, 'Cache cleanup timed out');
      deletedCount += 1;
    } catch {
      // One stale or interrupted cache entry must not prevent later entries from being cleaned.
    }
  }
  return deletedCount;
}
