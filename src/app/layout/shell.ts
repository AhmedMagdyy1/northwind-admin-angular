import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  template: `
    <mat-sidenav-container class="container">
      <mat-sidenav
        #drawer
        class="sidenav"
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
        [attr.role]="isHandset() ? 'dialog' : 'navigation'"
      >
        <div class="brand">
          <mat-icon class="brand-icon">insights</mat-icon>
          <span>Northwind Ops</span>
        </div>
        <mat-nav-list>
          @for (item of nav(); track item.path) {
            <a
              mat-list-item
              [routerLink]="item.path"
              routerLinkActive
              #rla="routerLinkActive"
              [activated]="rla.isActive"
              (click)="isHandset() && drawer.close()"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="toolbar">
          @if (isHandset()) {
            <button mat-icon-button aria-label="Open menu" (click)="drawer.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="spacer"></span>
          <button
            mat-icon-button
            [matTooltip]="theme.theme() === 'dark' ? 'Light mode' : 'Dark mode'"
            [attr.aria-label]="
              theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            "
            (click)="theme.toggle()"
          >
            <mat-icon>{{ theme.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
          <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <span class="avatar">{{ initials() }}</span>
            <span class="user-name">{{ auth.user()?.name }}</span>
          </button>
          <mat-menu #userMenu="matMenu" xPosition="before">
            <div class="menu-head">
              <strong>{{ auth.user()?.name }}</strong>
              <span class="muted">{{ auth.user()?.email }}</span>
              <span class="role">{{ auth.user()?.role }}</span>
            </div>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign out</span>
            </button>
          </mat-menu>
        </mat-toolbar>
        <main>
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .container {
      height: 100vh;
    }
    .sidenav {
      width: 240px;
      border-right: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 64px;
      padding: 0 20px;
      font: var(--mat-sys-title-medium);
      font-weight: 600;
    }
    .brand-icon {
      color: var(--mat-sys-primary);
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 2;
      background: var(--mat-sys-surface);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      gap: 4px;
    }
    .spacer {
      flex: 1;
    }
    .user-btn {
      display: inline-flex;
      align-items: center;
    }
    .avatar {
      display: inline-grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      font: var(--mat-sys-label-large);
      margin-right: 8px;
    }
    @media (max-width: 600px) {
      .user-name {
        display: none;
      }
    }
    .menu-head {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 12px 16px;
    }
    .role {
      align-self: flex-start;
      margin-top: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      font: var(--mat-sys-label-small);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
  `,
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  private readonly items: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/orders', label: 'Orders', icon: 'receipt_long' },
    { path: '/customers', label: 'Customers', icon: 'group' },
    { path: '/team', label: 'Team', icon: 'admin_panel_settings', adminOnly: true },
  ];

  protected readonly nav = computed(() =>
    this.items.filter((i) => !i.adminOnly || this.auth.isAdmin()),
  );

  protected readonly initials = computed(() =>
    (this.auth.user()?.name ?? '')
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2),
  );

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
