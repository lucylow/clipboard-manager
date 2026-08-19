export type ImageActionKind = 'ocr' | 'share';

export type ImageActionPresentation = {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  busy: boolean;
};

export function getImageActionPresentation(
  kind: ImageActionKind,
  options: { busy: boolean; failed: boolean },
): ImageActionPresentation {
  const { busy, failed } = options;

  if (kind === 'ocr') {
    return {
      label: busy ? 'Extracting text…' : failed ? 'Retry saving text' : 'Extract text',
      accessibilityLabel: busy
        ? 'Extracting text from image'
        : failed
          ? 'Retry saving extracted text'
          : 'Extract text from image',
      disabled: busy,
      busy,
    };
  }

  return {
    label: busy ? 'Preparing image…' : failed ? 'Retry share' : 'Share image',
    accessibilityLabel: busy
      ? 'Preparing saved image to share'
      : failed
        ? 'Retry sharing saved image'
        : 'Share saved image',
    disabled: busy,
    busy,
  };
}
