import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CITY_OPTIONS } from '../../core/data/cities.data';
import { City, GameServer, RESOURCE_LABELS, ResourceType, TIERS } from '../../core/models/enums';
import { UserSettingsService } from '../../core/services/user-settings.service';

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 class="text-2xl font-bold text-slate-100">Painel do Usuário</h1>
        <p class="mt-1 text-sm text-slate-400">
          Configure seu personagem uma vez — tudo é salvo localmente no seu navegador
          (LocalStorage) e usado automaticamente em todos os cálculos.
        </p>
      </header>

      <!-- Servidor -->
      <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-400">Servidor Global</h2>
        <div class="flex flex-wrap gap-2">
          @for (server of servers; track server) {
            <button
              type="button"
              (click)="settings.setServer(server)"
              class="rounded-lg border px-4 py-2 text-sm font-medium transition"
              [class.border-amber-500]="settings.settings().server === server"
              [class.bg-amber-500]="settings.settings().server === server"
              [class.text-slate-950]="settings.settings().server === server"
              [class.border-slate-700]="settings.settings().server !== server"
              [class.text-slate-300]="settings.settings().server !== server"
            >
              {{ server }}
            </button>
          }
        </div>
      </section>

      <!-- Spec -->
      <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-amber-400">
          Especialização (Spec) de Refino
        </h2>
        <p class="mb-4 text-xs text-slate-500">
          No jogo atual a Spec é dividida por tier — cada tier (T4–T8) tem seu próprio nível de 0 a 100.
          Ela não altera a taxa de retorno (RRR), mas reduz o custo de Foco (Focus Cost Efficiency):
          nível 100 em todos os tiers reduz o custo de Foco para ~1/16.
        </p>
        <div class="space-y-4">
          @for (resource of resourceTypes; track resource) {
            <div class="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <div class="mb-2 text-sm font-medium text-slate-300">{{ resourceLabels[resource] }}</div>
              <div class="grid grid-cols-5 gap-2">
                @for (tier of tiers; track tier) {
                  <label class="block">
                    <span class="mb-1 block text-center text-[11px] font-mono text-slate-500">T{{ tier }}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      [ngModel]="settings.settings().specLevels[resource][tier]"
                      (ngModelChange)="settings.setSpec(resource, tier, $event)"
                      class="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-center text-sm text-amber-400 focus:border-amber-500 focus:outline-none"
                    />
                  </label>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Foco e bônus -->
      <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-400">Foco e Bônus</h2>
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm text-slate-300">Foco diário disponível</span>
            <input
              type="number"
              min="0"
              [ngModel]="settings.settings().availableFocus"
              (ngModelChange)="settings.setAvailableFocus($event)"
              class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </label>

          <label class="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              [ngModel]="settings.settings().hasPremium"
              (ngModelChange)="settings.setHasPremium($event)"
              class="h-4 w-4 accent-amber-500"
            />
            <span class="text-sm text-slate-300">Status Premium (reduz taxas de mercado pela metade)</span>
          </label>

          <label class="flex items-center gap-3">
            <input
              type="checkbox"
              [ngModel]="settings.settings().islandBonusEnabled"
              (ngModelChange)="settings.setIslandBonusEnabled($event)"
              class="h-4 w-4 accent-amber-500"
            />
            <span class="text-sm text-slate-300">Refinar em Ilha (estação pessoal, sem o bônus base de 18% da cidade)</span>
          </label>

          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              [ngModel]="settings.settings().dailyServerBonusEnabled"
              (ngModelChange)="onDailyBonusToggle($event)"
              class="h-4 w-4 accent-amber-500"
            />
            <span class="text-sm text-slate-300">Bônus Diário do Servidor</span>
            @if (settings.settings().dailyServerBonusEnabled) {
              <input
                type="number"
                min="0"
                max="100"
                [ngModel]="settings.settings().dailyServerBonusPercent"
                (ngModelChange)="onDailyBonusPercent($event)"
                class="w-16 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
              />
              <span class="text-xs text-slate-500">%</span>
            }
          </div>
        </div>
      </section>

      <!-- Taxas de loja -->
      <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-amber-400">Taxas de Loja (Tax)</h2>
        <p class="mb-4 text-xs text-slate-500">Taxa de venda (%) padrão de cada cidade, aplicada sobre o preço de venda.</p>
        <div class="grid gap-3 sm:grid-cols-3">
          @for (city of allTaxableCities; track city) {
            <label class="block">
              <span class="mb-1 block text-sm text-slate-300">{{ city }}</span>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  [ngModel]="settings.settings().cityTaxRates[city]"
                  (ngModelChange)="settings.setCityTax(city, $event)"
                  class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
                />
                <span class="text-xs text-slate-500">%</span>
              </div>
            </label>
          }
        </div>
      </section>

      <!-- Preferências -->
      <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-400">Rota Preferida</h2>
        <label class="block max-w-xs">
          <span class="mb-1 block text-sm text-slate-300">Cidade preferida de venda final</span>
          <select
            [ngModel]="settings.settings().preferredSellCity"
            (ngModelChange)="settings.setPreferredSellCity($event)"
            class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
          >
            @for (city of allMarketCities; track city) {
              <option [value]="city">{{ city }}</option>
            }
          </select>
        </label>
      </section>

      <div class="flex justify-end">
        <button
          type="button"
          (click)="onReset()"
          class="rounded-lg border border-red-900 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950"
        >
          Restaurar configurações padrão
        </button>
      </div>
    </div>
  `,
})
export class UserPanelComponent {
  protected readonly settings = inject(UserSettingsService);

  protected readonly servers = Object.values(GameServer);
  protected readonly resourceTypes = Object.values(ResourceType);
  protected readonly tiers = TIERS;
  protected readonly resourceLabels = RESOURCE_LABELS;
  protected readonly allTaxableCities = CITY_OPTIONS;
  protected readonly allMarketCities = [...CITY_OPTIONS, City.BlackMarket];

  protected onDailyBonusToggle(enabled: boolean): void {
    this.settings.setDailyServerBonus(enabled);
  }

  protected onDailyBonusPercent(percent: number): void {
    this.settings.setDailyServerBonus(true, percent);
  }

  protected onReset(): void {
    if (confirm('Tem certeza que deseja restaurar todas as configurações para o padrão?')) {
      this.settings.resetToDefaults();
    }
  }
}
