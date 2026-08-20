export function getAppErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return 'The app encountered an unexpected problem.';
}
