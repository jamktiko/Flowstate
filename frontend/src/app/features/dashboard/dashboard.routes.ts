import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    // OPTION 2: Make it a specific sub-page (loads at /dashboard/boards)
    path: '',
    loadComponent: () => import('./boards/boards-page').then((m) => m.BoardsPage),
  },
];
