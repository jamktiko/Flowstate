import { Routes } from '@angular/router';
import { WelcomePage } from './features/landing/welcome/welcome-page';

export const routes: Routes = [
  {
    path: '',
    component: WelcomePage,
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
];
