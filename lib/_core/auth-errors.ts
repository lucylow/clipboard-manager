export function getAuthError(error: unknown): Error {
  if (error instanceof Error && error.message.trim()) return error;
  if (typeof error === 'string' && error.trim()) return new Error(error.trim());
  return new Error('Failed to load the local session. Please try again.');
}
