import { describe, expect, it, vi } from 'vitest';
import { cleanupTemporaryFile } from '../lib/temporary-file-cleanup';

describe('cleanupTemporaryFile', () => {
  it('deletes an existing temporary file and reports success', async () => {
    const deleteFile = vi.fn(async () => undefined);

    await expect(cleanupTemporaryFile('cache://image.png', deleteFile)).resolves.toBe(true);
    expect(deleteFile).toHaveBeenCalledWith('cache://image.png');
  });

  it('contains deletion failures without throwing', async () => {
    const deleteFile = vi.fn(async () => { throw new Error('delete failed'); });

    await expect(cleanupTemporaryFile('cache://export.txt', deleteFile)).resolves.toBe(false);
  });

  it('contains stalled cleanup after the configured timeout', async () => {
    vi.useFakeTimers();
    try {
      const deleteFile = vi.fn(() => new Promise<void>(() => {}));
      const cleanup = cleanupTemporaryFile('cache://stalled.png', deleteFile, 25);
      await vi.advanceTimersByTimeAsync(25);
      await expect(cleanup).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not call the deleter when no temporary URI exists', async () => {
    const deleteFile = vi.fn(async () => undefined);

    await expect(cleanupTemporaryFile(null, deleteFile)).resolves.toBe(true);
    expect(deleteFile).not.toHaveBeenCalled();
  });
});


  it('ignores malformed or blank runtime URIs safely', async () => {
    const deleteFile = vi.fn(async () => undefined);

    await expect(cleanupTemporaryFile('   ', deleteFile)).resolves.toBe(true);
    await expect(cleanupTemporaryFile(42 as unknown as string, deleteFile)).resolves.toBe(true);
    expect(deleteFile).not.toHaveBeenCalled();
  });
