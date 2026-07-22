import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CITY_OPTIONS } from '../../core/data/cities.data';
import {
  City,
  ENCHANTS,
  Enchant,
  GEAR_CATEGORY_LABELS,
  GearCategory,
  RESOURCE_LABELS,
  ResourceType,
  Tier,
  TIERS,
} from '../../core/models/enums';
import { CartItem, createCraftCartItem, createRefineCartItem } from '../../core/models/cart.model';
import { BulkResult } from '../../core/models/calculation.model';
import { BulkCalculatorService } from '../../core/services/bulk-calculator.service';
import { CartService } from '../../core/services/cart.service';
import { summarizeWeight } from '../../core/services/weight.util';
import { ProfitValueComponent } from '../../shared/components/profit-value/profit-value.component';
import { StaleBadgeComponent } from '../../shared/components/stale-badge/stale-badge.component';
import { SilverPipe } from '../../shared/pipes/silver.pipe';
import { WeightPipe } from '../../shared/pipes/weight.pipe';
import { friendlyHttpError } from '../../shared/http-error.util';

@Component({
  selector: 'app-bulk-cart',
  standalone: true,
  imports: [FormsModule, ProfitValueComponent, StaleBadgeComponent, SilverPipe, WeightPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <header>
        <h1 class="text-2xl font-bold text-slate-100">Carrinho de Craft/Refino</h1>
        <p class="mt-1 text-sm text-slate-400">
          Monte uma viagem completa: adicione múltiplos refinos e equipamentos, compare
          Foco vs. Sem Foco e Venda Local vs. Black Market, e veja o peso total da carga.
        </p>
      </header>

      <!-- Formulário: adicionar refino -->
      <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-400">Adicionar Refino</h2>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select [(ngModel)]="refineResource" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            @for (r of resourceTypes; track r) {
              <option [value]="r">{{ resourceLabels[r] }}</option>
            }
          </select>
          <select [(ngModel)]="refineTier" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            @for (t of tiers; track t) {
              <option [value]="t">T{{ t }}</option>
            }
          </select>
          <select [(ngModel)]="refineEnchant" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            @for (e of enchants; track e) {
              <option [value]="e">.{{ e }}</option>
            }
          </select>
          <input type="number" min="1" [(ngModel)]="refineQty" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" placeholder="Qtd" />
          <select [(ngModel)]="refineBuyCity" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            @for (c of cities; track c) {
              <option [value]="c">Comprar: {{ c }}</option>
            }
          </select>
          <button
            type="button"
            (click)="addRefine()"
            class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
          >
            + Adicionar
          </button>
        </div>
      </section>

      <!-- Formulário: adicionar equipamento -->
      <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-400">Adicionar Equipamento</h2>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select [(ngModel)]="craftCategory" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            @for (c of gearCategories; track c) {
              <option [value]="c">{{ gearLabels[c] }}</option>
            }
          </select>
          <select [(ngModel)]="craftTier" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            @for (t of tiers; track t) {
              <option [value]="t">T{{ t }}</option>
            }
          </select>
          <select [(ngModel)]="craftEnchant" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            @for (e of enchants; track e) {
              <option [value]="e">.{{ e }}</option>
            }
          </select>
          <input type="number" min="1" [(ngModel)]="craftQty" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm" placeholder="Qtd" />
          <select [(ngModel)]="craftBuyCity" class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
            @for (c of cities; track c) {
              <option [value]="c">Comprar: {{ c }}</option>
            }
          </select>
          <button
            type="button"
            (click)="addCraft()"
            class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
          >
            + Adicionar
          </button>
        </div>
      </section>

      <!-- Itens do carrinho -->
      @if (cart.items().length > 0) {
        <section class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full min-w-[1000px] text-sm">
            <thead class="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th class="px-3 py-3 text-left">Item</th>
                <th class="px-3 py-3 text-center">Qtd</th>
                <th class="px-3 py-3 text-center">Diários</th>
                <th class="px-3 py-3 text-center">Comprar em</th>
                <th class="px-3 py-3 text-center">Craftar em</th>
                <th class="px-3 py-3 text-center">Vender em</th>
                <th class="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              @for (item of cart.items(); track item.id) {
                <tr>
                  <td class="px-3 py-3 font-medium text-slate-200">{{ labelFor(item) }}</td>
                  <td class="px-3 py-3 text-center">
                    <input
                      type="number"
                      min="1"
                      [ngModel]="item.quantity"
                      (ngModelChange)="cart.update(item.id, { quantity: $event })"
                      class="w-16 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-center text-sm"
                    />
                  </td>
                  <td class="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      [ngModel]="item.useJournals"
                      (ngModelChange)="cart.update(item.id, { useJournals: $event })"
                      class="h-4 w-4 accent-amber-500"
                    />
                  </td>
                  <td class="px-3 py-3 text-center">
                    <select
                      [ngModel]="item.buyCity"
                      (ngModelChange)="cart.update(item.id, { buyCity: $event })"
                      class="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
                    >
                      @for (c of cities; track c) { <option [value]="c">{{ c }}</option> }
                    </select>
                  </td>
                  <td class="px-3 py-3 text-center">
                    <select
                      [ngModel]="item.craftCity"
                      (ngModelChange)="cart.update(item.id, { craftCity: $event })"
                      class="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
                    >
                      @for (c of cities; track c) { <option [value]="c">{{ c }}</option> }
                    </select>
                  </td>
                  <td class="px-3 py-3 text-center">
                    <select
                      [ngModel]="item.localSellCity"
                      (ngModelChange)="cart.update(item.id, { localSellCity: $event })"
                      class="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
                    >
                      @for (c of cities; track c) { <option [value]="c">{{ c }}</option> }
                    </select>
                  </td>
                  <td class="px-3 py-3 text-right">
                    <button type="button" (click)="cart.remove(item.id)" class="text-xs font-semibold text-red-400 hover:text-red-300">
                      Remover
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            (click)="calculate()"
            [disabled]="loading()"
            class="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ loading() ? 'Calculando…' : '📊 Calcular Viagem' }}
          </button>
          <button
            type="button"
            (click)="cart.clear(); results.set([])"
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Limpar carrinho
          </button>
        </div>
      } @else {
        <p class="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
          Carrinho vazio. Adicione refinos ou equipamentos acima, ou use o botão
          "+ Carrinho" no Smart Route Finder.
        </p>
      }

      @if (error()) {
        <div class="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {{ error() }}
        </div>
      }

      <!-- Resultados -->
      @if (results().length > 0) {
        <section class="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-5">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-emerald-400">Resumo da Viagem</h2>
            <span class="text-sm text-slate-300">
              Peso total: <span class="font-bold text-amber-400">{{ totalWeight() | weightKg }}</span>
              — <span class="text-slate-400">{{ mountSuggestion() }}</span>
            </span>
          </div>

          <div class="overflow-x-auto rounded-lg border border-slate-800">
            <table class="w-full min-w-[1000px] text-sm">
              <thead class="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th class="px-3 py-3 text-left">Item</th>
                  <th class="px-3 py-3 text-right">Custo Materiais (sem Foco)</th>
                  <th class="px-3 py-3 text-right">Custo Materiais (c/ Foco)</th>
                  <th class="px-3 py-3 text-right">Custo Diários</th>
                  <th class="px-3 py-3 text-right">Lucro Local (sem Foco)</th>
                  <th class="px-3 py-3 text-right">Lucro Local (c/ Foco)</th>
                  <th class="px-3 py-3 text-right">Lucro Black Market (c/ Foco)</th>
                  <th class="px-3 py-3 text-right">Peso</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                @for (r of results(); track r.cartItemId) {
                  <tr>
                    <td class="px-3 py-3 font-medium text-slate-200">
                      {{ r.label }} <span class="text-slate-500">×{{ r.quantity }}</span>
                      <app-stale-badge [stale]="r.isStale" />
                    </td>
                    <td class="px-3 py-3 text-right text-slate-300">{{ r.materialsCostNoFocus | silver }}</td>
                    <td class="px-3 py-3 text-right text-slate-300">{{ r.materialsCostWithFocus | silver }}</td>
                    <td class="px-3 py-3 text-right" [class.text-emerald-400]="r.useJournals && r.journalNetCostTotal < 0" [class.text-slate-500]="!r.useJournals">
                      {{ r.useJournals ? (r.journalNetCostTotal | silver) : '—' }}
                    </td>
                    <td class="px-3 py-3 text-right"><app-profit-value [value]="r.profitLocalNoFocus" /></td>
                    <td class="px-3 py-3 text-right"><app-profit-value [value]="r.profitLocalWithFocus" /></td>
                    <td class="px-3 py-3 text-right"><app-profit-value [value]="r.profitBlackMarketWithFocus" /></td>
                    <td class="px-3 py-3 text-right text-slate-400">{{ r.totalWeight | weightKg }}</td>
                  </tr>
                }
              </tbody>
              <tfoot class="border-t border-slate-700 bg-slate-900/60 font-bold">
                <tr>
                  <td class="px-3 py-3">Total</td>
                  <td class="px-3 py-3 text-right">{{ sum('materialsCostNoFocus') | silver }}</td>
                  <td class="px-3 py-3 text-right">{{ sum('materialsCostWithFocus') | silver }}</td>
                  <td class="px-3 py-3 text-right">{{ sum('journalNetCostTotal') | silver }}</td>
                  <td class="px-3 py-3 text-right"><app-profit-value [value]="sum('profitLocalNoFocus')" /></td>
                  <td class="px-3 py-3 text-right"><app-profit-value [value]="sum('profitLocalWithFocus')" /></td>
                  <td class="px-3 py-3 text-right"><app-profit-value [value]="sum('profitBlackMarketWithFocus')" /></td>
                  <td class="px-3 py-3 text-right">{{ totalWeight() | weightKg }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      }
    </div>
  `,
})
export class BulkCartComponent {
  protected readonly cart = inject(CartService);
  private readonly calculator = inject(BulkCalculatorService);

  protected readonly cities = CITY_OPTIONS;
  protected readonly resourceTypes = Object.values(ResourceType);
  protected readonly resourceLabels = RESOURCE_LABELS;
  protected readonly gearCategories = Object.values(GearCategory);
  protected readonly gearLabels = GEAR_CATEGORY_LABELS;
  protected readonly tiers = TIERS;
  protected readonly enchants = ENCHANTS;

  protected refineResource: ResourceType = ResourceType.Ore;
  protected refineTier: Tier = 4;
  protected refineEnchant: Enchant = 0;
  protected refineQty = 100;
  protected refineBuyCity: City = City.Martlock;

  protected craftCategory: GearCategory = GearCategory.WeaponSword;
  protected craftTier: Tier = 4;
  protected craftEnchant: Enchant = 0;
  protected craftQty = 1;
  protected craftBuyCity: City = City.Caerleon;

  protected readonly loading = signal(false);
  protected readonly results = signal<BulkResult[]>([]);
  protected readonly error = signal<string | null>(null);

  protected addRefine(): void {
    this.cart.add(
      createRefineCartItem({
        resourceType: this.refineResource,
        tier: this.refineTier,
        enchant: this.refineEnchant,
        quantity: Number(this.refineQty) || 1,
        buyCity: this.refineBuyCity,
        craftCity: City.Caerleon,
        localSellCity: City.Caerleon,
      }),
    );
  }

  protected addCraft(): void {
    this.cart.add(
      createCraftCartItem({
        category: this.craftCategory,
        tier: this.craftTier,
        enchant: this.craftEnchant,
        quantity: Number(this.craftQty) || 1,
        buyCity: this.craftBuyCity,
        craftCity: City.Caerleon,
        localSellCity: City.Caerleon,
      }),
    );
  }

  protected labelFor(item: CartItem): string {
    return item.kind === 'REFINE'
      ? `${this.resourceLabels[item.resourceType]} T${item.tier}.${item.enchant}`
      : `${this.gearLabels[item.category]} T${item.tier}.${item.enchant}`;
  }

  protected calculate(): void {
    this.loading.set(true);
    this.error.set(null);
    this.calculator.calculateCart(this.cart.items()).subscribe({
      next: (results) => {
        this.results.set(results);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(friendlyHttpError(err));
        this.loading.set(false);
      },
    });
  }

  protected totalWeight(): number {
    return this.results().reduce((sum, r) => sum + r.totalWeight, 0);
  }

  protected mountSuggestion(): string {
    return summarizeWeight(this.totalWeight()).mountSuggestion;
  }

  protected sum(field: keyof BulkResult): number {
    return this.results().reduce((acc, r) => acc + (Number(r[field]) || 0), 0);
  }
}
