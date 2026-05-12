import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthLayout } from '@core/layout/auth-layout/auth-layout';
import { AuthService } from '@core/auth/auth-service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-login-page',
  imports: [AuthLayout, ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Initialize the login form
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  /**
   * Handles the login process
   */
  async login(): Promise<void> {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.getRawValue();

      try {
        // Call the login method from AuthService
        const isSignedIn = await this.authService.login(email!, password!);

        if (isSignedIn) {
          console.log('Login successful! Welcome.');

          // Redirect the user to the main app dashboard/todos page
          // Change '/dashboard' to whatever your main route is
          await this.router.navigate(['/dashboard']);
        }
      } catch (error: unknown) {
        console.error('Login failed:', error);

        let errorMessage = 'Login failed. Please check your credentials and try again.';

        if (error instanceof Error) {
          // Provide more specific feedback if possible
          if (error.name === 'UserNotFoundException' || error.name === 'NotAuthorizedException') {
            errorMessage = 'Incorrect email or password.';
          } else if (error.name === 'UserNotConfirmedException') {
            errorMessage = 'Your account is not confirmed. Please verify your email first.';
            // Optional: Redirect them to the confirm page automatically
            // this.router.navigate(['/auth/confirm'], { queryParams: { email: email } });
          } else {
            errorMessage = error.message;
          }
        }

        alert(errorMessage);
      }
    } else {
      // Show validation errors
      this.loginForm.markAllAsTouched();
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
    const scope = encodeURIComponent('email openid profile');

    // Build the URL for the Cognito hosted UI with Microsoft as the identity provider
    const microsoftUrl = `${domain}/oauth2/authorize?identity_provider=Microsoft&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&client_id=${clientId}&scope=${scope}`;

    window.location.href = microsoftUrl;
  }
}
