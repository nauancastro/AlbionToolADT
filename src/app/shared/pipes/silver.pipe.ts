import { Pipe, PipeTransform } from '@angular/core';

/** Formata valores de prata no estilo do Albion: 1.2M, 350K, -45. */
@Pipe({ name: 'silver' })
export class SilverPipe implements PipeTransform {
  transform(value: number | null | undefined, withSymbol = true): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';

    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);
    let formatted: string;

    if (abs >= 1_000_000) {
      formatted = `${(abs / 1_000_000).toFixed(2)}M`;
    } else if (abs >= 1_000) {
      formatted = `${(abs / 1_000).toFixed(1)}K`;
    } else {
      formatted = abs.toFixed(0);
    }

    return `${sign}${formatted}${withSymbol ? ' ⁂' : ''}`;
  }
}
