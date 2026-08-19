import { describe, expect, it, vi } from 'vitest';
import { createNoticeController, type NoticeTimer } from '../lib/notice-controller';

describe('notice controller', () => {
  it('replaces an older notice timer when a newer notice is shown', () => {
    vi.useFakeTimers();
    const setNotice = vi.fn();
    const controller = createNoticeController(setNotice, 1000);

    controller.show('Saved');
    controller.show('Copied');
    vi.advanceTimersByTime(999);
    expect(setNotice).toHaveBeenLastCalledWith('Copied');
    vi.advanceTimersByTime(1);

    expect(setNotice).toHaveBeenLastCalledWith('');
    expect(setNotice).toHaveBeenCalledTimes(3);
    controller.dispose();
    vi.useRealTimers();
  });

  it('cancels pending cleanup when disposed', () => {
    const setNotice = vi.fn();
    const scheduled: Array<() => void> = [];
    const cancelled: NoticeTimer[] = [];
    const controller = createNoticeController(
      setNotice,
      1000,
      (callback) => {
        scheduled.push(callback);
        return scheduled.length as unknown as NoticeTimer;
      },
      (timer) => cancelled.push(timer),
    );

    controller.show('Saved');
    controller.dispose();

    expect(cancelled).toHaveLength(1);
    expect(setNotice).toHaveBeenCalledTimes(1);
  });
});
