import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DemandesService {

    private apiUrl = 'https://surgery-vr.onrender.com/admin/demande';


      constructor(private http: HttpClient) {}

        envoyerDemandeDemo(donnees: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/demande-demo`, donnees);
  }

    getToutesDemandes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getToutes-demande-demo`);
  }

    envoyerDemandeDevis(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/demande-devis`, data);
  }

  getToutesDemandesDevis(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getToutes-demande-devis`);
  }


  
  creerExperience(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/experience-sur-mesure`, data);
  }

  getToutesExperiences(): Observable<any> {
    return this.http.get(`${this.apiUrl}/toutes-experiences-sur-mesure`);
  }

}
