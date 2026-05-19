import { Component, input, output, signal } from '@angular/core';
import { Card } from '@core/models/board-model';
import { EditTask } from './edit-task/edit-task';

@Component({
  selector: 'app-task',
  imports: [EditTask],
  templateUrl: './task.html',
  styleUrl: './task.css',
})
export class Task {
  card = input.required<Card>();
  taskUpdated = output<Card>();
  taskDeleted = output<Card>();

  isMenuOpen = signal(false);
  isEditModalOpen = signal(false);

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
