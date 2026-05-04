import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NavBarService {
  // Signal to control if the back button is visible
  readonly showBackButton = signal(true);

  // Signal to hold a custom action for the back button
  readonly customBackAction = signal<(() => void) | null>(null);

  // Helper to reset to defaults
  reset() {
    this.showBackButton.set(true);
    this.customBackAction.set(null);
  }
}
