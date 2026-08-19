import { describe, expect, it, vi } from 'vitest';
import { cleanupManagedTemporaryFiles, isManagedTemporaryFile } from '../lib/temporary-cache-cleanup';

describe('temporary cache cleanup', () => {
  it('recognizes only Clipboard Manager temporary files', () => {
    expect(isManagedTemporaryFile('clipboard-export.txt')).toBe(true);
    expect(isManagedTemporaryFile('clipboard-image-42.png')).toBe(true);
    expect(isManagedTemporaryFile('user-photo.png')).toBe(false);
    expect(isManagedTemporaryFile('clipboard-image-42.jpg')).toBe(false);
  });

  it('deletes managed files while leaving unrelated files untouched', async () => {
    const deleteFile = vi.fn(async () => undefined);
    const count = await cleanupManagedTemporaryFiles(
      'cache://',
      async () => ['clipboard-export.txt', 'user-photo.png', 'clipboard-image-42.png'],
      deleteFile,
    );

    expect(count).toBe(2);
    expect(deleteFile).toHaveBeenCalledWith('cache://clipboard-export.txt');
    expect(deleteFile).toHaveBeenCalledWith('cache://clipboard-image-42.png');
    expect(deleteFile).not.toHaveBeenCalledWith('cache://user-photo.png');
  });

  it('continues after one deletion fails and respects the file limit', async () => {
    const deleteFile = vi.fn(async (uri: string) => {
      if (uri.endsWith('clipboard-export.txt')) throw new Error('locked');
    });

    const count = await cleanupManagedTemporaryFiles(
      'cache://',
      async () => ['clipboard-export.txt', 'clipboard-image-1.png', 'clipboard-image-2.png'],
      deleteFile,
      { maxFiles: 2 },
    );

    expect(count).toBe(1);
    expect(deleteFile).toHaveBeenCalledTimes(2);
    expect(deleteFile).not.toHaveBeenCalledWith('cache://clipboard-image-2.png');
  });

  it('returns zero when scanning stalls or fails', async () => {
    vi.useFakeTimers();
    try {
      const deleteFile = vi.fn(async () => undefined);
      const scan = cleanupManagedTemporaryFiles('cache://', () => new Promise<string[]>(() => {}), deleteFile, { timeoutMs: 20 });
      await vi.advanceTimersByTimeAsync(20);
      await expect(scan).resolves.toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
