import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from '../models/cart.model';

const STORAGE_KEY = 'albion-bulk-cart';

/** Gerencia o "Carrinho de Craft/Refino" (multi-seleção) persistido em LocalStorage. */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>(this.loadFromStorage());
  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private persist(items: CartItem[]): void {
    this._items.set(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  add(item: CartItem): void {
    this.persist([...this._items(), item]);
  }

  update(id: string, patch: Partial<CartItem>): void {
    this.persist(this._items().map((i) => (i.id === id ? ({ ...i, ...patch } as CartItem) : i)));
  }

  remove(id: string): void {
    this.persist(this._items().filter((i) => i.id !== id));
  }

  clear(): void {
    this.persist([]);
  }
}
