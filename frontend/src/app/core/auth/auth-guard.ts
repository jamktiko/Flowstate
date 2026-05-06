import { CanMatchFn, Router, RedirectCommand } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth-service';

export const authGuard: CanMatchFn = async (route, segments) => {
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

  // Reconstruct the requested URL from the segments
  const requestedUrl = '/' + segments.map((s) => s.path).join('/');

  return new RedirectCommand(
    router.parseUrl(`/auth/login?returnUrl=${encodeURIComponent(requestedUrl)}`),
  );
};
