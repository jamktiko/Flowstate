import { Component, input, output, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BasicModal } from '@shared/modals/basic-modal/basic-modal';
import { FakeDatabaseService } from '@shared/fake-database/fake-database-service';
import { Board } from '@core/models/board-model';
import { PushNotificationService } from '@core/services/push-notification.service';

@Component({
  selector: 'app-edit-settings',
  imports: [BasicModal, ReactiveFormsModule],
  templateUrl: './edit-settings.html',
  styleUrl: './edit-settings.css',
})
export class EditSettings implements OnInit {
  isOpen = input<boolean>(false);
  closeModal = output<void>();

  private fb = inject(FormBuilder);
  private db = inject(FakeDatabaseService);
  private pushService = inject(PushNotificationService);

  boards: Board[] = [];
  pushSupported = false;

  settingsForm = this.fb.group({
    notificationsEnabled: [false],
    warningDelayMinutes: [15, [Validators.min(0)]],
    defaultLandingPage: ['dashboard'],
    darkModeEnabled: [false],
  });

  async ngOnInit() {
    this.boards = this.db.boards;
    this.pushSupported = this.pushService.isSupported();

    // Set toggle to reflect actual browser subscription state —
    // not just what the form defaults to
    if (this.pushSupported) {
      const hasSubscription = await this.pushService.hasActiveSubscription();
      this.settingsForm.patchValue({ notificationsEnabled: hasSubscription });
    }
  }

  async onNotificationsToggle(enabled: boolean) {
    if (enabled) {
      const success = await this.pushService.enableNotifications();
      // If user denied browser permission, revert the toggle back to OFF
      if (!success) {
        this.settingsForm.patchValue({ notificationsEnabled: false });
      }
    } else {
      await this.pushService.disableNotifications();
    }
  }
  save() {
    console.log('Settings saved', this.settingsForm.value);
    this.closeModal.emit();
  }
}
