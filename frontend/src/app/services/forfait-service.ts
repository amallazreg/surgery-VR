import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ForfaitService {

  private apiUrl = 'https://surgery-vr.onrender.com/client/forfaits'; 
  // ⚠️ adapte selon ton backend

  constructor(private http: HttpClient) {}

  // 🔹 Récupérer tous les forfaits
  getAllForfaits(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getAllForfaits`);
  }

  // 🔹 Récupérer un forfait par ID
  getForfaitById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getForfaitById/${id}`);
  }

  // 🔹 Créer un forfait
  createForfait(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/createForfait`, data);
  }

  // 🔹 Mettre à jour un forfait
  updateForfait(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateForfait/${id}`, data);
  }

  // 🔹 Supprimer un forfait
  deleteForfait(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteForfait/${id}`);
  }

   getForfaitsByCible(cible: 'professionnel' | 'etudiant'): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/cible/${cible}`,
    );
  }
  
}
