import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isAuthEndpoint =
    req.url.includes('/api/auth/login') || req.url.includes('/api/auth/refresh');

  if (isAuthEndpoint) {
    return next(req);
  }

  const token = auth.getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !auth.getRefreshToken()) {
        return throwError(() => error);
      }

      // Access token expired — refresh once, then retry the original request
      return auth.refreshToken().pipe(
        switchMap((res) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${res.token}` }
            })
          )
        ),
        catchError((refreshError) => {
          auth.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
