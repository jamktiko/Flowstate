import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { NavBarService } from '@core/layout/nav-bar/nav-bar-service';
import { Router } from '@angular/router';
import { EditBoardModal } from '../edit-board/edit-board';
import { DeleteBoardModal } from '../delete-board/delete-board';
import { FakeDatabaseService } from '@shared/fake-database/fake-database-service';
import { Board } from '@core/models/board.model';

@Component({
  selector: 'app-boards-page',
  imports: [EditBoardModal, DeleteBoardModal],
  templateUrl: './list-boards-page.html',
  styleUrl: './list-boards-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardsPage implements OnInit {
  private db = inject(FakeDatabaseService);

  boards = signal<Board[]>([]);

  isEditModalOpen = signal(false);
  editingBoardId = signal<string | null>(null);

  isDeleteModalOpen = signal(false);
  deletingBoardId = signal<string | null>(null);

  editingBoard = computed(() => {
    const id = this.editingBoardId();
    if (id === null) return null;
    return this.boards().find((b) => b._id === id) || null;
  });

  ngOnInit() {
    this.boards.set(this.db.boards);
  }

  openEditModal(board: Board) {
    this.editingBoardId.set(board._id);
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

  openDeleteModal(board: Board) {
    this.deletingBoardId.set(board._id);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.deletingBoardId.set(null);
  }

  handleSaveBoard(boardData: { title: string; description: string }) {
    const idToEdit = this.editingBoardId();
    if (idToEdit !== null) {
      // Edit existing (updating mock db as well)
      const board = this.db.boards.find((b) => b._id === idToEdit);
      if (board) board.name = boardData.title;
    } else {
      // Create new (updating mock db as well)
      const newBoard: Board = {
        _id: Math.random().toString(36).substring(2, 9),
        userId: 'currentUser',
        name: boardData.title,
        columns: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.db.boards.push(newBoard);
    }

    // Refresh signal with DB data
    this.boards.set([...this.db.boards]);
    this.closeEditModal();
  }

  handleBoardDeleted(deletedId: string) {
    // Refresh the signal array from the db which now excludes the deleted board
    this.boards.set([...this.db.boards]);
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
