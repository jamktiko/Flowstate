import { Component } from '@angular/core';
import { NavBar } from '../nav-bar/nav-bar';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-page-layout',
  imports: [NavBar, RouterOutlet],
  templateUrl: './page-layout.html',
  styleUrl: './page-layout.css',
})
export class PageLayout {}
