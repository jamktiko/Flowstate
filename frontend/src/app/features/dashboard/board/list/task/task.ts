import { Component, input, signal } from '@angular/core';
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
    console.log('Delete task clicked', this.card());
    // TODO: Delete task
  }

  onTaskSaved(updatedCard: Card) {
    console.log('Task saved:', updatedCard);
    this.isEditModalOpen.set(false);
    // TODO: Emit up to the parent list/board component or call a service to update the card
  }
}
