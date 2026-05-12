import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthLayout } from '@core/layout/auth-layout/auth-layout';
import { AuthService, RegisterResult } from '@core/auth/auth-service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

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
  // This method initiates the Google Sign-In flow using AWS Cognito's hosted UI
  signInWithGoogle() {
    const domain = 'https://eu-north-1sfwo3ekis.auth.eu-north-1.amazoncognito.com';
    const clientId = '4obh8krimbm973e83gte5sfgh1';
    const redirectUri = environment.redirectUri;
    const scope = encodeURIComponent('email openid profile');

    // build the URL for the Cognito hosted UI with Google as the identity provider
    const googleUrl = `${domain}/oauth2/authorize?identity_provider=Google&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&client_id=${clientId}&scope=${scope}`;

    window.location.href = googleUrl;
  }

  // Method for Microsoft Sign-In
  signInWithMicrosoft() {
    const domain = 'https://eu-north-1sfwo3ekis.auth.eu-north-1.amazoncognito.com';
    const clientId = '4obh8krimbm973e83gte5sfgh1';
    const redirectUri = environment.redirectUri;
    const scope = encodeURIComponent(
      'openid email profile User.Read Calendars.Read Calendars.ReadWrite',
    );

    // Build the URL for the Cognito hosted UI with Microsoft as the identity provider
    const microsoftUrl = `${domain}/oauth2/authorize?identity_provider=Microsoft&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&client_id=${clientId}&scope=${scope}`;

    window.location.href = microsoftUrl;
  }
}
