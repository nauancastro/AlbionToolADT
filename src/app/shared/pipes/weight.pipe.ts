import { Pipe, PipeTransform } from '@angular/core';

/** Formata peso em kg, trocando para toneladas acima de 1000kg. */
@Pipe({ name: 'weightKg' })
export class WeightPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    if (value >= 1000) return `${(value / 1000).toFixed(2)} t`;
    return `${value.toFixed(1)} kg`;
  }
}
