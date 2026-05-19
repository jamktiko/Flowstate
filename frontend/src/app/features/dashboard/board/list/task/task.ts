import { Component, input, output, signal, HostListener, ElementRef, inject } from '@angular/core';
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
  private elementRef = inject(ElementRef);

  card = input.required<Card>();
  boardId = input.required<string>();
  colId = input.required<string>();
  taskUpdated = output<Card>();
  taskDeleted = output<Card>();

  isMenuOpen = signal(false);
  isEditModalOpen = signal(false);
  isDetailOpen = signal(false);

  menuTop = signal<number>(0);
  menuRight = signal<number>(0);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // If the click is outside this component, close the menu
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isMenuOpen()) {
        this.isMenuOpen.set(false);
      }
    }
  }

  openDetail() {
    this.isDetailOpen.set(true);
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    if (!this.isMenuOpen()) {
      const buttonRect = (event.target as HTMLElement).getBoundingClientRect();
      this.menuTop.set(buttonRect.bottom + 4);
      this.menuRight.set(window.innerWidth - buttonRect.right);
      this.isMenuOpen.set(true);
    } else {
      this.isMenuOpen.set(false);
    }
  }

  editTask(event: Event) {
    event.stopPropagation();
    this.isMenuOpen.set(false);
    this.isEditModalOpen.set(true);
  }

  deleteTask(event: Event) {
    event.stopPropagation();
    this.isMenuOpen.set(false);
    this.taskDeleted.emit(this.card());
  }

  onTaskSaved(updatedCard: Card) {
    this.isEditModalOpen.set(false);
    this.taskUpdated.emit(updatedCard);
  }
}
