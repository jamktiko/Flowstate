import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { firstValueFrom } from 'rxjs';

interface AuthResponse {
  data?: {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  };
  message?: string;
}
interface EmailAvailabilityResponse {
  data?: {
    available?: boolean;
    message?: string;
  };
  message?: string;
}
export interface RegisterResult {
  nextStep: {
    signUpStep: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authApiUrl = `${environment.apiBaseUrl}/auth`;

  async register(email: string, password: string, firstName: string, lastName: string) {
    try {
      const res = await firstValueFrom(
        this.http.post(`${this.authApiUrl}/register`, {
          email,
          password,
          firstName,
          lastName,
        }),
      );

      // Delete console.log after testing!
      console.log('Backend response from /register:', res);
      return { nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } };
    } catch (error) {
      console.error('Error in AuthService.register:', error);
      throw error;
    }
  }

  async checkEmailAvailability(email: string): Promise<{ available: boolean; message?: string }> {
    const res = await firstValueFrom(
      this.http.post<EmailAvailabilityResponse>(`${this.authApiUrl}/check-email`, {
        email,
      }),
    );

    return {
      available: !!res.data?.available,
      message: res.data?.message,
    };
  }

  async confirmRegistration(email: string, koodi: string) {
    try {
      return await firstValueFrom(
        this.http.post(`${this.authApiUrl}/confirm`, { email, code: koodi }),
      );
    } catch (error) {
      console.error('Virhe vahvistuksessa:', error);
      throw error;
    }
  }

  async login(email: string, salasana: string) {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.authApiUrl}/login`, {
          email,
          password: salasana,
        }),
      );

      if (res.data?.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
      }

      return !!res.data?.accessToken;
    } catch (error) {
      console.error('Virhe kirjautumisessa:', error);
      throw error;
    }
  }

  // Check if a user is currently logged in
  async isAuthenticated(): Promise<boolean> {
    return !!localStorage.getItem('accessToken');
  }

  // Logout
  async logout() {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      await this.router.navigate(['/']);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  }

  // Get tokens for backend authentication
  async getTokens() {
    return {
      accessToken: localStorage.getItem('accessToken'),
      idToken: localStorage.getItem('idToken'),
    };
  }

  async handleSocialLogin(code: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.authApiUrl}/social-callback`, { code }),
    );

    if (res.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
    }
  }
}
