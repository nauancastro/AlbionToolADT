import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'rotas', pathMatch: 'full' },
  {
    path: 'rotas',
    loadComponent: () => import('./features/routes/route-finder.component').then((m) => m.RouteFinderComponent),
    title: 'Smart Route Finder · Albion Profit Radar',
  },
  {
    path: 'carrinho',
    loadComponent: () => import('./features/crafting/bulk-cart.component').then((m) => m.BulkCartComponent),
    title: 'Carrinho de Craft/Refino · Albion Profit Radar',
  },
  {
    path: 'painel',
    loadComponent: () => import('./features/user-panel/user-panel.component').then((m) => m.UserPanelComponent),
    title: 'Painel do Usuário · Albion Profit Radar',
  },
  { path: '**', redirectTo: 'rotas' },
];

