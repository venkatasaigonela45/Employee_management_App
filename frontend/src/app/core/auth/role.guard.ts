import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Restrict a route to one or more roles (e.g. ROLE_ADMIN for Reports). */
export const roleGuard = (...roles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (roles.length === 0 || roles.some((role) => auth.hasRole(role))) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  };
};
