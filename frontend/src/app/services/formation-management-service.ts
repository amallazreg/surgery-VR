import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FormationManagementService {
    private apiBase  = 'https://surgery-vr.onrender.com/client';
  private apiCodes = `${this.apiBase}/codes`;
  private apiAcces = `${this.apiBase}/acces`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ── Étudiant ─────────────────────────────────────────────
  verifierCode(code: string): Observable<any> {
    return this.http.post<any>(`${this.apiCodes}/verifier`, { code }, { headers: this.getHeaders() });
  }

  activerCode(code: string): Observable<any> {
    return this.http.post<any>(`${this.apiCodes}/activer`, { code }, { headers: this.getHeaders() });
  }

  getMesExperiences(): Observable<any> {
    return this.http.get<any>(`${this.apiAcces}/mes-experiences`, { headers: this.getHeaders() });
  }

  getUnAcces(accesId: string): Observable<any> {
    return this.http.get<any>(`${this.apiAcces}/${accesId}`, { headers: this.getHeaders() });
  }

  // ── Institution ──────────────────────────────────────────
  // Récupère tous les codes d'un abonnement avec stats
  getCodesAbonnement(abonnementId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiCodes}/abonnement/${abonnementId}`,
      { headers: this.getHeaders() }
    );
  }

  // Révoquer un code (PATCH)
  revoquerCode(codeId: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiCodes}/${codeId}/revoquer`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
