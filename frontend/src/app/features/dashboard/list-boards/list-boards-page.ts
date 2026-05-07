import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { NavBarService } from '../../../core/layout/nav-bar/nav-bar-service';
import { Router } from '@angular/router';
import { EditBoardModal } from '../edit-board/edit-board';

interface Board {
  id: number;
  title: string;
}

@Component({
  selector: 'app-boards-page',
  imports: [EditBoardModal],
  templateUrl: './list-boards-page.html',
  styleUrl: './list-boards-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardsPage {
  boards = signal<Board[]>([{ id: 1, title: 'Board 1' }]);
  private nextId = 2;

  isEditModalOpen = signal(false);
  editingBoardId = signal<number | null>(null);

  editingBoard = computed(() => {
    const id = this.editingBoardId();
    if (id === null) return null;
    return this.boards().find((b) => b.id === id) || null;
  });

  openEditModal(board: Board) {
    this.editingBoardId.set(board.id);
    this.isEditModalOpen.set(true);
  }

  openCreateModal() {
    this.editingBoardId.set(null);
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
    this.editingBoardId.set(null);
  }

  handleSaveBoard(boardData: { title: string; description: string }) {
    const idToEdit = this.editingBoardId();
    if (idToEdit !== null) {
      // Edit existing
      this.boards.update((boards) =>
        boards.map((b) => (b.id === idToEdit ? { ...b, title: boardData.title } : b)),
      );
    } else {
      // Create new
      this.boards.update((boards) => [...boards, { id: this.nextId, title: boardData.title }]);
      this.nextId++;
    }
    this.closeEditModal();
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
