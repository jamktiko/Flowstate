import { Component } from '@angular/core';
import { NavBar } from "../nav-bar/nav-bar";
import { RouterOutlet } from "../../../../../node_modules/@angular/router/types/_router_module-chunk";

@Component({
  selector: 'app-page-layout',
  imports: [NavBar, RouterOutlet],
  templateUrl: './page-layout.html',
  styleUrl: './page-layout.css',
})
export class PageLayout {}
