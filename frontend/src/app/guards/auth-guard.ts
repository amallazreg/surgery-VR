import { CanActivateFn, Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-services';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthServiceService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['/signin']);
  return false;
};