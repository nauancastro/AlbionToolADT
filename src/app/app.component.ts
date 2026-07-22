import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavBarComponent } from './layout/nav-bar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavBarComponent],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100">
      <app-nav-bar />
      <main class="mx-auto max-w-7xl px-4 py-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {}
