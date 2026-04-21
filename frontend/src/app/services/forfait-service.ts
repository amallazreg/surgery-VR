import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ForfaitService {

  private apiUrl = 'https://surgery-vr.onrender.com/client/forfaits'; 

  constructor(private http: HttpClient) {}

  private get authHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }


  // 🔹 Récupérer tous les forfaits
  getAllForfaits(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getAllForfaits`,this.authHeaders);
  }

  // 🔹 Récupérer un forfait par ID
  getForfaitById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getForfaitById/${id}`,this.authHeaders);
  }

  // 🔹 Créer un forfait
  createForfait(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/createForfait`, data,this.authHeaders);
  }

  // 🔹 Mettre à jour un forfait
  updateForfait(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateForfait/${id}`, data,this.authHeaders);
  }

  // 🔹 Supprimer un forfait
  deleteForfait(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteForfait/${id}`,this.authHeaders);
  }

   getForfaitsByCible(cible: 'professionnel' | 'etudiant'): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/cible/${cible}`,
      this.authHeaders
    );
  }
  
}
