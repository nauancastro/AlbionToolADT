import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Indicador visual de que a cotação usada pode estar desatualizada (>24h sem negociação). */
@Component({
  selector: 'app-stale-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (stale()) {
      <span
        class="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400"
        title="Cotação sem atualização nas últimas 24h — use com cautela"
      >
        ⚠ desatualizado
      </span>
    }
  `,
})
export class StaleBadgeComponent {
  stale = input(false);
}
