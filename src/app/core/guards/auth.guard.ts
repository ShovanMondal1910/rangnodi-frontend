import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Enforces that only authenticated customers can proceed to protected views (e.g. Checkout & Profile)
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const user = authService.currentUser();
  if (user && user.user_id) {
    return true;
  }

  toast.warning('Please log in to continue.');
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
