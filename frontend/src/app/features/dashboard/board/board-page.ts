import { Component } from '@angular/core';
import { List } from './list/list';

@Component({
  selector: 'app-board-page',
  imports: [List],
  templateUrl: './board-page.html',
  styleUrl: './board-page.css',
})
export class BoardPage {}
