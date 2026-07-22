import { Enchant, Tier } from '../models/enums';
import { CRAFT_TIER_SCALING } from '../data/recipes.data';

/**
 * Modelo aproximado da Resource Return Rate (RRR) do Albion Online.
 * Os percentuais exatos variam entre patches; os valores abaixo refletem a ordem de
 * grandeza documentada pela comunidade e são ajustáveis nesta única fonte de verdade.
 */
export const RRR_CONSTANTS = {
  /** Bônus de retorno ao refinar/craftar na cidade especializada no recurso. */
  CITY_BONUS: 0.15,
  /** Bônus da construção de ilha (Refinaria/Oficina) no nível máximo. */
  ISLAND_BONUS: 0.18,
  /** Bônus máximo de retorno passivo por Spec (sem gastar Foco), atingido em Spec 100. */
  SPEC_PASSIVE_MAX: 0.15,
  /** Bônus adicional máximo ao usar Foco, atingido em Spec 100. */
  SPEC_FOCUS_MAX: 0.339,
  /** Teto de segurança para o RRR total (jogo nunca ultrapassa ~70-75%). */
  MAX_RRR: 0.75,
};

/** Multiplicador de custo de Foco por nível de encantamento (cada nível ~1.8x mais caro). */
const ENCHANT_FOCUS_MULTIPLIER: Record<Enchant, number> = {
  0: 1,
  1: 1.8,
  2: 3.24,
  3: 5.832,
  4: 10.4976,
};

export interface RrrInputs {
  spec: number; // 0-100
  isBonusCity: boolean;
  islandBonusEnabled: boolean;
  dailyServerBonusEnabled: boolean;
  dailyServerBonusPercent: number; // 0-100
}

export interface RrrResult {
  returnRateNoFocus: number;
  returnRateWithFocus: number;
}

export function calculateRrr(inputs: RrrInputs): RrrResult {
  const cityBonus = inputs.isBonusCity ? RRR_CONSTANTS.CITY_BONUS : 0;
  const islandBonus = inputs.islandBonusEnabled ? RRR_CONSTANTS.ISLAND_BONUS : 0;
  const specRatio = Math.max(0, Math.min(100, inputs.spec)) / 100;
  const specPassive = specRatio * RRR_CONSTANTS.SPEC_PASSIVE_MAX;
  const specFocusExtra = specRatio * RRR_CONSTANTS.SPEC_FOCUS_MAX;
  const dailyBonus = inputs.dailyServerBonusEnabled ? inputs.dailyServerBonusPercent / 100 : 0;

  const noFocus = cityBonus + islandBonus + specPassive + dailyBonus;
  const withFocus = noFocus + specFocusExtra;

  return {
    returnRateNoFocus: Math.min(RRR_CONSTANTS.MAX_RRR, noFocus),
    returnRateWithFocus: Math.min(RRR_CONSTANTS.MAX_RRR, withFocus),
  };
}

/** Quantidade efetivamente consumida após aplicar o RRR sobre a quantidade base. */
export function materialsConsumed(baseQuantity: number, rrr: number): number {
  return baseQuantity * (1 - rrr);
}

/** Custo de foco (em pontos de foco) por unidade produzida, escalando por tier e encantamento. */
export function focusCostPerUnit(baseFocusCost: number, tier: Tier, enchant: Enchant): number {
  return baseFocusCost * CRAFT_TIER_SCALING[tier] * ENCHANT_FOCUS_MULTIPLIER[enchant];
}
