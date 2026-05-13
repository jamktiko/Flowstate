import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = environment.apiUrl;

  if (!req.url.startsWith(apiUrl)) {
    return next(req);
  }

  const token = localStorage.getItem('accessToken');

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq);
  }

  return next(req);
};
