import { Injectable, inject } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import {
  findGearItem,
  findJournalItem,
  findRawItem,
  findRefinedItem,
  journalFullId,
} from '../data/items.data';
import { CRAFT_TIER_SCALING, getCraftingRecipe, getRefiningLine } from '../data/recipes.data';
import {
  City,
  GEAR_BONUS_CITY,
  GEAR_CATEGORY_LABELS,
  GEAR_PRIMARY_RESOURCE,
  REFINED_LABELS,
  REFINED_BY_RESOURCE,
  REFINING_BONUS_CITY,
} from '../models/enums';
import { CartItem, CraftGearCartItem, RefineCartItem } from '../models/cart.model';
import { BulkResult } from '../models/calculation.model';
import { MarketQuote } from '../models/market.model';
import { MarketDataService } from './market-data.service';
import { UserSettingsService } from './user-settings.service';
import { calculateRrr, focusCostPerUnit, materialsConsumed } from './rrr.util';
import { itemsToFillJournal } from './journal.util';

function quoteForCity(quotes: MarketQuote[] | undefined, city: City): MarketQuote | undefined {
  return quotes?.find((q) => q.city === city);
}

/**
 * Calcula lucro/peso para o carrinho bulk de Refino + Crafting, item a item, dentro de uma
 * única viagem: agrega todos os IDs necessários e busca preços em lote (cache-first).
 */
@Injectable({ providedIn: 'root' })
export class BulkCalculatorService {
  private readonly market = inject(MarketDataService);
  private readonly settingsService = inject(UserSettingsService);

  calculateCart(items: CartItem[]): Observable<BulkResult[]> {
    if (items.length === 0) return of([]);

    const settings = this.settingsService.settings();
    const itemIds = new Set<string>();

    for (const item of items) {
      if (item.kind === 'REFINE') {
        itemIds.add(findRawItem(item.resourceType, item.tier, item.enchant).id);
        itemIds.add(findRefinedItem(item.resourceType, item.tier, item.enchant).id);
        if (item.useJournals) this.addJournalIds(itemIds, item.resourceType, item.tier);
      } else {
        const recipe = getCraftingRecipe(item.category);
        for (const material of recipe.materials) {
          itemIds.add(findRefinedItem(material.resourceType, item.tier, item.enchant).id);
        }
        itemIds.add(findGearItem(item.category, item.tier, item.enchant).id);
        if (item.useJournals) this.addJournalIds(itemIds, GEAR_PRIMARY_RESOURCE[item.category], item.tier);
      }
    }

    return this.market.getPrices(Array.from(itemIds), settings.server).pipe(
      map((priceMap) => items.map((item) => (item.kind === 'REFINE' ? this.calcRefine(item, priceMap) : this.calcCraft(item, priceMap)))),
    );
  }

  private addJournalIds(set: Set<string>, resourceType: RefineCartItem['resourceType'], tier: RefineCartItem['tier']): void {
    const journal = findJournalItem(resourceType, tier);
    if (journal) {
      set.add(journal.id);
      set.add(journalFullId(journal.id));
    }
  }

  private journalNetCost(
    useJournals: boolean,
    resourceType: RefineCartItem['resourceType'],
    tier: RefineCartItem['tier'],
    enchant: RefineCartItem['enchant'],
    quantity: number,
    buyCity: City,
    sellCity: City,
    priceMap: Map<string, MarketQuote[]>,
    manualEmpty?: number,
    manualFull?: number,
  ): { journalEmptyCost: number; journalFullRevenue: number; journalItemsPerFill: number; journalNetCostTotal: number } {
    if (!useJournals) return { journalEmptyCost: 0, journalFullRevenue: 0, journalItemsPerFill: 0, journalNetCostTotal: 0 };

    const journal = findJournalItem(resourceType, tier);
    if (!journal) return { journalEmptyCost: 0, journalFullRevenue: 0, journalItemsPerFill: 0, journalNetCostTotal: 0 };

    const emptyQuote = quoteForCity(priceMap.get(journal.id), buyCity);
    const fullQuote = quoteForCity(priceMap.get(journalFullId(journal.id)), sellCity);
    const journalEmptyCost = manualEmpty ?? emptyQuote?.sellPriceMin ?? 0;
    const journalFullRevenue = manualFull ?? fullQuote?.buyPriceMax ?? 0;
    const journalItemsPerFill = itemsToFillJournal(journal.capacity, tier, enchant);
    const netPerUnit = (journalEmptyCost - journalFullRevenue) / journalItemsPerFill;

    return { journalEmptyCost, journalFullRevenue, journalItemsPerFill, journalNetCostTotal: netPerUnit * quantity };
  }

