import { Component, input, output } from '@angular/core';
import { Task } from './task/task';
import { Column, Card } from '@core/models/board-model';
import { DraggableDirective, DroppableDirective, DropEvent } from 'angular-draggable-droppable';

@Component({
  selector: 'app-list',
  imports: [Task, DraggableDirective, DroppableDirective],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List {
  column = input.required<Column>();
  boardId = input.required<string>();
  listDeleted = output<string>();
  taskUpdated = output<Card>();
  taskDeleted = output<{ card: Card; columnId: string }>();
  cardDropped = output<{
    dropData: { card: Card; sourceColumnId: string };
    dropColumnId: string;
  }>();
  handleDrop(event: DropEvent<{ card: Card; sourceColumnId: string }>) {
    if (event.dropData) {
      this.cardDropped.emit({
        dropData: event.dropData,
        dropColumnId: this.column().id,
      });
    }
  }
}
