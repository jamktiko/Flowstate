import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NavBarService } from './nav-bar-service';
import { AuthService } from '../../auth/auth-service';

@Component({
  selector: 'app-nav-bar',
  imports: [],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css',
})
export class NavBar {
  protected navBarService: NavBarService = inject(NavBarService);
  private location = inject(Location);
  private authService = inject(AuthService);

  handleBack() {
    const customAction = this.navBarService.customBackAction();
    if (customAction) {
      customAction();
    } else {
      this.location.back();
    }
  }

  handleSettings() {
    const customAction = this.navBarService.customSettingsAction();
    if (customAction) {
      customAction();
    }
  }

  async handleLogout() {
    try {
      // Call logout() in authService
      await this.authService.logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
  }
}
