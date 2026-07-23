import { City, GameServer, ResourceType, Tier, TIERS } from './enums';

/**
 * Especialização (Spec) do jogador no refino. No jogo atual a Spec é dividida por TIER: cada
 * tier (T4..T8) de cada linha tem seu próprio nível (0-100). Por isso guardamos um nível por
 * tier dentro de cada linha de recurso.
 */
export type SpecByTier = Record<Tier, number>;
export type SpecLevels = Record<ResourceType, SpecByTier>;

/** Taxa de imposto (%) cobrada pela loja/mercado de cada cidade ao vender via Sell Order/NPC. */
export type CityTaxRates = Record<string, number>;

export interface UserSettings {
  server: GameServer;
  specLevels: SpecLevels;
  /** Taxa de venda padrão (%) por cidade, ex.: 4% sem premium, 2.5% com premium. */
  cityTaxRates: CityTaxRates;
  /** Se o jogador possui status Premium (reduz taxas de mercado). */
  hasPremium: boolean;
  /** Foco diário disponível para consumo nos cálculos. */
  availableFocus: number;
  /** Refinar em estação de ilha pessoal (sem o bônus base de 18% da cidade). */
  islandBonusEnabled: boolean;
  /** Bônus diário do servidor (yield extra temporário divulgado pela Sandbox). */
  dailyServerBonusEnabled: boolean;
  dailyServerBonusPercent: number;
  /** Cidade preferida de venda final (ex.: Black Market). */
  preferredSellCity: City;
}

export const DEFAULT_TAX_RATE = 4;

/** Cria um mapa de Spec por tier zerado (nível 0 em cada tier). */
export function createEmptySpecByTier(): SpecByTier {
  return TIERS.reduce((acc, tier) => {
    acc[tier] = 0;
    return acc;
  }, {} as SpecByTier);
}

/** Cria a estrutura de Spec por linha de recurso, com todos os tiers zerados. */
export function createDefaultSpecLevels(): SpecLevels {
  return {
    [ResourceType.Wood]: createEmptySpecByTier(),
    [ResourceType.Ore]: createEmptySpecByTier(),
    [ResourceType.Fiber]: createEmptySpecByTier(),
    [ResourceType.Hide]: createEmptySpecByTier(),
    [ResourceType.Rock]: createEmptySpecByTier(),
  };
}

/**
 * Normaliza a Spec vinda do armazenamento para o formato por tier. Aceita:
 *  - o formato antigo `Record<ResourceType, number>` (um único nível por linha), replicando
 *    esse nível em todos os tiers;
 *  - o formato novo `Record<ResourceType, Record<Tier, number>>`, preenchendo tiers ausentes.
 */
export function normalizeSpecLevels(raw: unknown): SpecLevels {
  const result = createDefaultSpecLevels();
  if (!raw || typeof raw !== 'object') return result;

  for (const resource of Object.values(ResourceType)) {
    const stored = (raw as Record<string, unknown>)[resource];
    if (typeof stored === 'number') {
      // Formato legado: um único nível por linha -> aplica a todos os tiers.
      const level = clampSpec(stored);
      for (const tier of TIERS) result[resource][tier] = level;
    } else if (stored && typeof stored === 'object') {
      for (const tier of TIERS) {
        const value = (stored as Record<string, unknown>)[tier];
        if (typeof value === 'number') result[resource][tier] = clampSpec(value);
      }
    }
  }

  return result;
}

function clampSpec(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function createDefaultUserSettings(): UserSettings {
  return {
    server: GameServer.Europe,
    specLevels: createDefaultSpecLevels(),
    cityTaxRates: {
      [City.Caerleon]: DEFAULT_TAX_RATE,
      [City.Bridgewatch]: DEFAULT_TAX_RATE,
      [City.Lymhurst]: DEFAULT_TAX_RATE,
      [City.FortSterling]: DEFAULT_TAX_RATE,
      [City.Martlock]: DEFAULT_TAX_RATE,
      [City.Thetford]: DEFAULT_TAX_RATE,
      [City.BlackMarket]: 8,
    },
    hasPremium: false,
    availableFocus: 5000,
    islandBonusEnabled: false,
    dailyServerBonusEnabled: false,
    dailyServerBonusPercent: 10,
    preferredSellCity: City.BlackMarket,
  };
}
