import { buildItemId, JournalItem, RawResourceItem, RefinedItem } from '../models/item.model';
import {
  Enchant,
  ENCHANTS,
  JOURNAL_BY_RESOURCE,
  JOURNAL_LABELS,
  REFINED_BY_RESOURCE,
  REFINED_LABELS,
  RESOURCE_LABELS,
  ResourceType,
  Tier,
  TIERS,
} from '../models/enums';

/** ID base (sem sufixo de encantamento) de cada recurso bruto por tier. */
const RAW_BASE_ID: Record<ResourceType, string> = {
  [ResourceType.Wood]: 'WOOD',
  [ResourceType.Ore]: 'ORE',
  [ResourceType.Fiber]: 'FIBER',
  [ResourceType.Hide]: 'HIDE',
  [ResourceType.Rock]: 'ROCK',
};

const REFINED_BASE_ID: Record<ResourceType, string> = {
  [ResourceType.Wood]: 'PLANKS',
  [ResourceType.Ore]: 'METALBAR',
  [ResourceType.Fiber]: 'CLOTH',
  [ResourceType.Hide]: 'LEATHER',
  [ResourceType.Rock]: 'STONEBLOCK',
};

/** Peso aproximado (kg) do recurso bruto por tier — cresce de forma linear com a tier. */
function rawWeight(tier: Tier): number {
  return Number((0.31 + (tier - 4) * 0.14).toFixed(2));
}

/** Refinados pesam ~45% a mais que o bruto equivalente. */
function refinedWeight(tier: Tier): number {
  return Number((rawWeight(tier) * 1.45).toFixed(2));
}

function enchantSuffixName(enchant: Enchant): string {
  return enchant === 0 ? '' : `.${enchant}`;
}

export const RAW_ITEMS: RawResourceItem[] = TIERS.flatMap((tier) =>
  ENCHANTS.flatMap((enchant) =>
    (Object.values(ResourceType) as ResourceType[]).map((resourceType) => {
      const baseId = `T${tier}_${RAW_BASE_ID[resourceType]}`;
      return {
        id: buildItemId(baseId, enchant),
        name: `${RESOURCE_LABELS[resourceType]} T${tier}${enchantSuffixName(enchant)}`,
        tier,
        enchant,
        weight: rawWeight(tier),
        kind: 'RAW' as const,
        resourceType,
      };
    }),
  ),
);

export const REFINED_ITEMS: RefinedItem[] = TIERS.flatMap((tier) =>
  ENCHANTS.flatMap((enchant) =>
    (Object.values(ResourceType) as ResourceType[]).map((resourceType) => {
      const baseId = `T${tier}_${REFINED_BASE_ID[resourceType]}`;
      return {
        id: buildItemId(baseId, enchant),
        name: `${REFINED_LABELS[REFINED_BY_RESOURCE[resourceType]]} T${tier}${enchantSuffixName(enchant)}`,
        tier,
        enchant,
        weight: refinedWeight(tier),
        kind: 'REFINED' as const,
        resourceType,
      };
    }),
  ),
);

/**
 * Diários (Journals) de refino. IDs seguem uma convenção interna consistente;
 * caso a Data Project não retorne cotação (cobertura de diários é limitada),
 * a UI permite input manual do preço do diário cheio/vazio.
 */
export const JOURNAL_ITEMS: JournalItem[] = TIERS.filter((t) => t >= 4).flatMap((tier) =>
  (Object.values(ResourceType) as ResourceType[]).map((resourceType) => {
    const profession = JOURNAL_BY_RESOURCE[resourceType];
    const capacity = 3000 * (tier - 3);
    return {
      id: `T${tier}_${profession}_EMPTY`,
      name: `${JOURNAL_LABELS[profession]} (Vazio) T${tier}`,
      tier,
      enchant: 0 as Enchant,
      weight: 1,
      kind: 'JOURNAL' as const,
      resourceType,
      capacity,
    };
  }),
);

export function journalFullId(emptyId: string): string {
  return emptyId.replace('_EMPTY', '_FULL');
}

export function findRawItem(resourceType: ResourceType, tier: Tier, enchant: Enchant): RawResourceItem {
  const item = RAW_ITEMS.find((i) => i.resourceType === resourceType && i.tier === tier && i.enchant === enchant);
  if (!item) throw new Error(`Raw item not found for ${resourceType} T${tier}.${enchant}`);
  return item;
}

export function findRefinedItem(resourceType: ResourceType, tier: Tier, enchant: Enchant): RefinedItem {
  const item = REFINED_ITEMS.find((i) => i.resourceType === resourceType && i.tier === tier && i.enchant === enchant);
  if (!item) throw new Error(`Refined item not found for ${resourceType} T${tier}.${enchant}`);
  return item;
}

export function findJournalItem(resourceType: ResourceType, tier: Tier): JournalItem | undefined {
  return JOURNAL_ITEMS.find((i) => i.resourceType === resourceType && i.tier === tier);
}
