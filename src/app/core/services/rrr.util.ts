import { Enchant, Tier, TIERS } from '../models/enums';
import { CRAFT_TIER_SCALING } from '../data/recipes.data';

/**
 * Modelo da Resource Return Rate (RRR) do Albion Online tal como funciona no patch atual.
 *
 * Desde a reformulação do retorno de recursos, a RRR é FIXA por local — depende apenas da
 * estação, da cidade de bônus, do bônus diário e do uso (ou não) de Foco. A Especialização
 * (Spec) NÃO altera mais a RRR: ela concede Focus Cost Efficiency (FCE), que reduz o custo de
 * Foco (ver `focusCostEfficiency`).
 *
 * A RRR é calculada empilhando bônus percentuais e aplicando `bonus / (1 + bonus)`:
 *   - Estação em cidade:        base 18%          -> 0.18 / 1.18 = 15.2%
 *   - Cidade de bônus da linha: +40%              -> 0.58 / 1.58 = 36.7%
 *   - Foco:                     +59% (fixo)       -> cidade bônus + foco = 53.9%
 *   - Estação de ilha:          sem base da cidade -> só o que você empilhar (foco -> ~37%)
 */
export const RETURN_RATE = {
  /** Bônus base de produção de qualquer estação dentro de uma cidade. */
  STATION_BASE: 0.18,
  /** Bônus de refino da cidade especializada na linha (ex.: Minério em Bridgewatch). */
  CITY_BONUS: 0.4,
  /** Bônus fixo de retorno concedido ao gastar Foco no refino. */
  FOCUS_BONUS: 0.59,
  /** Teto de segurança para a RRR total (o jogo nunca chega a 100%). */
  MAX_RRR: 0.9,
};

/**
 * Focus Cost Efficiency (FCE) concedido pela Especialização de refino, que é dividida por tier.
 * Cada nó de especialização (um por tier: T4..T8) contribui:
 *   - UNIQUE: 250 FCE por nível apenas para o SEU tier (25.000 no nível 100).
 *   - MUTUAL: 30 FCE por nível para TODOS os tiers da mesma linha (spillover).
 * Com todos os nós no nível 100: 25.000 (próprio) + 30 * 500 (mútuo) = 40.000 FCE por tier.
 * Cada 10.000 FCE reduz o custo de Foco pela metade.
 */
export const FCE = {
  UNIQUE_PER_LEVEL: 250,
  MUTUAL_PER_LEVEL: 30,
  HALVING_THRESHOLD: 10_000,
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
  isBonusCity: boolean;
  /** Refino em estação de ilha pessoal: não recebe o bônus base de 18% da cidade. */
  islandStation: boolean;
  dailyServerBonusEnabled: boolean;
  dailyServerBonusPercent: number; // 0-100
}

export interface RrrResult {
  returnRateNoFocus: number;
  returnRateWithFocus: number;
}

function rrrFromBonus(totalBonus: number): number {
  const rate = totalBonus / (1 + totalBonus);
  return Math.min(RETURN_RATE.MAX_RRR, Math.max(0, rate));
}

export function calculateRrr(inputs: RrrInputs): RrrResult {
  const stationBase = inputs.islandStation ? 0 : RETURN_RATE.STATION_BASE;
  const cityBonus = inputs.isBonusCity ? RETURN_RATE.CITY_BONUS : 0;
  const dailyBonus = inputs.dailyServerBonusEnabled ? inputs.dailyServerBonusPercent / 100 : 0;

  const baseBonus = stationBase + cityBonus + dailyBonus;

  return {
    returnRateNoFocus: rrrFromBonus(baseBonus),
    returnRateWithFocus: rrrFromBonus(baseBonus + RETURN_RATE.FOCUS_BONUS),
  };
}

/** Quantidade efetivamente consumida após aplicar o RRR sobre a quantidade base. */
export function materialsConsumed(baseQuantity: number, rrr: number): number {
  return baseQuantity * (1 - rrr);
}

/**
 * FCE total ao refinar um dado tier, considerando a Spec por tier daquela linha.
 * @param specByTier níveis de Spec (0-100) de cada tier da linha de refino.
 * @param tier tier que está sendo refinado.
 */
export function focusCostEfficiency(specByTier: Record<Tier, number>, tier: Tier): number {
  const own = FCE.UNIQUE_PER_LEVEL * (specByTier[tier] ?? 0);
  const mutual = FCE.MUTUAL_PER_LEVEL * TIERS.reduce((sum, t) => sum + (specByTier[t] ?? 0), 0);
  return own + mutual;
}

/**
 * Custo de foco (em pontos de foco) por unidade produzida.
 * Escala por tier/encantamento e é reduzido pela Focus Cost Efficiency da Spec:
 * cada 10.000 de FCE divide o custo por 2.
 */
export function focusCostPerUnit(baseFocusCost: number, tier: Tier, enchant: Enchant, fce = 0): number {
  const rawCost = baseFocusCost * CRAFT_TIER_SCALING[tier] * ENCHANT_FOCUS_MULTIPLIER[enchant];
  return rawCost / Math.pow(2, fce / FCE.HALVING_THRESHOLD);
}
