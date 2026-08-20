export function getApiErrorMessage(error: unknown, fallback = 'Network request failed. Please try again.'): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === 'string' && error.trim()) return error.trim();
  return fallback;
}

export function parseApiTextPayload<T>(text: string, contentType: string | null): T {
  if (!text.trim()) return {} as T;
  if (contentType?.includes('application/json')) {
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error('The server returned malformed JSON. Please try again.');
    }
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('The server returned an unsupported response format. Please try again.');
  }
}
