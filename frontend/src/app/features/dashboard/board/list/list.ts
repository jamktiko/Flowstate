import { Component, input } from '@angular/core';
import { Task } from './task/task';
import { Column } from '@core/models/board-model';

@Component({
  selector: 'app-list',
  imports: [Task],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List {
  column = input.required<Column>();
}
