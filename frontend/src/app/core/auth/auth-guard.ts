import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth-service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const isAuthenticated = await authService.isAuthenticated();
    if (isAuthenticated) {
      return true;
    }
  } catch (err) {
    console.error(err);
  }

  console.log('User tried to access:', state.url);
  return router.parseUrl(`/auth/login?returnUrl=${encodeURIComponent(state.url)}`);
};
