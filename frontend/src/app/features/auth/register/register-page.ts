import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthLayout } from '@core/layout/auth-layout/auth-layout';
import { AuthService, RegisterResult } from '@core/auth/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-page',
  imports: [AuthLayout, ReactiveFormsModule],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    surname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  async register(): Promise<void> {
    if (this.registerForm.valid) {
      const { email, password, firstName, surname } = this.registerForm.getRawValue();

      try {
        // result on nyt tyypitetty RegisterResult
        const result: RegisterResult = await this.authService.register(
          email!,
          password!,
          firstName!,
          surname!,
        );

        if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
          await this.router.navigate(['/auth/confirm'], {
            queryParams: { email: email },
          });
        }
      } catch (error: unknown) {
        console.error('Registration failed:', error);
        let errorMessage = 'An unexpected error occurred during registration.';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        alert(errorMessage);
      }
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
