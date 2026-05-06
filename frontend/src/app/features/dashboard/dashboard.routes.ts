import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    // OPTION 2: Make it a specific sub-page (loads at /dashboard/boards)
    path: '',
    loadComponent: () => import('./listBoards/listBoards-page').then((m) => m.BoardsPage),
  },
  {
    path: 'board',
    loadComponent: () => import('./board/board-page').then((m) => m.BoardPage),
  },
];
