import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {


  private apiUrl = 'https://surgery-vr.onrender.com'

  constructor(private http: HttpClient,) {}

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/signup`, userData);
  }
  // 🔹 Connexion user
  signinUser(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', res.role);
          localStorage.setItem('email', res.email);

            // ✅ Sauvegarder le profileStatus
          if (res.profileStatus) {
            localStorage.setItem('profileStatus', res.profileStatus);
          }
          console.log('Connexion user réussie ✅');
        }
      })
    );
  }


    // Méthode pour décoder le token sans bibliothèque externe
  private decodeToken(token: string): any {
    const payload = token.split('.')[1]; // Prendre la partie payload du token
    const decodedPayload = atob(payload); // Décoder en base64
    return JSON.parse(decodedPayload); // Retourner l'objet JSON
  }


isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}
  // ✅ Récupérer le profileStatus
  getProfileStatus(): string | null {
    return localStorage.getItem('profileStatus');
  }
getUserName(): string {
  // user
  if (localStorage.getItem('userName')) {
    return localStorage.getItem('userName')!;
  }

  // company
  if (localStorage.getItem('companyName')) {
    return localStorage.getItem('companyName')!;
  }

  return '';
}

 // Dans ton AuthServiceService

// Récupérer l'ID de l'utilisateur connecté
getUserId(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = this.decodeToken(token);
    // Selon comment tu as créé le token, l'ID peut être dans 'id' ou '_id'
    return decoded.id || decoded._id || null;
  } catch (error) {
    console.error('Erreur lors du décodage du token :', error);
    return null;
  }
}


logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userName');
  localStorage.removeItem('companyName');
  localStorage.removeItem('sector');
  localStorage.removeItem('profileStatus');

}

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  saveRole(role: string) {
    localStorage.setItem('role', role);
  }

}


