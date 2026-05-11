import { Component, input, output, inject } from '@angular/core';
import { BasicModal } from '@shared/modals/basic-modal/basic-modal';
import { FakeDatabaseService } from '@shared/fake-database/fake-database-service';

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

  private db = inject(FakeDatabaseService);

  deleteBoard() {
    // Delete board from FakeDatabaseService
    this.db.boards = this.db.boards.filter((b) => b._id !== this.boardId());
    console.log(`Deleted board ${this.boardId()}`);

    this.boardDeleted.emit(this.boardId());
    this.closeModal.emit();
  }
}
