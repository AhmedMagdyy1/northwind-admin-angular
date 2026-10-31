import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · Northwind Ops',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard · Northwind Ops',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'orders',
        title: 'Orders · Northwind Ops',
        loadComponent: () => import('./features/orders/orders').then((m) => m.Orders),
      },
      {
        path: 'customers',
        title: 'Customers · Northwind Ops',
        loadComponent: () => import('./features/customers/customers').then((m) => m.Customers),
      },
      {
        path: 'team',
        title: 'Team · Northwind Ops',
        canActivate: [roleGuard('admin')],
        loadComponent: () => import('./features/team/team').then((m) => m.Team),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
