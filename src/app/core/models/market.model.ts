import { City } from './enums';

/**
 * Resposta bruta da Albion Online Data Project API
 * (GET /api/v2/stats/prices/{items}?locations={cities})
 */
export interface MarketPriceApiResponse {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

/** Cotação normalizada de um item em uma cidade específica. */
export interface MarketQuote {
  itemId: string;
  city: City | string;
  /** Sell Order: preço mais barato disponível para compra imediata (custo de aquisição). */
  sellPriceMin: number;
  sellPriceMinDate: string;
  /** Buy Order: melhor oferta de compra ativa (venda imediata / lucro rápido). */
  buyPriceMax: number;
  buyPriceMaxDate: string;
  /** true quando a cotação não foi atualizada nas últimas 24h (dado possivelmente obsoleto). */
  isStale: boolean;
}

/** Entrada de cache persistida no LocalStorage. */
export interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  expiresAt: number;
}