  private calcRefine(item: RefineCartItem, priceMap: Map<string, MarketQuote[]>): BulkResult {
    const settings = this.settingsService.settings();
    const rawItem = findRawItem(item.resourceType, item.tier, item.enchant);
    const refinedItem = findRefinedItem(item.resourceType, item.tier, item.enchant);
    const line = getRefiningLine(item.resourceType);

    const rawQuote = quoteForCity(priceMap.get(rawItem.id), item.buyCity);
    const localQuote = quoteForCity(priceMap.get(refinedItem.id), item.localSellCity);
    const blackMarketQuote = quoteForCity(priceMap.get(refinedItem.id), City.BlackMarket);

    const isBonusCity = REFINING_BONUS_CITY[item.resourceType] === item.craftCity;
    const rrr = calculateRrr({
      spec: settings.specLevels[item.resourceType],
      isBonusCity,
      islandBonusEnabled: settings.islandBonusEnabled,
      dailyServerBonusEnabled: settings.dailyServerBonusEnabled,
      dailyServerBonusPercent: settings.dailyServerBonusPercent,
    });

    const baseQty = line.rawPerRefinedByTier[item.tier];
    const rawUnitCost = rawQuote?.sellPriceMin ?? 0;
    const consumedNoFocus = materialsConsumed(baseQty, rrr.returnRateNoFocus) * item.quantity;
    const consumedWithFocus = materialsConsumed(baseQty, rrr.returnRateWithFocus) * item.quantity;

    const materialsCostNoFocus = rawUnitCost * consumedNoFocus;
    const materialsCostWithFocus = rawUnitCost * consumedWithFocus;
    const focusCostTotal = focusCostPerUnit(line.baseFocusCost, item.tier, item.enchant) * item.quantity;

    const journalInfo = this.journalNetCost(
      item.useJournals,
      item.resourceType,
      item.tier,
      item.enchant,
      item.quantity,
      item.buyCity,
      item.localSellCity,
      priceMap,
      item.manualJournalEmptyCost,
      item.manualJournalFullRevenue,
    );

    const localTax = this.settingsService.effectiveTaxRate(item.localSellCity);
    const blackMarketTax = this.settingsService.effectiveTaxRate(City.BlackMarket);

    const sellPriceLocal = localQuote?.sellPriceMin ?? 0;
    const sellPriceBlackMarket = blackMarketQuote?.buyPriceMax ?? 0;

    const revenueLocalTotal = sellPriceLocal * (1 - localTax / 100) * item.quantity;
    const revenueBlackMarketTotal = sellPriceBlackMarket * (1 - blackMarketTax / 100) * item.quantity;
    const journalAdjustment = journalInfo.journalNetCostTotal;

    return {
      cartItemId: item.id,
      kind: 'REFINE',
      label: `${REFINED_LABELS[REFINED_BY_RESOURCE[item.resourceType]]} T${item.tier}.${item.enchant}`,
      resourceType: item.resourceType,
      tier: item.tier,
      enchant: item.enchant,
      quantity: item.quantity,
      materialsCostNoFocus,
      materialsCostWithFocus,
      focusCostTotal,
      useJournals: item.useJournals,
      ...journalInfo,
      localSellCity: item.localSellCity,
      sellPriceLocal,
      sellPriceBlackMarket,
      revenueLocalTotal,
      revenueBlackMarketTotal,
      taxRate: localTax,
      profitLocalNoFocus: revenueLocalTotal - materialsCostNoFocus - journalAdjustment,
      profitLocalWithFocus: revenueLocalTotal - materialsCostWithFocus - journalAdjustment,
      profitBlackMarketNoFocus: revenueBlackMarketTotal - materialsCostNoFocus - journalAdjustment,
      profitBlackMarketWithFocus: revenueBlackMarketTotal - materialsCostWithFocus - journalAdjustment,
      totalWeight: baseQty * item.quantity * rawItem.weight,
      isStale: Boolean(rawQuote?.isStale || localQuote?.isStale || blackMarketQuote?.isStale || !rawQuote || !localQuote),
    };
  }

