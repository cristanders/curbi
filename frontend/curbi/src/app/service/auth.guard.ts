import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SessionService } from '../service/session.service';

/** Redirige a /login cuando no hay un usuario en sesión (funciona también en SSR). */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const session = inject(SessionService);
  const router = inject(Router);
  return session.hasUser ? true : router.createUrlTree(['/login']);
};