import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NavBarService {
  // Signal to control if the back button is visible
  readonly showBackButton = signal(true);

  // Signal to hold a custom action for the back button
  readonly customBackAction = signal<(() => void) | null>(null);

  // Signal for the log out button
  readonly showLogoutButton = signal(false);

  // Helper to reset to defaults
  reset() {
    this.showBackButton.set(true);
    this.customBackAction.set(null);
    this.showLogoutButton.set(false);
  }
}
