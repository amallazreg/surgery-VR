import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-services';
import { inject } from '@angular/core';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthServiceService);
  const router = inject(Router);

  // Les rôles autorisés sont définis dans app.routes.ts → data: { roles: [...] }
  const rolesAutorises: string[] = route.data['roles'] ?? [];
  const roleUser                 = auth.getRole();

  if (auth.isLoggedIn() && rolesAutorises.includes(roleUser!)) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};