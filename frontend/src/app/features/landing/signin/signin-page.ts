import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { NavBarService } from '../../../core/layout/nav-bar/nav-bar.service';

@Component({
  selector: 'app-signin-page',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './signin-page.html',
  styleUrl: './signin-page.css',
})
export class SigninPage implements OnInit, OnDestroy {
  private navBarService = inject(NavBarService);
  private router = inject(Router);

  ngOnInit() {
    // Optionally change NavBar behavior for this specific page
    this.navBarService.showBackButton.set(true);
    this.navBarService.customBackAction.set(() => {
      this.router.navigate(['/']);
    });
  }

  ngOnDestroy() {
    // Reset to defaults when leaving the page
    this.navBarService.reset();
  }
}
