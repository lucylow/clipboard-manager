import { withTimeout } from './with-timeout';

export type CacheDirectoryReader = (directory: string) => Promise<string[]>;
export type CacheFileDeleter = (uri: string) => Promise<void>;

const MANAGED_FILE_NAMES = [/^clipboard-export\.txt$/, /^clipboard-image-[^/]+\.png$/];

export function isManagedTemporaryFile(name: string): boolean {
  return MANAGED_FILE_NAMES.some((pattern) => pattern.test(name));
}

export async function cleanupManagedTemporaryFiles(
  cacheDirectory: string,
  readDirectory: CacheDirectoryReader,
  deleteFile: CacheFileDeleter,
  options: { timeoutMs?: number; maxFiles?: number } = {},
): Promise<number> {
  const timeoutMs = options.timeoutMs ?? 1500;
  const maxFiles = options.maxFiles ?? 8;
  let names: string[];
  try {
    names = await withTimeout(readDirectory(cacheDirectory), timeoutMs, 'Cache scan timed out');
  } catch {
    return 0;
  }

  const managedNames = names.filter(isManagedTemporaryFile).slice(0, maxFiles);
  let deletedCount = 0;
  for (const name of managedNames) {
    try {
      await withTimeout(deleteFile(`${cacheDirectory}${name}`), timeoutMs, 'Cache cleanup timed out');
      deletedCount += 1;
    } catch {
      // One stale cache entry must not prevent later entries from being cleaned.
    }
  }
  return deletedCount;
}
