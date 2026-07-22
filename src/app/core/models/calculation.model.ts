import { City, Enchant, GearCategory, ResourceType, Tier } from './enums';

/** Modo de negociação no mercado. */
export type OrderMode = 'SELL_ORDER' | 'BUY_ORDER';

export interface PriceSnapshot {
  city: City | string;
  sellPriceMin: number;
  buyPriceMax: number;
  isStale: boolean;
}

/** Lucro projetado para um dos dois modos de venda (Sell Order x Buy Order). */
export interface OrderProfit {
  /** Sell Order = lista e espera (referência: sellPriceMin do destino). Buy Order = venda imediata (referência: buyPriceMax do destino). */
  mode: OrderMode;
  revenuePerUnit: number;
  profitPerUnitNoFocus: number;
  profitPerUnitWithFocus: number;
  marginPercentNoFocus: number;
  marginPercentWithFocus: number;
}

/** Resultado de uma oportunidade de refino no Smart Route Finder. */
export interface RefiningOpportunity {
  resourceType: ResourceType;
  tier: Tier;
  enchant: Enchant;
  rawItemId: string;
  refinedItemId: string;
  buyCity: City | string;
  sellCity: City | string;

  /** Custo de aquisição do bruto: compra imediata (sellPriceMin) na cidade de compra. */
  rawUnitCost: number;

  rawQuantityPerUnit: number;
  returnRateNoFocus: number;
  returnRateWithFocus: number;
  focusCostPerUnit: number;

  costPerUnitNoFocus: number;
  costPerUnitWithFocus: number;
  taxRate: number;

  sellOrderProfit: OrderProfit;
  buyOrderProfit: OrderProfit;

  weightPerUnit: number;
  isStale: boolean;
}

/** Resultado de cálculo de crafting para um item específico do carrinho. */
export interface CraftingResult {
  category: GearCategory;
  tier: Tier;
  enchant: Enchant;
  quantity: number;

  materialsCostNoFocus: number;
  materialsCostWithFocus: number;
  focusCostTotal: number;

  useJournals: boolean;
  journalEmptyCost: number;
  journalFullRevenue: number;
  journalItemsPerFill: number;
  /** Custo líquido total de diários para a quantidade craftada (pode ser negativo = ganho). */
  journalNetCostTotal: number;

  localSellCity: City | string;
  sellPriceLocal: number;
  sellPriceBlackMarket: number;

  revenueLocalTotal: number;
  revenueBlackMarketTotal: number;
  taxRate: number;

  profitLocalNoFocus: number;
  profitLocalWithFocus: number;
  profitBlackMarketNoFocus: number;
  profitBlackMarketWithFocus: number;

  totalWeight: number;
  isStale: boolean;
}

export interface CartWeightSummary {
  totalWeightKg: number;
  /** Capacidade de referência (kg) de montarias comuns para orientar o jogador. */
  mountSuggestion: string;
}
