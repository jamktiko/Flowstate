import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthLayout } from '@core/layout/auth-layout/auth-layout';
import { AuthService } from '@core/auth/auth-service';

//comment to launch frontend deployment pipeline again
@Component({
  selector: 'app-confirm-page',
  imports: [AuthLayout, ReactiveFormsModule],
  templateUrl: './confirm-page.html',
  styleUrl: './confirm-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  // FIXED: Removed ': string' because TypeScript already knows it's a string (Trivial inference)
  email = '';

  confirmForm = this.fb.group({
    // Validation for a 6-digit Cognito code
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  ngOnInit(): void {
    // Get the email from the URL query parameters
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
  }

  async onConfirm(): Promise<void> {
    if (this.confirmForm.valid && this.email) {
      const { code } = this.confirmForm.getRawValue();

      try {
        await this.authService.confirmRegistration(this.email, code!);
        alert('Account verified! Redirecting to login...');
        await this.router.navigate(['/auth/login']);
      } catch (error: unknown) {
        console.error('Verification failed:', error);
        let msg = 'Invalid code. Please try again.';
        if (error instanceof Error) msg = error.message;
        alert(msg);
      }
    }
  }
}
