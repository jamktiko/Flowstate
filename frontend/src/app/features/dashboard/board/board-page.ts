import { Component, signal, inject, OnInit } from '@angular/core';
import { List } from './list/list';
import { TaskModal } from '@shared/modals/task-modal/task-modal';
import { Task } from '@core/models/task-model';
import { ActivatedRoute } from '@angular/router';
import { FakeDatabaseService } from '@shared/fake-database/fake-database-service';
import { Board, Card } from '@core/models/board-model';

@Component({
  selector: 'app-board-page',
  imports: [List, TaskModal],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
})
export class BoardPage implements OnInit {
  isCreateTaskModalOpen = signal(false);
  board = signal<Board | null>(null);

  private route = inject(ActivatedRoute);
  private db = inject(FakeDatabaseService);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        const foundBoard = this.db.boards.find((b) => b._id === id);
        this.board.set(foundBoard || null);
      }
    });
  }

  openCreateTaskModal() {
    this.isCreateTaskModalOpen.set(true);
  }

  closeCreateTaskModal() {
    this.isCreateTaskModalOpen.set(false);
  }

  handleSaveTask(taskData: Task) {
    const currentBoard = this.board();
    if (!currentBoard) return;

    // Find the 'To Do' column or fallback to the first column
    const todoColumn =
      currentBoard.columns.find((c) => c.name === 'To Do') || currentBoard.columns[0];

    if (todoColumn) {
      const newCard: Card = {
        _id: Math.random().toString(36).substring(2, 9),
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority as 'low' | 'medium' | 'high' | 'urgent',
        order: todoColumn.cards.length,
        tags: taskData.tags ? taskData.tags.map((t) => ({ name: t, visible: true })) : [],
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      todoColumn.cards.push(newCard);
      // Trigger update by setting a new reference for the board signal
      this.board.set({ ...currentBoard });
    }

    this.closeCreateTaskModal();
  }
}
