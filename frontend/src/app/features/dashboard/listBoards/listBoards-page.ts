import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NavBarService } from '../../../core/layout/nav-bar/nav-bar-service';
import { Router } from '@angular/router';

interface Board {
  id: number;
  title: string;
}

@Component({
  selector: 'app-boards-page',
  imports: [],
  templateUrl: './listBoards-page.html',
  styleUrl: './listBoards-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardsPage {
  boards = signal<Board[]>([{ id: 1, title: 'Board 1' }]);
  private nextId = 2;

  addBoard() {
    this.boards.update((boards) => [...boards, { id: this.nextId, title: `Board ${this.nextId}` }]);
    this.nextId++;
  }

  deleteBoard(id: number) {
    this.boards.update((boards) => boards.filter((board) => board.id !== id));
  }

  private navBarService: NavBarService = inject(NavBarService);
  private router = inject(Router);

  constructor() {
    // 1. Initialize navbar components when accessing this
    this.navBarService.showBackButton.set(true);
    this.navBarService.showLogoutButton.set(true);
    this.navBarService.customBackAction.set(() => {
      this.router.navigate(['/']);
    });

    // 2. Reset navbar when you leave the page
    inject(DestroyRef).onDestroy(() => {
      this.navBarService.reset();
    });
  }
}
