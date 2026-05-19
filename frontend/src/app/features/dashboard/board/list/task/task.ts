import { Component, input, output, signal } from '@angular/core';
import { Card } from '@core/models/board-model';
import { EditTask } from './edit-task/edit-task';
import { TaskDetail } from './task-detail/task-detail';

@Component({
  selector: 'app-task',
  imports: [EditTask, TaskDetail],
  templateUrl: './task.html',
  styleUrl: './task.css',
})
export class Task {
  card = input.required<Card>();
  boardId = input.required<string>();
  colId = input.required<string>();
  taskUpdated = output<Card>();
  taskDeleted = output<Card>();

  isMenuOpen = signal(false);
  isEditModalOpen = signal(false);
  isDetailOpen = signal(false);

  openDetail() {
    this.isDetailOpen.set(true);
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen.update((open) => !open);
  }

  editTask() {
    this.isMenuOpen.set(false);
    this.isEditModalOpen.set(true);
  }

  deleteTask() {
    this.isMenuOpen.set(false);
    this.taskDeleted.emit(this.card());
  }

  onTaskSaved(updatedCard: Card) {
    this.isEditModalOpen.set(false);
    this.taskUpdated.emit(updatedCard);
  }
}
