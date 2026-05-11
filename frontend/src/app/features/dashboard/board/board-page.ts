import { Component, signal } from '@angular/core';
import { List } from './list/list';
import { TaskModal } from '@shared/modals/task-modal/task-modal';
import { Task } from '@core/models/task.model';

@Component({
  selector: 'app-board-page',
  imports: [List, TaskModal],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
})
export class BoardPage {
  isCreateTaskModalOpen = signal(false);

  openCreateTaskModal() {
    this.isCreateTaskModalOpen.set(true);
  }

  closeCreateTaskModal() {
    this.isCreateTaskModalOpen.set(false);
  }

  handleSaveTask(taskData: Task) {
    console.log('Task saved:', taskData);
    this.closeCreateTaskModal();
  }
}
