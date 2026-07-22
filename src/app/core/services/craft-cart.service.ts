import { Injectable, computed, signal } from '@angular/core';
import { CraftCartItem } from '../models/cart.model';

const STORAGE_KEY = 'albion-craft-cart';

/** Gerencia o "Carrinho de Craft/Refino" persistido em LocalStorage. */
@Injectable({ providedIn: 'root' })
export class CraftCartService {
  private readonly _items = signal<CraftCartItem[]>(this.loadFromStorage());
  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  private loadFromStorage(): CraftCartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CraftCartItem[]) : [];
    } catch {
      return [];
    }
  }

  private persist(items: CraftCartItem[]): void {
    this._items.set(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  add(item: CraftCartItem): void {
    this.persist([...this._items(), item]);
  }

  update(id: string, patch: Partial<CraftCartItem>): void {
    this.persist(this._items().map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  remove(id: string): void {
    this.persist(this._items().filter((i) => i.id !== id));
  }

  clear(): void {
    this.persist([]);
  }
}
