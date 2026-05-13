import { Component, input } from '@angular/core';
import { Card } from '@core/models/board-model';

@Component({
  selector: 'app-task',
  imports: [],
  templateUrl: './task.html',
  styleUrl: './task.css',
})
export class Task {
  card = input.required<Card>();
}
