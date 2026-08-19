export type NoticeTimer = ReturnType<typeof setTimeout>;

export type NoticeController = {
  show: (message: string) => void;
  dispose: () => void;
};

export function createNoticeController(
  setNotice: (message: string) => void,
  delayMs = 2200,
  schedule: (callback: () => void, delay: number) => NoticeTimer = setTimeout,
  cancel: (timer: NoticeTimer) => void = clearTimeout,
): NoticeController {
  let timer: NoticeTimer | null = null;

  const dispose = () => {
    if (timer !== null) {
      cancel(timer);
      timer = null;
    }
  };

  return {
    show: (message: string) => {
      dispose();
      setNotice(message);
      timer = schedule(() => {
        timer = null;
        setNotice('');
      }, delayMs);
    },
    dispose,
  };
}
