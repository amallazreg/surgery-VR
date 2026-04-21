import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
  _id: string;
  prenom: string;
  nom: string;
  email: string;
  phone?: string;
  role: 'medecin' | 'etudiant';
  statut: 'en_attente' | 'approuve' | 'rejete';
  specialite?: string;
  etablissement?: string;
  ville?: string;
  numeroOrdre?: string;
  universite?: string;
  anneeEtude?: string;
  encadrant?: string;
  objectif?: string;
  documentVerification?: string;
  motifRefus?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {

  private base  = 'https://surgery-vr.onrender.com';
  private admin = `${this.base}/admin`;
  private demo  = `${this.base}/adminDemoRoute`;
  private devis = `${this.base}/adminDevisRoute`;

  constructor(private http: HttpClient) {}

  // ═══════════════════════════════════════════════════════════
  // HELPER — headers avec token (utilisé dans toutes les requêtes)
  // ═══════════════════════════════════════════════════════════
  private get authHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CLIENTS
  // ═══════════════════════════════════════════════════════════

  tousclients(): Observable<any> {
    return this.http.get(`${this.admin}/Tousclients`, this.authHeaders);
  }

  listerParStatut(statut: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.admin}/clients/statut/${statut}`, this.authHeaders);
  }

  approuverCompte(userId: string): Observable<any> {
    return this.http.put(`${this.admin}/clients/${userId}/approuver`, {}, this.authHeaders);
  }

  rejeterCompte(userId: string, motifRefus?: string): Observable<any> {
    return this.http.put(`${this.admin}/clients/${userId}/rejeter`, { motifRefus }, this.authHeaders);
  }

  // ═══════════════════════════════════════════════════════════
  // DEMANDES DEMO
  // ═══════════════════════════════════════════════════════════

  tousDemandeDemo(): Observable<any> {
    return this.http.get(`${this.admin}/demande/getToutes-demande-demo`, this.authHeaders);
  }

  contacterDemo(message: any, id: any): Observable<any> {
    return this.http.patch(`${this.demo}/${id}/contacter`, message, this.authHeaders);
  }

  cloturerDemande(id: string): Observable<any> {
    return this.http.patch(`${this.demo}/${id}/cloturer`, {}, this.authHeaders);
  }

  // ═══════════════════════════════════════════════════════════
  // DEMANDES DEVIS
  // ═══════════════════════════════════════════════════════════

  toutesDemandesDevis(): Observable<any> {
    return this.http.get(`${this.admin}/demande/getToutes-demande-devis`, this.authHeaders);
  }

  calculerDevis(demandeId: string): Observable<any> {
    return this.http.post(`${this.devis}/${demandeId}/calculer`, {}, this.authHeaders);
  }

  envoyerDevis(demandeId: string, messagePersonnalise?: string): Observable<any> {
    return this.http.post(`${this.devis}/${demandeId}/envoyer`, { messagePersonnalise }, this.authHeaders);
  }

  calculerEtEnvoyerDevis(demandeId: string, messagePersonnalise?: string): Observable<any> {
    return this.http.post(`${this.devis}/${demandeId}/calculer-et-envoyer`, { messagePersonnalise }, this.authHeaders);
  }

  demandesDevisParStatut(statut: 'nouvelle' | 'en_cours' | 'envoyee'): Observable<any> {
    return this.http.get(`${this.devis}/statut/${statut}`, this.authHeaders);
  }

  statistiquesDevis(): Observable<any> {
    return this.http.get(`${this.devis}/statistiques`, this.authHeaders);
  }

  supprimerDemandeDevis(demandeId: string): Observable<any> {
    return this.http.delete(`${this.devis}/${demandeId}`, this.authHeaders);
  }
}