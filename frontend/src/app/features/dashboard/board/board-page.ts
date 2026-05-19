import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { List } from './list/list';
import { TaskModal } from '@shared/modals/task-modal/task-modal';
import { ActivatedRoute } from '@angular/router';
import { BoardService } from '@core/services/board-service';
import { Board, Card } from '@core/models/board-model';

@Component({
  selector: 'app-board-page',
  imports: [List, TaskModal, FormsModule],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
})
export class BoardPage implements OnInit {
  isCreateTaskModalOpen = signal(false);
  board = signal<Board | null>(null);

  isAddingList = signal(false);
  newListName = signal('');

  private route = inject(ActivatedRoute);
  private boardService = inject(BoardService);

  ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id');
      if (id) {
        try {
          const foundBoard = await this.boardService.getBoardById(id);
          this.board.set(foundBoard);
        } catch (error) {
          console.error('Error fetching board:', error);
          this.board.set(null);
        }
      }
    });
  }

  async addNewList() {
    const listName = this.newListName().trim();
    const currentBoard = this.board();

    if (listName && currentBoard) {
      try {
        const payload = {
          id: Math.random().toString(36).substring(2, 9),
          name: listName,
          order: currentBoard.columns.length,
        };
        const updatedBoard = await this.boardService.addColumn(currentBoard._id, payload);
        this.board.set(updatedBoard);
        this.newListName.set('');
        this.isAddingList.set(false);
      } catch (error) {
        console.error('Error adding new list:', error);
      }
    }
  }

  cancelAddingList() {
    this.isAddingList.set(false);
    this.newListName.set('');
  }

  openCreateTaskModal() {
    this.isCreateTaskModalOpen.set(true);
  }

  closeCreateTaskModal() {
    this.isCreateTaskModalOpen.set(false);
  }

  async onCardMoved(event: {
    dropData: { card: Card; sourceColumnId: string };
    dropColumnId: string;
  }) {
    const { dropData, dropColumnId } = event;
    const { card, sourceColumnId } = dropData;
    const currentBoard = this.board();

    if (!currentBoard || sourceColumnId === dropColumnId) return;

    try {
      // Create a deep copy of the board to not mutate state directly if possible,
      // but modifying columns array is fine for sending an update
      const updatedColumns = [...currentBoard.columns];

      const sourceColIdx = updatedColumns.findIndex((c) => c.id === sourceColumnId);
      const targetColIdx = updatedColumns.findIndex((c) => c.id === dropColumnId);

      if (sourceColIdx !== -1 && targetColIdx !== -1) {
        // Clone columns so their references change and trigger Angular UI updates correctly
        const sourceCol = {
          ...updatedColumns[sourceColIdx],
          cards: updatedColumns[sourceColIdx].cards.filter((c) => c._id !== card._id),
        };
        const targetCol = {
          ...updatedColumns[targetColIdx],
          cards: [...updatedColumns[targetColIdx].cards, card],
        };

        updatedColumns[sourceColIdx] = sourceCol;
        updatedColumns[targetColIdx] = targetCol;

        const newOrder = targetCol.cards.length - 1;

        // Optimistically update the UI with fresh references
        this.board.set({ ...currentBoard, columns: updatedColumns });

        try {
          // Update Backend
          const verifiedBoard = await this.boardService.moveCard(
            currentBoard._id,
            card._id,
            sourceColumnId,
            dropColumnId,
            newOrder,
          );
          this.board.set(verifiedBoard);
        } catch (backendError) {
          console.error('Failed to move card in background, reverting...', backendError);
          // Revert optimistic update
          const rollBackBoard = await this.boardService.getBoardById(currentBoard._id);
          this.board.set(rollBackBoard);
        }
      }
    } catch (error) {
      console.error('Unexpected error parsing card drop:', error);
    }
  }

  async handleSaveTask(taskData: Card) {
    const currentBoard = this.board();
    if (!currentBoard) return;

    // Find the 'To Do' column or fallback to the first column
    const todoColumn =
      currentBoard.columns.find((c) => c.name === 'To Do') || currentBoard.columns[0];

    if (todoColumn) {
      try {
        const payload: Partial<Card> = {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority as 'low' | 'medium' | 'high',
          order: todoColumn.cards.length,
          tags: taskData.tags || [],
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        };

        const updatedBoard = await this.boardService.addCard(
          currentBoard._id,
          todoColumn.id,
          payload,
        );
        this.board.set(updatedBoard);
      } catch (error) {
        console.error('Error adding new task:', error);
      }
    }

    this.closeCreateTaskModal();
  }

  async handleUpdateTask(updatedCard: Card, columnId: string) {
    const currentBoard = this.board();
    if (!currentBoard) return;

    const updatedColumns = currentBoard.columns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          cards: col.cards.map((card) => (card._id === updatedCard._id ? updatedCard : card)),
        };
      }
      return col;
    });

    try {
      // Optimistically update the UI to feel instant
      const objParams = { ...currentBoard, columns: updatedColumns };
      this.board.set(objParams);

      // Persist the specific task change to the database
      const returnedBoard = await this.boardService.updateCard(
        currentBoard._id,
        columnId,
        updatedCard._id,
        {
          title: updatedCard.title,
          description: updatedCard.description,
          priority: updatedCard.priority,
          tags: updatedCard.tags,
          dueDate: updatedCard.dueDate,
        },
      );

      this.board.set(returnedBoard);
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert if error occurs
      this.board.set(currentBoard);
    }
  }

  async handleDeleteTask(deletedCard: Card, columnId: string) {
    const currentBoard = this.board();
    if (!currentBoard) return;

    try {
      // Optimitically update UI
      const updatedColumns = currentBoard.columns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            cards: col.cards.filter((card) => card._id !== deletedCard._id),
          };
        }
        return col;
      });
      this.board.set({ ...currentBoard, columns: updatedColumns });

      const returnedBoard = await this.boardService.deleteCard(
        currentBoard._id,
        columnId,
        deletedCard._id,
      );
      this.board.set(returnedBoard);
    } catch (error) {
      console.error('Error deleting task:', error);
      this.board.set(currentBoard);
    }
  }
}
