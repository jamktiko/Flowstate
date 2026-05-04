import { Routes } from '@angular/router';
import { LoginPage } from './login/login-page';
import { RegisterPage } from './register/register-page';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'register',
    component: RegisterPage,
  },
];
