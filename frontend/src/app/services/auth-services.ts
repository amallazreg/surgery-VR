import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  private apiUrl = 'https://surgery-vr.onrender.com';

  constructor(private http: HttpClient, private router: Router) {}



  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/signup`, userData);
  }

  signinUser(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', res.role);
          localStorage.setItem('email', res.email);

          if (res.profileStatus) {
            localStorage.setItem('profileStatus', res.profileStatus);
          }
          console.log('Connexion réussie ✅');
        }
      })
    );
  }



  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getDecodedToken(): any | null {
    const token = this.getToken();
    if (!token) return null;
    return this.decodeToken(token);
  }



  // Vérifie token présent ET non expiré
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return false;

    // exp est en secondes, Date.now() en millisecondes
    return decoded.exp * 1000 > Date.now();
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }



  getRole(): string | null {
    return localStorage.getItem('role');
  }

  hasRole(...roles: string[]): boolean {
    const role = this.getRole();
    if (!role) return false;
    return roles.includes(role);
  }

  saveRole(role: string): void {
    localStorage.setItem('role', role);
  }


  getUserId(): string | null {
    const decoded = this.getDecodedToken();
    if (!decoded) return null;
    return decoded.id || decoded._id || null;
  }

  getUserName(): string {
    return localStorage.getItem('userName')
      ?? localStorage.getItem('companyName')
      ?? '';
  }

  getEmail(): string | null {
    return localStorage.getItem('email');
  }

  getProfileStatus(): string | null {
    return localStorage.getItem('profileStatus');
  }



  isTokenExpired(): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 <= Date.now();
  }



  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }



  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('userName');
    localStorage.removeItem('companyName');
    localStorage.removeItem('sector');
    localStorage.removeItem('profileStatus');

    this.router.navigate(['/login']);
  }
}