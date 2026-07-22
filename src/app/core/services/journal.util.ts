import { Enchant, Tier } from '../models/enums';

/**
 * Fama aproximada gerada por unidade refinada/craftada, usada para estimar quantos itens
 * são necessários para encher um diário (Journal) de determinada tier.
 * Aproximação: cresce com a tier e com o encantamento.
 */
export function estimatedFamePerUnit(tier: Tier, enchant: Enchant): number {
  return 3 * tier * Math.pow(enchant + 1, 1.5);
}

export function itemsToFillJournal(capacity: number, tier: Tier, enchant: Enchant): number {
  const fame = estimatedFamePerUnit(tier, enchant);
  return Math.max(1, Math.ceil(capacity / fame));
}

/**
 * Custo líquido de diário por unidade produzida: custo do diário vazio dividido pelo
 * número de itens necessários para enchê-lo, menos a receita do diário cheio (rateada).
 * Pode ser negativo (ganho líquido) quando o diário cheio vale mais que o vazio.
 */
export function journalNetCostPerUnit(
  journalEmptyCost: number,
  journalFullRevenue: number,
  capacity: number,
  tier: Tier,
  enchant: Enchant,
): { costPerUnit: number; itemsPerJournal: number } {
  const itemsPerJournal = itemsToFillJournal(capacity, tier, enchant);
  const costPerUnit = (journalEmptyCost - journalFullRevenue) / itemsPerJournal;
  return { costPerUnit, itemsPerJournal };
}
