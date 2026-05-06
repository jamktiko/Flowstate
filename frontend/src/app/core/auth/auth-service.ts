import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment'; // Tarkista polku
import { firstValueFrom } from 'rxjs';
interface AuthResponse {
  data?: {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
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
  private apiUrl = environment.apiUrl;

  async register(email: string, salasana: string, firstName: string, surname: string) {
    try {
      // Poistettu 'const response =', koska sitä ei käytetä.
      // Vaihdettu <any> -> <AuthResponse>
      await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
          email,
          password: salasana,
          firstName,
          lastName: surname,
        }),
      );

      // Palautetaan rakenne, jota register-page.ts odottaa
      return { nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } };
    } catch (error) {
      console.error('Error in AuthService.register:', error);
      throw error;
    }
  }

  async confirmRegistration(email: string, koodi: string) {
    try {
      return await firstValueFrom(this.http.post(`${this.apiUrl}/confirm`, { email, code: koodi }));
    } catch (error) {
      console.error('Virhe vahvistuksessa:', error);
      throw error;
    }
  }

  // Muista vaihtaa myös login-metodiin <AuthResponse> anyn tilalle
  async login(email: string, salasana: string) {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password: salasana }),
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
    // Koska emme käytä Amplifya, tarkistamme tokenin olemassaolon
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
}
