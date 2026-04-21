import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface FormationDetails {
  dureeHeures: number;
  maxEtudiants: number;
  detaillee: boolean;
  activee: boolean;
  codes: any[];
}

export interface AbonnementResponse {
  forfait: string;
  abonnementId: string;
  apkTotal: number;
  apkRestants: number;
  dateFin?: string;
  formation: FormationDetails | null;
  simulationEsthetique: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AbonnementService {
 
  
   private apiUrl = 'https://surgery-vr.onrender.com/client/abonnements';

  constructor(private http: HttpClient) {}

  private get authHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  getMonAbonnement(userId: string) {
    return this.http.get<any>(`${this.apiUrl}/mon-abonnement/${userId}`,this.authHeaders);
  }

  getHistoriqueAbonnements(userId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/historique/${userId}`,this.authHeaders);
  }

  getMesFactures(userId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/factures/${userId}`,this.authHeaders);
  }

  getForfaitsUpgrade(userId: string) {
    return this.http.get<any>(`${this.apiUrl}/upgrade/disponibles/${userId}`,this.authHeaders);
  }

  renouvelerAbonnement(userId: string, abonnementId: string) {
    return this.http.post<{ url: string }>(`${this.apiUrl}/renouveler`, { userId, abonnementId },this.authHeaders);
  }

  upgradeAbonnement(userId: string, nouveauForfaitId: string) {
    return this.http.post<{ url: string }>(`${this.apiUrl}/upgrade`, { userId, nouveauForfaitId },this.authHeaders);
  }

  telechargerFacture(paiementId: string): void {
  const url = `${this.apiUrl}/facture/${paiementId}`;
  window.open(url, '_blank'); // ← ouvre/télécharge le PDF
}

// ─── Droits complets de l'abonnement actif ──────────────
  // Retourne : apkTotal, apkRestants, formation, simulationEsthetique
  getMesDroits(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/droits/${userId}`,this.authHeaders);
  }

  // ─── Télécharger un APK (décrémente le compteur) ────────
  telechargerApk(userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/telechargerApk/${userId}`, {},this.authHeaders);
  }

  // ─── Activer la formation + générer les codes d'accès ───
  activerFormation(userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/formation/${userId}`, {},this.authHeaders);
  }
}
