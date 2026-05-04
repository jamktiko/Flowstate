import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NavBarService } from './nav-bar-service';

@Component({
  selector: 'app-nav-bar',
  imports: [],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css',
})
export class NavBar {
  protected navBarService: NavBarService = inject(NavBarService);
  private location = inject(Location);

  handleBack() {
    const customAction = this.navBarService.customBackAction();
    if (customAction) {
      customAction();
    } else {
      this.location.back();
    }
  }
}
