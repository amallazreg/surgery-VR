import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter }                          from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { inject, PLATFORM_ID }                   from '@angular/core';
import { isPlatformBrowser }                     from '@angular/common';
import { HttpInterceptorFn, HttpErrorResponse }  from '@angular/common/http';
import { catchError, throwError }                from 'rxjs';
import { Router }                                from '@angular/router';
import { routes }                                from './app.routes';

// ✅ Intercepteur fonctionnel inline (compatible SSR + standalone)
const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router     = inject(Router);

  let clonedReq = req;

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');
    if (token) {
      clonedReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
  }

  return next(clonedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && isPlatformBrowser(platformId)) {
        console.warn('Session expirée, déconnexion...');
        localStorage.clear();
        router.navigate(['/login']);
      }
      if (err.status === 403) {
        console.warn('Accès refusé (403)');
      }
      return throwError(() => err);
    })
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),

    // ✅ withFetch() requis pour SSR + withInterceptors fonctionnel
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptorFn])
    ),
  ]
};