import { City, GameServer, ResourceType } from './enums';

/** Especialização (Spec) do jogador em cada árvore de refino/produção, de 0 a 100. */
export type SpecLevels = Record<ResourceType, number>;

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
  /** Bônus de ilha (construção de refino no nível máximo) ativado. */
  islandBonusEnabled: boolean;
  /** Bônus diário do servidor (yield extra temporário divulgado pela Sandbox). */
  dailyServerBonusEnabled: boolean;
  dailyServerBonusPercent: number;
  /** Cidade preferida de venda final (ex.: Black Market). */
  preferredSellCity: City;
}

export const DEFAULT_TAX_RATE = 4;

export function createDefaultUserSettings(): UserSettings {
  return {
    server: GameServer.Europe,
    specLevels: {
      [ResourceType.Wood]: 0,
      [ResourceType.Ore]: 0,
      [ResourceType.Fiber]: 0,
      [ResourceType.Hide]: 0,
      [ResourceType.Rock]: 0,
    },
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
