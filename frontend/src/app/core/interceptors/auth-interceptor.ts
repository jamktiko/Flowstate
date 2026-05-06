import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth-service';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  return from(authService.getTokens()).pipe(
    switchMap((tokens) => {
      // Extract the access token string from the tokens object
      const tokenString = tokens?.accessToken?.toString();

      if (tokenString) {
        const cloned = req.clone({
          setHeaders: { Authorization: `Bearer ${tokenString}` },
        });
        return next(cloned);
      }
      return next(req);
    }),
  );
};
