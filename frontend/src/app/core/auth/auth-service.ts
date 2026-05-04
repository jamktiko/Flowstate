import { Injectable } from '@angular/core';
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  fetchAuthSession,
  type SignUpInput,
  type ConfirmSignUpInput,
  type SignInInput,
} from 'aws-amplify/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
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

  // Logout
  async logout() {
    await signOut();
  }

  // Get tokens for backend authentication
  async getTokens() {
    const session = await fetchAuthSession();
    return session.tokens;
  }
}