  private calcCraft(item: CraftGearCartItem, priceMap: Map<string, MarketQuote[]>): BulkResult {
    const settings = this.settingsService.settings();
    const recipe = getCraftingRecipe(item.category);
    const primaryResource = GEAR_PRIMARY_RESOURCE[item.category];
    const tierScale = CRAFT_TIER_SCALING[item.tier];

    const isBonusCity = GEAR_BONUS_CITY[item.category] === item.craftCity;
    const rrr = calculateRrr({
      spec: settings.specLevels[primaryResource],
      isBonusCity,
      islandBonusEnabled: settings.islandBonusEnabled,
      dailyServerBonusEnabled: settings.dailyServerBonusEnabled,
      dailyServerBonusPercent: settings.dailyServerBonusPercent,
    });

    let materialsCostNoFocus = 0;
    let materialsCostWithFocus = 0;
    let totalWeight = 0;
    let anyStale = false;

    for (const material of recipe.materials) {
      const refinedItem = findRefinedItem(material.resourceType, item.tier, item.enchant);
      const quote = quoteForCity(priceMap.get(refinedItem.id), item.buyCity);
      const unitCost = quote?.sellPriceMin ?? 0;
      if (quote?.isStale || !quote) anyStale = true;

      const baseQty = material.quantity * tierScale;
      materialsCostNoFocus += unitCost * materialsConsumed(baseQty, rrr.returnRateNoFocus) * item.quantity;
      materialsCostWithFocus += unitCost * materialsConsumed(baseQty, rrr.returnRateWithFocus) * item.quantity;
      totalWeight += baseQty * item.quantity * refinedItem.weight;
    }

    const focusCostTotal = focusCostPerUnit(recipe.baseFocusCost, item.tier, item.enchant) * item.quantity;

    const journalInfo = this.journalNetCost(
      item.useJournals,
      primaryResource,
      item.tier,
      item.enchant,
      item.quantity,
      item.buyCity,
      item.localSellCity,
      priceMap,
      item.manualJournalEmptyCost,
      item.manualJournalFullRevenue,
    );

    const gearItem = findGearItem(item.category, item.tier, item.enchant);
    const localQuote = quoteForCity(priceMap.get(gearItem.id), item.localSellCity);
    const blackMarketQuote = quoteForCity(priceMap.get(gearItem.id), City.BlackMarket);
    if (localQuote?.isStale || blackMarketQuote?.isStale) anyStale = true;

    const localTax = this.settingsService.effectiveTaxRate(item.localSellCity);
    const blackMarketTax = this.settingsService.effectiveTaxRate(City.BlackMarket);

    const sellPriceLocal = localQuote?.sellPriceMin ?? 0;
    const sellPriceBlackMarket = blackMarketQuote?.buyPriceMax ?? 0;

    const revenueLocalTotal = sellPriceLocal * (1 - localTax / 100) * item.quantity;
    const revenueBlackMarketTotal = sellPriceBlackMarket * (1 - blackMarketTax / 100) * item.quantity;
    const journalAdjustment = journalInfo.journalNetCostTotal;

    return {
      cartItemId: item.id,
      kind: 'CRAFT',
      label: `${GEAR_CATEGORY_LABELS[item.category]} T${item.tier}.${item.enchant}`,
      category: item.category,
      tier: item.tier,
      enchant: item.enchant,
      quantity: item.quantity,
      materialsCostNoFocus,
      materialsCostWithFocus,
      focusCostTotal,
      useJournals: item.useJournals,
      ...journalInfo,
      localSellCity: item.localSellCity,
      sellPriceLocal,
      sellPriceBlackMarket,
      revenueLocalTotal,
      revenueBlackMarketTotal,
      taxRate: localTax,
      profitLocalNoFocus: revenueLocalTotal - materialsCostNoFocus - journalAdjustment,
      profitLocalWithFocus: revenueLocalTotal - materialsCostWithFocus - journalAdjustment,
      profitBlackMarketNoFocus: revenueBlackMarketTotal - materialsCostNoFocus - journalAdjustment,
      profitBlackMarketWithFocus: revenueBlackMarketTotal - materialsCostWithFocus - journalAdjustment,
      totalWeight,
      isStale: anyStale,
    };
  }
}
