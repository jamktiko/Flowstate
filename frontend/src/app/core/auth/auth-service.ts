import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  async register(email: string, salasana: string, firstName: string, surname: string) {
    try {
      const { nextStep } = await signUp({
        username: email,
        password: salasana,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: surname,
          },
        },
      });
      return nextStep;
    } catch (error) {
      console.error('Error in AuthService.register:', error);
      throw error; // Let the component handle the specific error UI
    }
  }

  // Confirm registration
  async confirmRegistration(email: string, koodi: string) {
    try {
      return await confirmSignUp({
        username: email,
        confirmationCode: koodi,
      });
    } catch (error) {
      console.error('Virhe vahvistuksessa:', error);
      throw error;
    }
  }

  // Login
  async login(email: string, salasana: string) {
    try {
      const { isSignedIn } = await signIn({
        username: email,
        password: salasana,
      });
      return isSignedIn;
    } catch (error) {
      console.error('Virhe kirjautumisessa:', error);
      throw error;
    }
  }

  // Check if a user is currently logged in
  async isAuthenticated(): Promise<boolean> {
    try {
      // Calling getCurrentUser() will throw an error if the user is not authenticated
      const user = await getCurrentUser();
      return !!user; // Returns true if a user object exists
    } catch (error) {
      console.error(error);
      // If it throws an error, there is no active session
      return false;
    }
  }

  // Logout
  async logout() {
    try {
      await signOut();
      // After successfully clearing tokens, kick them back to sign-in or home
      await this.router.navigate(['/']);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  }

  // Get tokens for backend authentication
  async getTokens() {
    const session = await fetchAuthSession();
    return session.tokens;
  }
}
