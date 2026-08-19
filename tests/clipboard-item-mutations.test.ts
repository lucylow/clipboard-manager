import { describe, expect, it } from 'vitest';

import {
  removeClipboardItems,
  updateClipboardItem,
  updateClipboardItems,
} from '../lib/clipboard-item-mutations';

type Item = { id: string; favorite: boolean; category: 'Work' | 'Personal' };

const items: Item[] = [
  { id: 'one', favorite: false, category: 'Work' },
  { id: 'two', favorite: true, category: 'Personal' },
  { id: 'three', favorite: false, category: 'Personal' },
];

describe('clipboard item mutations', () => {
  it('updates only the requested item and preserves the original array', () => {
    const next = updateClipboardItem(items, 'one', (item) => ({ ...item, favorite: true }));

    expect(next).toEqual([
      { id: 'one', favorite: true, category: 'Work' },
      items[1],
      items[2],
    ]);
    expect(items[0].favorite).toBe(false);
  });

  it('updates the selected batch and treats unknown IDs as a safe no-op', () => {
    const next = updateClipboardItems(items, new Set(['two', 'missing']), (item): Item => ({ ...item, category: 'Work' }));

    expect(next.map((item) => item.category)).toEqual(['Work', 'Work', 'Personal']);
  });

  it('removes only selected items and preserves ordering', () => {
    const next = removeClipboardItems(items, new Set(['one', 'missing']));

    expect(next).toEqual([items[1], items[2]]);
  });
});
