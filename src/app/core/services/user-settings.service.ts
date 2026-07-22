import { Injectable, computed, signal } from '@angular/core';
import { City, GameServer, ResourceType } from '../models/enums';
import { UserSettings, createDefaultUserSettings } from '../models/user-settings.model';

const STORAGE_KEY = 'albion-user-settings';

/**
 * Persiste as configurações do jogador (spec, taxas, servidor, foco, bônus) em LocalStorage.
 * Não há backend: tudo roda no navegador do usuário.
 */
@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  private readonly _settings = signal<UserSettings>(this.loadFromStorage());
  readonly settings = this._settings.asReadonly();

  readonly server = computed(() => this._settings().server);
  readonly hasPremium = computed(() => this._settings().hasPremium);

  private loadFromStorage(): UserSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultUserSettings();
      const parsed = JSON.parse(raw) as Partial<UserSettings>;
      return { ...createDefaultUserSettings(), ...parsed };
    } catch {
      return createDefaultUserSettings();
    }
  }

  private persist(next: UserSettings): void {
    this._settings.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  update(patch: Partial<UserSettings>): void {
    this.persist({ ...this._settings(), ...patch });
  }

  setServer(server: GameServer): void {
    this.update({ server });
  }

  setSpec(resourceType: ResourceType, value: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    this.persist({
      ...this._settings(),
      specLevels: { ...this._settings().specLevels, [resourceType]: clamped },
    });
  }

  setCityTax(city: City, value: number): void {
    const clamped = Math.max(0, Math.min(100, value));
    this.persist({
      ...this._settings(),
      cityTaxRates: { ...this._settings().cityTaxRates, [city]: clamped },
    });
  }

  setHasPremium(hasPremium: boolean): void {
    this.update({ hasPremium });
  }

  setAvailableFocus(availableFocus: number): void {
    this.update({ availableFocus: Math.max(0, availableFocus) });
  }

  setIslandBonusEnabled(enabled: boolean): void {
    this.update({ islandBonusEnabled: enabled });
  }

  setDailyServerBonus(enabled: boolean, percent?: number): void {
    this.update({
      dailyServerBonusEnabled: enabled,
      ...(percent !== undefined ? { dailyServerBonusPercent: percent } : {}),
    });
  }

  setPreferredSellCity(city: City): void {
    this.update({ preferredSellCity: city });
  }

  resetToDefaults(): void {
    this.persist(createDefaultUserSettings());
  }

  /** Taxa efetiva de mercado (Premium reduz a taxa de venda pela metade, como no jogo). */
  effectiveTaxRate(city: City): number {
    const base = this._settings().cityTaxRates[city] ?? 4;
    return this._settings().hasPremium ? base / 2 : base;
  }
}
