import { Routes } from '@angular/router';
import { WelcomePage } from './features/landing/welcome/welcome-page';
import { PageLayout } from './core/layout/page-layout/page-layout';
import { authGuard } from './core/auth/auth-guard';
import { CalendarLinkResultPage } from './features/calendar-link-result/calendar-link-result-page';

export const routes: Routes = [
  // 1. Pages WITH NO Layout (No Navbar)
  {
    path: '',
    pathMatch: 'full',
    component: WelcomePage,
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/callback/callback').then((m) => m.AuthCallbackComponent),
  },
  {
    path: 'calendar-linked',
    component: CalendarLinkResultPage,
    data: { variant: 'success' },
  },
  {
    path: 'calendar-error',
    component: CalendarLinkResultPage,
    data: { variant: 'error' },
  },
  // 2. Pages WITH Layout (Navbar + children)
  {
    path: '',
    component: PageLayout,
    children: [
      {
        path: 'signin',
        loadComponent: () =>
          import('./features/landing/signin/signin-page').then((m) => m.SigninPage),
      },
      {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
      },
      {
        path: 'dashboard',
        canMatch: [authGuard], // <-- PROTECT THE ROUTE HERE
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
