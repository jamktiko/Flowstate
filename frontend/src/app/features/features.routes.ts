import { Routes } from '@angular/router';

export const FEATURES_ROUTES: Routes = [
  { path: 'auth', loadChildren: () => import('./auth/auth.routes').then((m) => m.AUTH_ROUTES) },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
];
