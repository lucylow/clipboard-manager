export function getSafeServerErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 240);
  }
  return 'Unknown server error';
}

export const PUBLIC_SERVER_ERROR = 'The server could not complete that request. Please try again.';
