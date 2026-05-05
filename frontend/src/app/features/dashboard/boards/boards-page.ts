import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface Board {
  id: number;
  title: string;
}

@Component({
  selector: 'app-boards-page',
  imports: [],
  templateUrl: './boards-page.html',
  styleUrl: './boards-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardsPage {
  boards = signal<Board[]>([{ id: 1, title: 'Board 1' }]);
  private nextId = 2;

  addBoard() {
    this.boards.update(boards => [...boards, { id: this.nextId, title: `Board ${this.nextId}` }]);
    this.nextId++;
  }

  deleteBoard(id: number) {
    this.boards.update(boards => boards.filter(board => board.id !== id));
  }
}
