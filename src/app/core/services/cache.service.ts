import { Injectable } from '@angular/core';
import { CacheEntry } from '../models/market.model';

/** Prefixo de todas as chaves gravadas por este serviço no LocalStorage. */
const CACHE_PREFIX = 'albion-cache::';

/** TTL padrão de 20 minutos (dentro da janela de 15-30min recomendada). */
export const DEFAULT_CACHE_TTL_MS = 20 * 60 * 1000;

/**
 * Serviço de cache genérico baseado em LocalStorage com expiração (TTL).
 * Usado para evitar chamadas repetidas/excessivas à Albion Online Data Project API.
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  get<T>(key: string): T | undefined {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;

    try {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return undefined;
      }
      return entry.data;
    } catch {
      localStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
  }

  set<T>(key: string, data: T, ttlMs: number = DEFAULT_CACHE_TTL_MS): void {
    const entry: CacheEntry<T> = {
      data,
      fetchedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Quota do LocalStorage excedida: limpa entradas expiradas e tenta novamente uma vez.
      this.purgeExpired();
      try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
      } catch {
        /* Se ainda assim falhar, seguimos sem cache para esta chave. */
      }
    }
  }

  getFetchedAt(key: string): number | undefined {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    try {
      const entry: CacheEntry<unknown> = JSON.parse(raw);
      return entry.fetchedAt;
    } catch {
      return undefined;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key);
  }

  purgeExpired(): void {
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key?.startsWith(CACHE_PREFIX)) continue;
      try {
        const entry: CacheEntry<unknown> = JSON.parse(localStorage.getItem(key) ?? '');
        if (now > entry.expiresAt) localStorage.removeItem(key);
      } catch {
        localStorage.removeItem(key);
      }
    }
  }

  clearAll(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) localStorage.removeItem(key);
    }
  }
}
