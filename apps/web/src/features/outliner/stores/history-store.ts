import type { OutlineItem } from 'shared-types';

interface HistoryState {
  items: OutlineItem[];
}

export class HistoryStore {
  private past: HistoryState[] = [];
  private present: HistoryState;
  private future: HistoryState[] = [];
  private readonly maxHistory: number;

  constructor(initialItems: OutlineItem[] = [], maxHistory = 50) {
    this.present = { items: initialItems };
    this.maxHistory = maxHistory;
  }

  getItems(): OutlineItem[] {
    return this.present.items;
  }

  push(items: OutlineItem[]): void {
    this.past.push(this.present);
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
    this.present = { items };
    this.future = [];
  }

  undo(): OutlineItem[] | null {
    if (this.past.length === 0) return null;
    this.future.push(this.present);
    this.present = this.past.pop()!;
    return this.present.items;
  }

  redo(): OutlineItem[] | null {
    if (this.future.length === 0) return null;
    this.past.push(this.present);
    this.present = this.future.pop()!;
    return this.present.items;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }
}
