import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../core/services/cart.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <a routerLink="/rotas" class="flex items-center gap-2 shrink-0">
          <span class="text-xl">⚔️</span>
          <span class="font-bold tracking-tight text-slate-100">
            Albion <span class="text-amber-400">Profit Radar</span>
          </span>
        </a>

        <nav class="flex items-center gap-1 rounded-lg bg-slate-900 p-1 text-sm">
          <a
            routerLink="/rotas"
            routerLinkActive="bg-amber-500 text-slate-950"
            class="rounded-md px-3 py-1.5 font-medium text-slate-300 transition hover:text-white"
          >
            Smart Route Finder
          </a>
          <a
            routerLink="/carrinho"
            routerLinkActive="bg-amber-500 text-slate-950"
            class="relative rounded-md px-3 py-1.5 font-medium text-slate-300 transition hover:text-white"
          >
            Carrinho
            @if (cart.count() > 0) {
              <span
                class="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-slate-950"
              >
                {{ cart.count() }}
              </span>
            }
          </a>
          <a
            routerLink="/painel"
            routerLinkActive="bg-amber-500 text-slate-950"
            class="rounded-md px-3 py-1.5 font-medium text-slate-300 transition hover:text-white"
          >
            Painel do Usuário
          </a>
        </nav>
      </div>
    </header>
  `,
})
export class NavBarComponent {
  protected readonly cart = inject(CartService);
}
