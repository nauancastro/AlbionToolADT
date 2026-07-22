import { Injectable, inject } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { findGearItem, findJournalItem, findRefinedItem, journalFullId } from '../data/items.data';
import { CRAFT_TIER_SCALING, getCraftingRecipe } from '../data/recipes.data';
import { City, GEAR_BONUS_CITY, GEAR_PRIMARY_RESOURCE } from '../models/enums';
import { CraftCartItem } from '../models/cart.model';
import { CraftingResult } from '../models/calculation.model';
import { MarketQuote } from '../models/market.model';
import { MarketDataService } from './market-data.service';
import { UserSettingsService } from './user-settings.service';
import { calculateRrr, focusCostPerUnit, materialsConsumed } from './rrr.util';
import { itemsToFillJournal } from './journal.util';

function quoteForCity(quotes: MarketQuote[] | undefined, city: City): MarketQuote | undefined {
  return quotes?.find((q) => q.city === city);
}

@Injectable({ providedIn: 'root' })
export class CraftingCalculatorService {
  private readonly market = inject(MarketDataService);
  private readonly settingsService = inject(UserSettingsService);

  calculateCart(items: CraftCartItem[]): Observable<CraftingResult[]> {
    if (items.length === 0) return of([]);

    const settings = this.settingsService.settings();
    const itemIds = new Set<string>();

    for (const cartItem of items) {
      const recipe = getCraftingRecipe(cartItem.category);
      for (const material of recipe.materials) {
        itemIds.add(findRefinedItem(material.resourceType, cartItem.tier, cartItem.enchant).id);
      }
      itemIds.add(findGearItem(cartItem.category, cartItem.tier, cartItem.enchant).id);
      if (cartItem.useJournals) {
        const journal = findJournalItem(GEAR_PRIMARY_RESOURCE[cartItem.category], cartItem.tier);
        if (journal) {
          itemIds.add(journal.id);
          itemIds.add(journalFullId(journal.id));
        }
      }
    }

    return this.market.getPrices(Array.from(itemIds), settings.server).pipe(
      map((priceMap) => items.map((cartItem) => this.calculateOne(cartItem, priceMap))),
    );
  }

  private calculateOne(cartItem: CraftCartItem, priceMap: Map<string, MarketQuote[]>): CraftingResult {
    const settings = this.settingsService.settings();
    const recipe = getCraftingRecipe(cartItem.category);
    const primaryResource = GEAR_PRIMARY_RESOURCE[cartItem.category];
    const tierScale = CRAFT_TIER_SCALING[cartItem.tier];

    const isBonusCity = GEAR_BONUS_CITY[cartItem.category] === cartItem.craftCity;
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
      const refinedItem = findRefinedItem(material.resourceType, cartItem.tier, cartItem.enchant);
      const quote = quoteForCity(priceMap.get(refinedItem.id), cartItem.buyCity);
      const unitCost = quote?.sellPriceMin ?? 0;
      if (quote?.isStale || !quote) anyStale = true;

      const baseQty = material.quantity * tierScale;
      const consumedNoFocus = materialsConsumed(baseQty, rrr.returnRateNoFocus);
      const consumedWithFocus = materialsConsumed(baseQty, rrr.returnRateWithFocus);

      materialsCostNoFocus += unitCost * consumedNoFocus * cartItem.quantity;
      materialsCostWithFocus += unitCost * consumedWithFocus * cartItem.quantity;
      totalWeight += baseQty * cartItem.quantity * refinedItem.weight;
    }

    const focusCostTotal =
      focusCostPerUnit(recipe.baseFocusCost, cartItem.tier, cartItem.enchant) * cartItem.quantity;

    let journalEmptyCost = 0;
    let journalFullRevenue = 0;
    let journalItemsPerFill = 0;
    let journalNetCostTotal = 0;

    if (cartItem.useJournals) {
      const journal = findJournalItem(primaryResource, cartItem.tier);
      if (journal) {
        const emptyQuote = quoteForCity(priceMap.get(journal.id), cartItem.buyCity);
        const fullQuote = quoteForCity(priceMap.get(journalFullId(journal.id)), cartItem.localSellCity);
        journalEmptyCost = cartItem.manualJournalEmptyCost ?? emptyQuote?.sellPriceMin ?? 0;
        journalFullRevenue = cartItem.manualJournalFullRevenue ?? fullQuote?.buyPriceMax ?? 0;
        journalItemsPerFill = itemsToFillJournal(journal.capacity, cartItem.tier, cartItem.enchant);
        const netPerUnit = (journalEmptyCost - journalFullRevenue) / journalItemsPerFill;
        journalNetCostTotal = netPerUnit * cartItem.quantity;
      }
    }

    const gearItem = findGearItem(cartItem.category, cartItem.tier, cartItem.enchant);
    const localQuote = quoteForCity(priceMap.get(gearItem.id), cartItem.localSellCity);
    const blackMarketQuote = quoteForCity(priceMap.get(gearItem.id), City.BlackMarket);
    if (localQuote?.isStale || blackMarketQuote?.isStale) anyStale = true;

    const localTax = this.settingsService.effectiveTaxRate(cartItem.localSellCity);
    const blackMarketTax = this.settingsService.effectiveTaxRate(City.BlackMarket);

    const sellPriceLocal = localQuote?.sellPriceMin ?? 0;
    const sellPriceBlackMarket = blackMarketQuote?.buyPriceMax ?? 0;

    const revenueLocalTotal = sellPriceLocal * (1 - localTax / 100) * cartItem.quantity;
    const revenueBlackMarketTotal = sellPriceBlackMarket * (1 - blackMarketTax / 100) * cartItem.quantity;

    const journalAdjustment = cartItem.useJournals ? journalNetCostTotal : 0;

    return {
      category: cartItem.category,
      tier: cartItem.tier,
      enchant: cartItem.enchant,
      quantity: cartItem.quantity,
      materialsCostNoFocus,
      materialsCostWithFocus,
      focusCostTotal,
      useJournals: cartItem.useJournals,
      journalEmptyCost,
      journalFullRevenue,
      journalItemsPerFill,
      journalNetCostTotal,
      localSellCity: cartItem.localSellCity,
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
