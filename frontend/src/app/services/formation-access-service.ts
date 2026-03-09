import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FormationAccessService {
  private apiCodes = 'https://surgery-vr.onrender.com/client/codes';
  private apiAcces = 'https://surgery-vr.onrender.com/client/acces';

  constructor(private http: HttpClient) {}

    private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  // ── Vérifier un code sans l'activer (aperçu des expériences) ──
  verifierCode(code: string): Observable<any> {
    return this.http.post<any>(`${this.apiCodes}/verifier`, { code },
      { headers: this.getHeaders() }
    );
  }

  // ── Activer le code → crée AccesEtudiant ─────────────────────
  activerCode(code: string): Observable<any> {
    return this.http.post<any>(`${this.apiCodes}/activer`, { code },
      { headers: this.getHeaders() }
    );
  }

  // ── Récupérer toutes les expériences accessibles (temps réel) ─
  getMesExperiences(): Observable<any> {
    return this.http.get<any>(`${this.apiAcces}/mes-experiences`,
      { headers: this.getHeaders() }
    );
  }

  // ── Détail d'un accès spécifique ─────────────────────────────
  getUnAcces(accesId: string): Observable<any> {
    return this.http.get<any>(`${this.apiAcces}/${accesId}`,
      { headers: this.getHeaders() }
    );
  }

}
