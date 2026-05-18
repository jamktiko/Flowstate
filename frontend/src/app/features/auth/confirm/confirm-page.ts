import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthLayout } from '@core/layout/auth-layout/auth-layout';
import { AuthService } from '@core/auth/auth-service';

//comment to launch frontend deployment pipeline again
@Component({
  selector: 'app-confirm-page',
  imports: [AuthLayout, ReactiveFormsModule, NgIf],
  templateUrl: './confirm-page.html',
  styleUrl: './confirm-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  // FIXED: Removed ': string' because TypeScript already knows it's a string (Trivial inference)
  email = '';
  isSubmitting = signal(false);
  isSuccess = signal(false);
  statusMessage = signal('');
  errorMessage = signal('');

  confirmForm = this.fb.group({
    // Validation for a 6-digit Cognito code
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  ngOnInit(): void {
    // Get the email from the URL query parameters
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    this.destroyRef.onDestroy(() => this.clearRedirectTimer());
  }

  ngOnDestroy(): void {
    this.clearRedirectTimer();
  }

  async onConfirm(): Promise<void> {
    if (!this.confirmForm.valid || !this.email) {
      return;
    }

    const { code } = this.confirmForm.getRawValue();

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.confirmRegistration(this.email, code!);
      this.isSuccess.set(true);
      this.statusMessage.set('Account verified. Redirecting you to login...');
      this.confirmForm.disable();

      this.clearRedirectTimer();
      this.redirectTimer = setTimeout(() => {
        void this.router.navigate(['/auth/login'], {
          queryParams: { confirmed: 'true', email: this.email },
        });
      }, 1400);
    } catch (error: unknown) {
      console.error('Verification failed:', error);
      const msg = error instanceof Error ? error.message : 'Invalid code. Please try again.';
      this.errorMessage.set(msg);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private clearRedirectTimer(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
  }
}
