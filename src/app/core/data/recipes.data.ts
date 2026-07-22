import { CraftingRecipe, RefiningLine } from '../models/recipe.model';
import { GearCategory, ResourceType, Tier } from '../models/enums';

/**
 * Quantidade de recurso bruto consumida por unidade refinada, a 0% de RRR.
 * Segue a progressão padrão do Albion Online: tier - 1.
 */
export const REFINING_LINES: RefiningLine[] = [
  {
    resourceType: ResourceType.Wood,
    rawPerRefinedByTier: { 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 },
    baseFocusCost: 8,
  },
  {
    resourceType: ResourceType.Ore,
    rawPerRefinedByTier: { 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 },
    baseFocusCost: 8,
  },
  {
    resourceType: ResourceType.Fiber,
    rawPerRefinedByTier: { 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 },
    baseFocusCost: 8,
  },
  {
    resourceType: ResourceType.Hide,
    rawPerRefinedByTier: { 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 },
    baseFocusCost: 8,
  },
  {
    resourceType: ResourceType.Rock,
    rawPerRefinedByTier: { 4: 3, 5: 4, 6: 5, 7: 6, 8: 7 },
    baseFocusCost: 6,
  },
];

export function getRefiningLine(resourceType: ResourceType): RefiningLine {
  const line = REFINING_LINES.find((l) => l.resourceType === resourceType);
  if (!line) throw new Error(`Refining line not found for ${resourceType}`);
  return line;
}

/**
 * Fator de escala de quantidade de material por tier em relação à T4 (aprox. +20% por tier,
 * seguindo a curva de custo de crafting observada no jogo).
 */
export const CRAFT_TIER_SCALING: Record<Tier, number> = {
  4: 1,
  5: 1.2,
  6: 1.44,
  7: 1.73,
  8: 2.07,
};

/**
 * Receitas representativas de equipamentos (uma por linha de recurso + 3 armaduras),
 * cobrindo as 5 linhas de coleta. Quantidades a T4.0; escalam por CRAFT_TIER_SCALING.
 */
export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    category: GearCategory.WeaponSword,
    materials: [{ resourceType: ResourceType.Ore, quantity: 20 }],
    baseFocusCost: 120,
  },
  {
    category: GearCategory.WeaponBow,
    materials: [{ resourceType: ResourceType.Wood, quantity: 20 }],
    baseFocusCost: 120,
  },
  {
    category: GearCategory.WeaponFirestaff,
    materials: [{ resourceType: ResourceType.Fiber, quantity: 20 }],
    baseFocusCost: 120,
  },
  {
    category: GearCategory.ArmorPlate,
    materials: [
      { resourceType: ResourceType.Ore, quantity: 16 },
      { resourceType: ResourceType.Hide, quantity: 8 },
    ],
    baseFocusCost: 150,
  },
  {
    category: GearCategory.ArmorLeather,
    materials: [
      { resourceType: ResourceType.Hide, quantity: 16 },
      { resourceType: ResourceType.Fiber, quantity: 8 },
    ],
    baseFocusCost: 150,
  },
  {
    category: GearCategory.ArmorCloth,
    materials: [
      { resourceType: ResourceType.Fiber, quantity: 16 },
      { resourceType: ResourceType.Hide, quantity: 8 },
    ],
    baseFocusCost: 150,
  },
];

export function getCraftingRecipe(category: GearCategory): CraftingRecipe {
  const recipe = CRAFTING_RECIPES.find((r) => r.category === category);
  if (!recipe) throw new Error(`Recipe not found for ${category}`);
  return recipe;
}
