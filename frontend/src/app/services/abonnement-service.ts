import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

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
}
