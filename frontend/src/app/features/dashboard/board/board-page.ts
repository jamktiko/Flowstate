import { Component, signal, inject, OnInit } from '@angular/core';
import { List } from './list/list';
import { TaskModal } from '@shared/modals/task-modal/task-modal';
import { Task } from '@core/models/task.model';
import { ActivatedRoute } from '@angular/router';
import { FakeDatabaseService } from '@shared/fake-database/fake-database-service';
import { Board } from '@core/models/board.model';

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
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        const foundBoard = this.db.boards.find(b => b._id === id);
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
    console.log('Task saved:', taskData);
    this.closeCreateTaskModal();
  }
}
