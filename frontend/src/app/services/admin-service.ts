import { HttpClient } from '@angular/common/http';
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
  
  // Champs Médecin
  specialite?: string;
  etablissement?: string;
  ville?: string;
  numeroOrdre?: string;
  
  // Champs Étudiant
  universite?: string;
  anneeEtude?: string;
  encadrant?: string;
  
  // Commun
  objectif?: string;
  documentVerification?: string;
  motifRefus?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  

    private apiUrl = 'http://localhost:3000/admin'
   private apiUrl2 = 'http://localhost:3000'


  constructor(private http: HttpClient,) {}

    tousclients(): Observable<any> {
      return this.http.get(`${this.apiUrl}/Tousclients`);
    }

      listerParStatut(statut: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/clients/statut/${statut}`);
  }

    approuverCompte(userId: string): Observable<any> {
      return this.http.put(`${this.apiUrl}/clients/${userId}/approuver`,{});
    }

     rejeterCompte(userId: string,motifRefus?: string): Observable<any> {
      return this.http.put(`${this.apiUrl}/clients/${userId}/rejeter`,{ motifRefus });
    }

    tousDemandeDemo() : Observable<any>{
      return this.http.get(`${this.apiUrl2}/demande/getToutes-demande-demo`)
    }

    contacterDemo(message : any,id: any) : Observable<any> {
      return this.http.patch(`${this.apiUrl2}/adminDemoRoute/${id}/contacter`,message)
    }

}
