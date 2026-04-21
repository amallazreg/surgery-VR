import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { AuthServiceService } from '../services/auth-services';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private auth: AuthServiceService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // ── 1. Ajouter le token ───────────────────────────────────
    let clonedRequest = req;

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');

      if (token) {
        clonedRequest = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });
      }
    }

    // ── 2. Intercepter les erreurs ────────────────────────────
    return next.handle(clonedRequest).pipe(
      catchError((err: HttpErrorResponse) => {

        if (err.status === 401) {
          // Token expiré → déconnexion automatique
          console.warn('Session expirée, déconnexion...');
          this.auth.logout(); // redirige vers /login
        }

        if (err.status === 403) {
          // Accès refusé
          console.warn('Accès refusé (403)');
        }

        return throwError(() => err);
      })
    );
  }
}