import { City, Enchant, GearCategory, ResourceType, Tier } from './enums';

/** Modo de aquisição/venda de um item no mercado. */
export type OrderMode = 'SELL_ORDER' | 'BUY_ORDER';

export interface PriceSnapshot {
  city: City | string;
  sellPriceMin: number;
  buyPriceMax: number;
  isStale: boolean;
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

  rawUnitCost: number;
  rawOrderMode: OrderMode;
  refinedUnitRevenue: number;
  refinedOrderMode: OrderMode;

  rawQuantityPerUnit: number;
  returnRateNoFocus: number;
  returnRateWithFocus: number;
  focusCostPerUnit: number;

  costPerUnitNoFocus: number;
  costPerUnitWithFocus: number;
  taxRate: number;

  profitPerUnitNoFocus: number;
  profitPerUnitWithFocus: number;
  marginPercentNoFocus: number;
  marginPercentWithFocus: number;

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
  journalNetCost: number;

  sellPriceLocal: number;
  sellPriceBlackMarket: number;
  localSellCity: City | string;

  revenueLocal: number;
  revenueBlackMarket: number;
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
