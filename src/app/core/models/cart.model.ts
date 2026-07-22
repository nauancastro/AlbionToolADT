import { City, Enchant, GearCategory, ResourceType, Tier } from './enums';

export type CartItemKind = 'REFINE' | 'CRAFT';

interface BaseCartItem {
  id: string;
  kind: CartItemKind;
  tier: Tier;
  enchant: Enchant;
  quantity: number;
  useJournals: boolean;
  /** Cidade onde os materiais/brutos são comprados. */
  buyCity: City;
  /** Cidade onde o refino/crafting acontece (define bônus de cidade). */
  craftCity: City;
  /** Cidade de venda "local" (comparada com Black Market). */
  localSellCity: City;
  manualJournalEmptyCost?: number;
  manualJournalFullRevenue?: number;
}

/** Item de refino no carrinho: compra bruto e refina. */
export interface RefineCartItem extends BaseCartItem {
  kind: 'REFINE';
  resourceType: ResourceType;
}

/** Item de crafting de equipamento no carrinho. */
export interface CraftGearCartItem extends BaseCartItem {
  kind: 'CRAFT';
  category: GearCategory;
}

export type CartItem = RefineCartItem | CraftGearCartItem;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createRefineCartItem(
  partial: Partial<RefineCartItem> & Pick<RefineCartItem, 'resourceType' | 'tier' | 'enchant'>,
): RefineCartItem {
  return {
    id: newId(),
    kind: 'REFINE',
    quantity: 1,
    useJournals: false,
    buyCity: City.Caerleon,
    craftCity: City.Caerleon,
    localSellCity: City.Caerleon,
    ...partial,
  };
}

export function createCraftCartItem(
  partial: Partial<CraftGearCartItem> & Pick<CraftGearCartItem, 'category' | 'tier' | 'enchant'>,
): CraftGearCartItem {
  return {
    id: newId(),
    kind: 'CRAFT',
    quantity: 1,
    useJournals: false,
    buyCity: City.Caerleon,
    craftCity: City.Caerleon,
    localSellCity: City.Caerleon,
    ...partial,
  };
}
