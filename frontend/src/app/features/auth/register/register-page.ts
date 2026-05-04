import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthLayout } from '../../../core/layout/auth-layout/auth-layout';
import { AuthService } from '../../../core/auth/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [AuthLayout, ReactiveFormsModule],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  // Inject dependencies using the modern 'inject' function
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Initialize the form with validation rules
  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    surname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  /**
   * Handles the registration process
   */
  async register(): Promise<void> {
    if (this.registerForm.valid) {
      // Extract values safely from the form
      const { email, password, firstName, surname } = this.registerForm.getRawValue();

      try {
        // Call the AuthService to register the user in AWS Cognito
        // We pass names as well if you want to store them in Cognito attributes
        const nextStep = await this.authService.register(email!, password!, firstName!, surname!);

        console.log('Registration successful, next step:', nextStep);

        // If the user needs to confirm their email (standard Cognito flow)
        if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          // Navigate to the confirmation page, passing the email as a query parameter
          await this.router.navigate(['/auth/confirm'], {
            queryParams: { email: email },
          });
        }
      } catch (error: unknown) {
        // Professional error handling without using 'any'
        console.error('Registration failed:', error);

        let errorMessage = 'An unexpected error occurred during registration.';

        if (error instanceof Error) {
          // If it's a standard JS Error or Amplify Error
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          // If the error is just a string message
          errorMessage = error;
        }

        // Inform the user about the error
        alert(errorMessage);
      }
    } else {
      // Mark all fields as touched to trigger validation messages in the UI
      this.registerForm.markAllAsTouched();
    }
  }
}
