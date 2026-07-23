import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { findRawItem, findRefinedItem } from '../data/items.data';
import { getRefiningLine } from '../data/recipes.data';
import { City, Enchant, ENCHANTS, REFINING_BONUS_CITY, ResourceType, Tier, TIERS } from '../models/enums';
import { OrderProfit, RefiningOpportunity } from '../models/calculation.model';
import { MarketQuote } from '../models/market.model';
import { UserSettingsService } from './user-settings.service';
import { MarketDataService } from './market-data.service';
import { calculateRrr, focusCostEfficiency, focusCostPerUnit, materialsConsumed } from './rrr.util';

export interface RouteFinderParams {
  buyCity: City;
  sellCity: City;
  resourceTypes: ResourceType[];
  tiers?: Tier[];
  enchants?: Enchant[];
}

function quoteForCity(quotes: MarketQuote[] | undefined, city: City): MarketQuote | undefined {
  return quotes?.find((q) => q.city === city);
}

@Injectable({ providedIn: 'root' })
export class RefiningCalculatorService {
  private readonly market = inject(MarketDataService);
  private readonly settingsService = inject(UserSettingsService);

  findOpportunities(params: RouteFinderParams): Observable<RefiningOpportunity[]> {
    const tiers = params.tiers ?? TIERS;
    const enchants = params.enchants ?? ENCHANTS;
    const settings = this.settingsService.settings();

    const combos = params.resourceTypes.flatMap((resourceType) =>
      tiers.flatMap((tier) => enchants.map((enchant) => ({ resourceType, tier, enchant }))),
    );

    const rawIds = combos.map((c) => findRawItem(c.resourceType, c.tier, c.enchant).id);
    const refinedIds = combos.map((c) => findRefinedItem(c.resourceType, c.tier, c.enchant).id);
    const allIds = Array.from(new Set([...rawIds, ...refinedIds]));

    return this.market.getPrices(allIds, settings.server).pipe(
      map((priceMap) => {
        const opportunities: RefiningOpportunity[] = [];

        for (const combo of combos) {
          const rawItem = findRawItem(combo.resourceType, combo.tier, combo.enchant);
          const refinedItem = findRefinedItem(combo.resourceType, combo.tier, combo.enchant);

          const rawQuote = quoteForCity(priceMap.get(rawItem.id), params.buyCity);
          const refinedQuote = quoteForCity(priceMap.get(refinedItem.id), params.sellCity);

          if (!rawQuote || !refinedQuote) continue;
          if (rawQuote.sellPriceMin <= 0 || (refinedQuote.sellPriceMin <= 0 && refinedQuote.buyPriceMax <= 0)) continue;

          const line = getRefiningLine(combo.resourceType);
          const rawQuantityPerUnit = line.rawPerRefinedByTier[combo.tier];

          const isBonusCity = REFINING_BONUS_CITY[combo.resourceType] === params.sellCity;
          const rrr = calculateRrr({
            isBonusCity,
            islandStation: settings.islandBonusEnabled,
            dailyServerBonusEnabled: settings.dailyServerBonusEnabled,
            dailyServerBonusPercent: settings.dailyServerBonusPercent,
          });
          const fce = focusCostEfficiency(settings.specLevels[combo.resourceType], combo.tier);

          const consumedNoFocus = materialsConsumed(rawQuantityPerUnit, rrr.returnRateNoFocus);
          const consumedWithFocus = materialsConsumed(rawQuantityPerUnit, rrr.returnRateWithFocus);

          const rawUnitCost = rawQuote.sellPriceMin;
          const costPerUnitNoFocus = rawUnitCost * consumedNoFocus;
          const costPerUnitWithFocus = rawUnitCost * consumedWithFocus;

          const taxRate = this.settingsService.effectiveTaxRate(params.sellCity);
          const taxFactor = 1 - taxRate / 100;

          const sellOrderRevenue = refinedQuote.sellPriceMin * taxFactor;
          const buyOrderRevenue = refinedQuote.buyPriceMax * taxFactor;

          const sellOrderProfit: OrderProfit = buildOrderProfit(
            'SELL_ORDER',
            sellOrderRevenue,
            costPerUnitNoFocus,
            costPerUnitWithFocus,
          );
          const buyOrderProfit: OrderProfit = buildOrderProfit(
            'BUY_ORDER',
            buyOrderRevenue,
            costPerUnitNoFocus,
            costPerUnitWithFocus,
          );

          opportunities.push({
            resourceType: combo.resourceType,
            tier: combo.tier,
            enchant: combo.enchant,
            rawItemId: rawItem.id,
            refinedItemId: refinedItem.id,
            buyCity: params.buyCity,
            sellCity: params.sellCity,
            rawUnitCost,
            rawQuantityPerUnit,
            returnRateNoFocus: rrr.returnRateNoFocus,
            returnRateWithFocus: rrr.returnRateWithFocus,
            focusCostPerUnit: focusCostPerUnit(line.baseFocusCost, combo.tier, combo.enchant, fce),
            costPerUnitNoFocus,
            costPerUnitWithFocus,
            taxRate,
            sellOrderProfit,
            buyOrderProfit,
            weightPerUnit: rawQuantityPerUnit * rawItem.weight,
            isStale: rawQuote.isStale || refinedQuote.isStale,
          });
        }

        return opportunities.sort(
          (a, b) => b.sellOrderProfit.marginPercentWithFocus - a.sellOrderProfit.marginPercentWithFocus,
        );
      }),
    );
  }
}

function buildOrderProfit(
  mode: 'SELL_ORDER' | 'BUY_ORDER',
  revenuePerUnit: number,
  costNoFocus: number,
  costWithFocus: number,
): OrderProfit {
  const profitPerUnitNoFocus = revenuePerUnit - costNoFocus;
  const profitPerUnitWithFocus = revenuePerUnit - costWithFocus;
  return {
    mode,
    revenuePerUnit,
    profitPerUnitNoFocus,
    profitPerUnitWithFocus,
    marginPercentNoFocus: costNoFocus > 0 ? (profitPerUnitNoFocus / costNoFocus) * 100 : 0,
    marginPercentWithFocus: costWithFocus > 0 ? (profitPerUnitWithFocus / costWithFocus) * 100 : 0,
  };
}
