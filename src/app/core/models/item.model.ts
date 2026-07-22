import { Enchant, GearCategory, ResourceType, Tier } from './enums';

/** Item negociável no mercado (recurso bruto, refinado ou equipamento). */
export interface MarketItem {
  /** Identificador usado pela Albion Online Data Project API, ex.: "T5_PLANKS_LEVEL2@2". */
  id: string;
  /** Nome amigável para exibição. */
  name: string;
  tier: Tier;
  enchant: Enchant;
  /** Peso unitário em kg. */
  weight: number;
  /** Categoria do item para agrupamento na UI. */
  kind: 'RAW' | 'REFINED' | 'GEAR' | 'JOURNAL';
}

export interface RawResourceItem extends MarketItem {
  kind: 'RAW';
  resourceType: ResourceType;
}

export interface RefinedItem extends MarketItem {
  kind: 'REFINED';
  resourceType: ResourceType;
}

export interface GearItem extends MarketItem {
  kind: 'GEAR';
  category: GearCategory;
}

export interface JournalItem extends MarketItem {
  kind: 'JOURNAL';
  resourceType: ResourceType;
  /** Capacidade de "fama" que o diário comporta antes de ficar cheio. */
  capacity: number;
}

/**
 * Constrói o item ID no formato usado pela Albion Data Project,
 * ex: buildItemId('T5_PLANKS', 2) => 'T5_PLANKS_LEVEL2@2'
 */
export function buildItemId(baseId: string, enchant: Enchant): string {
  return enchant === 0 ? baseId : `${baseId}_LEVEL${enchant}@${enchant}`;
}
