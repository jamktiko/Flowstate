import { Routes } from '@angular/router';
import { LoginPage } from './login/login-page';
import { RegisterPage } from './register/register-page';
import { ConfirmPage } from './confirm/confirm-page';
import { AuthCallbackComponent } from './callback/callback';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'register',
    component: RegisterPage,
  },
  { path: 'confirm', component: ConfirmPage },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'auth/callback', component: AuthCallbackComponent },
];
// comment to launch deploy workflow!!
