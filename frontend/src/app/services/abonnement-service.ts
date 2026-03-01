import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AbonnementService {
 
  
   private apiUrl = 'https://surgery-vr.onrender.com/client/abonnements';

  constructor(private http: HttpClient) {}

  getMonAbonnement(userId: string) {
    return this.http.get<any>(`${this.apiUrl}/mon-abonnement/${userId}`);
  }

  getHistoriqueAbonnements(userId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/historique/${userId}`);
  }

  getMesFactures(userId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/factures/${userId}`);
  }

  getForfaitsUpgrade(userId: string) {
    return this.http.get<any>(`${this.apiUrl}/upgrade/disponibles/${userId}`);
  }

  renouvelerAbonnement(userId: string, abonnementId: string) {
    return this.http.post<{ url: string }>(`${this.apiUrl}/renouveler`, { userId, abonnementId });
  }

  upgradeAbonnement(userId: string, nouveauForfaitId: string) {
    return this.http.post<{ url: string }>(`${this.apiUrl}/upgrade`, { userId, nouveauForfaitId });
  }

  telechargerFacture(paiementId: string): void {
  const url = `${this.apiUrl}/facture/${paiementId}`;
  window.open(url, '_blank'); // ← ouvre/télécharge le PDF
}

// ─── Droits complets de l'abonnement actif ──────────────
  // Retourne : apkTotal, apkRestants, formation, simulationEsthetique
  getMesDroits(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/droits/${userId}`);
  }

  // ─── Télécharger un APK (décrémente le compteur) ────────
  telechargerApk(userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/telechargerApk/${userId}`, {});
  }

  // ─── Activer la formation + générer les codes d'accès ───
  activerFormation(userId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/formation/${userId}`, {});
  }
}
