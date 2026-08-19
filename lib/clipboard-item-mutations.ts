export function updateClipboardItem<T extends { id: string }>(
  items: T[],
  id: string,
  update: (item: T) => T,
): T[] {
  return items.map((item) => item.id === id ? update(item) : item);
}

export function updateClipboardItems<T extends { id: string }>(
  items: T[],
  ids: ReadonlySet<string>,
  update: (item: T) => T,
): T[] {
  return items.map((item) => ids.has(item.id) ? update(item) : item);
}

export function removeClipboardItems<T extends { id: string }>(
  items: T[],
  ids: ReadonlySet<string>,
): T[] {
  return items.filter((item) => !ids.has(item.id));
}
