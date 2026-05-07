import { Component, DestroyRef, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { NavBarService } from '@core/layout/nav-bar/nav-bar-service';

// Comment to launch frontend deployment pipeline

@Component({
  selector: 'app-signin-page',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './signin-page.html',
  styleUrl: './signin-page.css',
})
export class SigninPage {
  private navBarService: NavBarService = inject(NavBarService);
  private router = inject(Router);

  constructor() {
    // 1. Initialize navbar components when accessing this
    this.navBarService.showBackButton.set(true);
    this.navBarService.customBackAction.set(() => {
      this.router.navigate(['/']);
    });

    // 2. Reset navbar when you leave the page
    inject(DestroyRef).onDestroy(() => {
      this.navBarService.reset();
    });
  }
}
