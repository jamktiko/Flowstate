import { Component, input, output, inject, signal } from '@angular/core';
import { BasicModal } from '@shared/modals/basic-modal/basic-modal';
import { BoardService } from '@core/services/board-service';
import { Board } from '@core/models/board-model';

@Component({
  selector: 'app-delete-board',
  imports: [BasicModal],
  templateUrl: './delete-board.html',
  styleUrl: './delete-board.css',
})
export class DeleteBoardModal {
  isOpen = input.required<boolean>();
  boardId = input.required<string>();

  closeModal = output<void>();
  boardDeleted = output<string>();

  private boardService = inject(BoardService);
  boards = signal<Board[]>([]);

  async deleteBoard() {
    try {
      await this.boardService.deleteBoard(this.boardId());
      console.log(`Deleted board ${this.boardId()}`);

      this.boardDeleted.emit(this.boardId());
      this.closeModal.emit();
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  }
}
