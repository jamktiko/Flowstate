import { Component } from '@angular/core';
import { Task } from './task/task';

@Component({
  selector: 'app-list',
  imports: [Task],
  templateUrl: './list.html',
  styleUrl: './list.css',
})
export class List {}
