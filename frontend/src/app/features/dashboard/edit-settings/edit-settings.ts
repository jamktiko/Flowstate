import { Component, input, output, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BasicModal } from '@shared/modals/basic-modal/basic-modal';
import { FakeDatabaseService } from '@shared/fake-database/fake-database-service';
import { Board } from '@core/models/board-model';
import { AuthService } from '@core/auth/auth-service';

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
  private authService = inject(AuthService);

  boards: Board[] = [];
  deleteConfirmOpen = false;
  isDeletingAccount = false;
  deleteError: string | null = null;

  settingsForm = this.fb.group({
    notificationsEnabled: [true],
    warningDelayMinutes: [15, [Validators.min(0)]],
    defaultLandingPage: ['dashboard'],
    darkModeEnabled: [false],
  });

  ngOnInit() {
    this.boards = this.db.boards;
  }

  save() {
    console.log('Settings saved', this.settingsForm.value);
    this.closeModal.emit();
  }

  openDeleteConfirm() {
    this.deleteError = null;
    this.deleteConfirmOpen = true;
  }

  closeDeleteConfirm() {
    this.deleteConfirmOpen = false;
    this.deleteError = null;
  }

  async deleteAccount() {
    this.isDeletingAccount = true;
    this.deleteError = null;

    try {
      await this.authService.deleteAccount();
      this.deleteConfirmOpen = false;
      this.closeModal.emit();
      await this.authService.logout();
    } catch (error) {
      console.error('Account deletion failed:', error);
      this.deleteError = 'Could not delete the account. Please try again.';
    } finally {
      this.isDeletingAccount = false;
    }
  }
}
