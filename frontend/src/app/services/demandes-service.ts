import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DemandesService {

    private apiUrl = 'https://surgery-vr.onrender.com/admin/demande';


      constructor(private http: HttpClient) {}

       private get authHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

        envoyerDemandeDemo(donnees: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/demande-demo`, donnees);
  }

    getToutesDemandes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getToutes-demande-demo`, this.authHeaders);
  }

    envoyerDemandeDevis(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/demande-devis`, data);
  }

  getToutesDemandesDevis(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getToutes-demande-devis`, this.authHeaders);
  }


  
  creerExperience(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/experience-sur-mesure`, data, this.authHeaders);
  }

  getToutesExperiences(): Observable<any> {
    return this.http.get(`${this.apiUrl}/toutes-experiences-sur-mesure`, this.authHeaders);
  }

}
