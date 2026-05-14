import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    // OPTION 2: Make it a specific sub-page (loads at /dashboard/boards)
    path: '',
    loadComponent: () => import('./list-boards/list-boards-page').then((m) => m.BoardsPage),
  },
  {
    path: 'board/:id',
    loadComponent: () => import('./board/board-page').then((m) => m.BoardPage),
  },
  {
    path: 'calendar',
    loadComponent: () => import('./calendar/calendar-page').then((m) => m.CalendarPage),
  },
];
