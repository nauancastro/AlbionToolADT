import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { ALL_MARKET_LOCATIONS, GameServer, SERVER_HOSTS } from '../models/enums';
import { MarketPriceApiResponse, MarketQuote } from '../models/market.model';
import { CacheService, DEFAULT_CACHE_TTL_MS } from './cache.service';

/** Número máximo de item IDs enviados por requisição (evita URLs gigantes / rate-limit). */
const BATCH_SIZE = 40;

/** Considera uma cotação "obsoleta" se não atualizada nas últimas 24h. */
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function toQuote(raw: MarketPriceApiResponse): MarketQuote {
  const latestDate = [raw.sell_price_min_date, raw.buy_price_max_date]
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));
  const mostRecent = latestDate.length ? Math.max(...latestDate) : 0;
  return {
    itemId: raw.item_id,
    city: raw.city,
    sellPriceMin: raw.sell_price_min,
    sellPriceMinDate: raw.sell_price_min_date,
    buyPriceMax: raw.buy_price_max,
    buyPriceMaxDate: raw.buy_price_max_date,
    isStale: mostRecent === 0 || Date.now() - mostRecent > STALE_THRESHOLD_MS,
  };
}

/**
 * Consome a Albion Online Data Project API (https://www.albion-online-data.com/api/).
 * Toda requisição passa primeiro pelo CacheService (LocalStorage, TTL de ~20min);
 * apenas itens ausentes/expirados do cache são de fato buscados, agrupados em lotes (batching)
 * para minimizar o número de chamadas de rede.
 */
@Injectable({ providedIn: 'root' })
export class MarketDataService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheService);

  private cacheKey(server: GameServer, itemId: string): string {
    return `price::${server}::${itemId}`;
  }

  /**
   * Retorna as cotações (por cidade) para os itemIds informados.
   * Busca sempre no conjunto completo de localizações (6 cidades + Black Market)
   * para maximizar reaproveitamento do cache entre módulos da aplicação.
   */
  getPrices(itemIds: string[], server: GameServer): Observable<Map<string, MarketQuote[]>> {
    if (itemIds.length === 0) return of(new Map());

    const result = new Map<string, MarketQuote[]>();
    const missing: string[] = [];

    for (const itemId of itemIds) {
      const cached = this.cache.get<MarketQuote[]>(this.cacheKey(server, itemId));
      if (cached) {
        result.set(itemId, cached);
      } else {
        missing.push(itemId);
      }
    }

    if (missing.length === 0) return of(result);

    const batches = chunk(missing, BATCH_SIZE);
    const requests = batches.map((batch) => this.fetchBatch(batch, server));

    return forkJoin(requests).pipe(
      map((batchResults) => {
        for (const byItem of batchResults) {
          for (const [itemId, quotes] of byItem.entries()) {
            this.cache.set(this.cacheKey(server, itemId), quotes, DEFAULT_CACHE_TTL_MS);
            result.set(itemId, quotes);
          }
        }
        // Garante entrada vazia para itens sem retorno da API (evita re-fetch a cada chamada).
        for (const itemId of missing) {
          if (!result.has(itemId)) {
            this.cache.set(this.cacheKey(server, itemId), [], DEFAULT_CACHE_TTL_MS);
            result.set(itemId, []);
          }
        }
        return result;
      }),
    );
  }

  private fetchBatch(itemIds: string[], server: GameServer): Observable<Map<string, MarketQuote[]>> {
    const host = SERVER_HOSTS[server];
    const locations = ALL_MARKET_LOCATIONS.map((c) => encodeURIComponent(c)).join(',');
    const url = `https://${host}.albion-online-data.com/api/v2/stats/prices/${itemIds.join(',')}?locations=${locations}`;

    return this.http.get<MarketPriceApiResponse[]>(url).pipe(
      map((response) => {
        const byItem = new Map<string, MarketQuote[]>();
        for (const raw of response ?? []) {
          const list = byItem.get(raw.item_id) ?? [];
          list.push(toQuote(raw));
          byItem.set(raw.item_id, list);
        }
        return byItem;
      }),
    );
  }

  /** Timestamp (ms) da última atualização de cache para um item, ou undefined se nunca buscado. */
  lastFetchedAt(itemId: string, server: GameServer): number | undefined {
    return this.cache.getFetchedAt(this.cacheKey(server, itemId));
  }
}
