import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SilverPipe } from '../../pipes/silver.pipe';

/** Exibe um valor de prata (lucro/custo) colorido em verde (positivo) ou vermelho (negativo). */
@Component({
  selector: 'app-profit-value',
  standalone: true,
  imports: [SilverPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="font-semibold tabular-nums"
      [class.text-emerald-400]="value() > 0"
      [class.text-red-400]="value() < 0"
      [class.text-slate-400]="value() === 0"
    >
      {{ value() | silver }}
    </span>
  `,
})
export class ProfitValueComponent {
  value = input.required<number>();
}
