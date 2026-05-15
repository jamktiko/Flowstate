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
import { Board } from '@core/models/board-model';
import { EditSettings } from '../edit-settings/edit-settings';
import { ViewSelector } from '../view-selector/view-selector';
import { BoardService } from '@core/services/board-service';

@Component({
  selector: 'app-boards-page',
  imports: [EditBoardModal, DeleteBoardModal, EditSettings, ViewSelector],
  templateUrl: './list-boards-page.html',
  styleUrl: './list-boards-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardsPage implements OnInit {
  private boardService = inject(BoardService);

  boards = signal<Board[]>([]);

  isSettingsModalOpen = signal(false);
  isViewSelectorModalOpen = signal(false);

  isEditModalOpen = signal(false);
  editingBoardId = signal<string | null>(null);

  isDeleteModalOpen = signal(false);
  deletingBoardId = signal<string | null>(null);

  editingBoard = computed(() => {
    const id = this.editingBoardId();
    if (id === null) return null;
    return this.boards().find((b) => b._id === id) || null;
  });

  async ngOnInit() {
    try {
      const boards = await this.boardService.getBoards();
      this.boards.set(boards);
    } catch (error) {
      console.error('Error loading boards. Did the session expire?', error);
      // Failsafe: Ensure UI still functions without data returning
      this.boards.set([]);
    }
  }

  // Add the method to handle navigation
  openBoard(boardId: string) {
    this.router.navigate(['/dashboard/board', boardId]);
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

  async handleSaveBoard(boardData: { title: string; description: string }) {
    const idToEdit = this.editingBoardId();
    try {
      if (idToEdit !== null) {
        // Edit existing
        await this.boardService.updateBoard(idToEdit, { name: boardData.title });
      } else {
        // Create new
        await this.boardService.createBoard(boardData.title);
      }

      // Refresh boards
      const boards = await this.boardService.getBoards();
      this.boards.set(boards);
      this.closeEditModal();
    } catch (error) {
      console.error('Error saving board:', error);
    }
  }

  async handleBoardDeleted() {
    try {
      const boards = await this.boardService.getBoards();
      this.boards.set(boards);
    } catch (error) {
      console.error('Error refreshing boards after deletion', error);
    }
  }

  private navBarService: NavBarService = inject(NavBarService);
  private router = inject(Router);

  constructor() {
    // 1. Initialize navbar components when accessing this
    this.navBarService.showBackButton.set(false);
    this.navBarService.showSettingsButton.set(true);
    this.navBarService.customSettingsAction.set(() => {
      this.isSettingsModalOpen.set(true);
    });
    this.navBarService.showLogoutButton.set(true);

    // 2. Reset navbar when you leave the page
    inject(DestroyRef).onDestroy(() => {
      this.navBarService.reset();
    });
  }

  // Delete after checking everything works
  async logDatabase() {
    try {
      const boards = await this.boardService.getBoards();
      console.log('Database returned:', JSON.parse(JSON.stringify(boards)));
    } catch (error) {
      console.error('Failed to log database:', error);
    }
  }
}
