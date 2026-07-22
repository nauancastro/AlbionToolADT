import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CITY_OPTIONS } from '../../core/data/cities.data';
import { City, ENCHANTS, RESOURCE_LABELS, ResourceType, TIERS } from '../../core/models/enums';
import { RefiningOpportunity } from '../../core/models/calculation.model';
import { createRefineCartItem } from '../../core/models/cart.model';
import { CartService } from '../../core/services/cart.service';
import { RefiningCalculatorService } from '../../core/services/refining-calculator.service';
import { ProfitValueComponent } from '../../shared/components/profit-value/profit-value.component';
import { StaleBadgeComponent } from '../../shared/components/stale-badge/stale-badge.component';
import { SilverPipe } from '../../shared/pipes/silver.pipe';
import { WeightPipe } from '../../shared/pipes/weight.pipe';
import { friendlyHttpError } from '../../shared/http-error.util';

type SaleMode = 'SELL_ORDER' | 'BUY_ORDER';

@Component({
  selector: 'app-route-finder',
  standalone: true,
  imports: [FormsModule, DecimalPipe, ProfitValueComponent, StaleBadgeComponent, SilverPipe, WeightPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <header>
        <h1 class="text-2xl font-bold text-slate-100">Smart Route Finder</h1>
        <p class="mt-1 text-sm text-slate-400">
          Compre bruto em uma cidade, refine em outra. Veja instantaneamente o que vale a pena
          transportar agora, ranqueado por margem de lucro.
        </p>
      </header>

      <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label class="block">
            <span class="mb-1 block text-sm text-slate-300">Comprar bruto em</span>
            <select
              [(ngModel)]="buyCity"
              class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            >
              @for (city of cities; track city) {
                <option [value]="city">{{ city }}</option>
              }
            </select>
          </label>

          <label class="block">
            <span class="mb-1 block text-sm text-slate-300">Refinar e vender em</span>
            <select
              [(ngModel)]="sellCity"
              class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            >
              @for (city of cities; track city) {
                <option [value]="city">{{ city }}</option>
              }
            </select>
          </label>

          <div class="sm:col-span-2 lg:col-span-2">
            <span class="mb-1 block text-sm text-slate-300">Recursos</span>
            <div class="flex flex-wrap gap-2">
              @for (resource of resourceTypes; track resource) {
                <button
                  type="button"
                  (click)="toggleResource(resource)"
                  class="rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                  [class.border-amber-500]="selectedResources().includes(resource)"
                  [class.bg-amber-500]="selectedResources().includes(resource)"
                  [class.text-slate-950]="selectedResources().includes(resource)"
                  [class.border-slate-700]="!selectedResources().includes(resource)"
                  [class.text-slate-300]="!selectedResources().includes(resource)"
                >
                  {{ resourceLabels[resource] }}
                </button>
              }
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            (click)="search()"
            [disabled]="loading() || selectedResources().length === 0"
            class="rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ loading() ? 'Buscando preços…' : '🔎 Buscar Oportunidades' }}
          </button>

          <div class="flex items-center gap-1 rounded-lg bg-slate-900 p-1 text-xs">
            <button
              type="button"
              (click)="saleMode.set('SELL_ORDER')"
              class="rounded-md px-3 py-1.5 font-medium transition"
              [class.bg-slate-700]="saleMode() === 'SELL_ORDER'"
              [class.text-white]="saleMode() === 'SELL_ORDER'"
              [class.text-slate-400]="saleMode() !== 'SELL_ORDER'"
            >
              Venda via Sell Order (demorado)
            </button>
            <button
              type="button"
              (click)="saleMode.set('BUY_ORDER')"
              class="rounded-md px-3 py-1.5 font-medium transition"
              [class.bg-slate-700]="saleMode() === 'BUY_ORDER'"
              [class.text-white]="saleMode() === 'BUY_ORDER'"
              [class.text-slate-400]="saleMode() !== 'BUY_ORDER'"
            >
              Venda via Buy Order (imediato)
            </button>
          </div>

          @if (lastSearched()) {
            <span class="text-xs text-slate-500">Buscado para {{ lastSearched() }}</span>
          }
        </div>
      </section>

      @if (error()) {
        <div class="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          Falha ao buscar preços na Albion Online Data Project API: {{ error() }}
        </div>
      }

      @if (opportunities().length > 0) {
        <section class="overflow-x-auto rounded-xl border border-slate-800">
          <table class="w-full min-w-[900px] text-sm">
            <thead class="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th class="px-3 py-3 text-left">Item</th>
                <th class="px-3 py-3 text-right">Custo Compra</th>
                <th class="px-3 py-3 text-right">Receita Venda</th>
                <th class="px-3 py-3 text-right">RRR sem Foco</th>
                <th class="px-3 py-3 text-right">RRR c/ Foco</th>
                <th class="px-3 py-3 text-right">Lucro sem Foco</th>
                <th class="px-3 py-3 text-right">Lucro c/ Foco</th>
                <th class="px-3 py-3 text-right">Margem c/ Foco</th>
                <th class="px-3 py-3 text-right">Peso/un</th>
                <th class="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              @for (opp of opportunities(); track opp.refinedItemId) {
                <tr class="transition hover:bg-slate-900/60">
                  <td class="px-3 py-3 font-medium text-slate-200">
                    {{ resourceLabels[opp.resourceType] }} T{{ opp.tier }}.{{ opp.enchant }}
                    <app-stale-badge [stale]="opp.isStale" />
                  </td>
                  <td class="px-3 py-3 text-right text-slate-300">{{ opp.rawUnitCost | silver }}</td>
                  <td class="px-3 py-3 text-right text-slate-300">
                    {{ (saleMode() === 'SELL_ORDER' ? opp.sellOrderProfit.revenuePerUnit : opp.buyOrderProfit.revenuePerUnit) | silver }}
                  </td>
                  <td class="px-3 py-3 text-right font-mono text-slate-400">{{ opp.returnRateNoFocus * 100 | number: '1.0-1' }}%</td>
                  <td class="px-3 py-3 text-right font-mono text-amber-400">{{ opp.returnRateWithFocus * 100 | number: '1.0-1' }}%</td>
                  <td class="px-3 py-3 text-right">
                    <app-profit-value
                      [value]="saleMode() === 'SELL_ORDER' ? opp.sellOrderProfit.profitPerUnitNoFocus : opp.buyOrderProfit.profitPerUnitNoFocus"
                    />
                  </td>
                  <td class="px-3 py-3 text-right">
                    <app-profit-value
                      [value]="saleMode() === 'SELL_ORDER' ? opp.sellOrderProfit.profitPerUnitWithFocus : opp.buyOrderProfit.profitPerUnitWithFocus"
                    />
                  </td>
                  <td class="px-3 py-3 text-right font-bold text-emerald-400">
                    {{ (saleMode() === 'SELL_ORDER' ? opp.sellOrderProfit.marginPercentWithFocus : opp.buyOrderProfit.marginPercentWithFocus) | number: '1.0-1' }}%
                  </td>
                  <td class="px-3 py-3 text-right text-slate-400">{{ opp.weightPerUnit | weightKg }}</td>
                  <td class="px-3 py-3 text-right">
                    <button
                      type="button"
                      (click)="addToCart(opp)"
                      class="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-amber-400 transition hover:bg-slate-700"
                    >
                      + Carrinho
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      } @else if (searched() && !loading()) {
        <p class="rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
          Nenhuma oportunidade com cotação disponível para essa combinação agora.
        </p>
      }
    </div>
  `,
})
export class RouteFinderComponent {
  private readonly calculator = inject(RefiningCalculatorService);
  private readonly cart = inject(CartService);

  protected readonly cities = CITY_OPTIONS;
  protected readonly resourceTypes = Object.values(ResourceType);
  protected readonly resourceLabels = RESOURCE_LABELS;

  protected buyCity: City = City.Martlock;
  protected sellCity: City = City.Caerleon;
  protected readonly selectedResources = signal<ResourceType[]>([...this.resourceTypes]);
  protected readonly saleMode = signal<SaleMode>('SELL_ORDER');

  protected readonly loading = signal(false);
  protected readonly searched = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly opportunities = signal<RefiningOpportunity[]>([]);
  protected readonly lastSearched = signal<string | null>(null);

  protected toggleResource(resource: ResourceType): void {
    const current = this.selectedResources();
    this.selectedResources.set(
      current.includes(resource) ? current.filter((r) => r !== resource) : [...current, resource],
    );
  }

  protected search(): void {
    this.loading.set(true);
    this.error.set(null);
    this.searched.set(true);

    this.calculator
      .findOpportunities({
        buyCity: this.buyCity,
        sellCity: this.sellCity,
        resourceTypes: this.selectedResources(),
        tiers: TIERS,
        enchants: ENCHANTS,
      })
      .subscribe({
        next: (opportunities) => {
          this.opportunities.set(opportunities);
          this.lastSearched.set(`${this.buyCity} → ${this.sellCity}`);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(friendlyHttpError(err));
          this.loading.set(false);
        },
      });
  }

  protected addToCart(opp: RefiningOpportunity): void {
    this.cart.add(
      createRefineCartItem({
        resourceType: opp.resourceType,
        tier: opp.tier,
        enchant: opp.enchant,
        buyCity: this.buyCity as City,
        craftCity: this.sellCity as City,
        localSellCity: this.sellCity as City,
      }),
    );
  }
}
