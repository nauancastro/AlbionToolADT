import { City, Enchant, GearCategory, Tier } from './enums';

/** Item do carrinho de Crafting/Refino em massa. */
export interface CraftCartItem {
  id: string;
  category: GearCategory;
  tier: Tier;
  enchant: Enchant;
  quantity: number;
  useJournals: boolean;
  buyCity: City;
  craftCity: City;
  localSellCity: City;
  /** Overrides manuais de preço de diário, usados quando a API não cobre o item. */
  manualJournalEmptyCost?: number;
  manualJournalFullRevenue?: number;
}

export function createCartItem(partial: Partial<CraftCartItem> & Pick<CraftCartItem, 'category' | 'tier' | 'enchant'>): CraftCartItem {
  return {
    id: `${partial.category}-${partial.tier}-${partial.enchant}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    quantity: 1,
    useJournals: false,
    buyCity: partial.buyCity ?? City.Caerleon,
    craftCity: partial.craftCity ?? City.Caerleon,
    localSellCity: partial.localSellCity ?? City.Caerleon,
    ...partial,
  };
}
