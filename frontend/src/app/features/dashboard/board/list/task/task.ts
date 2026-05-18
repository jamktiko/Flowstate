import { Component, input, signal } from '@angular/core';
import { Card } from '@core/models/board-model';

@Component({
  selector: 'app-task',
  imports: [],
  templateUrl: './task.html',
  styleUrl: './task.css',
})
export class Task {
  card = input.required<Card>();

  isMenuOpen = signal(false);

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen.update((open) => !open);
  }

  editTask() {
    this.isMenuOpen.set(false);
    console.log('Edit task clicked', this.card());
    // TODO: Open edit modal
  }

  deleteTask() {
    this.isMenuOpen.set(false);
    console.log('Delete task clicked', this.card());
    // TODO: Delete task
  }
}
