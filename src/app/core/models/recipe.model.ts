import { Enchant, GearCategory, ResourceType, Tier } from './enums';

/** Quantidade de um material refinado exigida por uma receita, na tier/encantamento base da receita. */
export interface MaterialRequirement {
  resourceType: ResourceType;
  /** Quantidade consumida a 0% de RRR (Resource Return Rate). */
  quantity: number;
}

/** Receita de crafting de equipamento (arma/armadura). */
export interface CraftingRecipe {
  category: GearCategory;
  materials: MaterialRequirement[];
  /** Custo-base de foco (para T4.0); escala com tier/encantamento. */
  baseFocusCost: number;
}

/** Linha de refino (recurso bruto -> material refinado). */
export interface RefiningLine {
  resourceType: ResourceType;
  /** Quantidade de recurso bruto consumida por unidade refinada, por tier (a 0% RRR). */
  rawPerRefinedByTier: Record<Tier, number>;
  /** Custo-base de foco por unidade refinada (T4.0); escala com tier/encantamento. */
  baseFocusCost: number;
}

export interface RecipeInput {
  itemId: string;
  resourceType: ResourceType;
  tier: Tier;
  enchant: Enchant;
  quantityRequired: number;
}
