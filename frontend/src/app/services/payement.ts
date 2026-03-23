import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Payement {
  

  private apiUrl = 'https://surgery-vr.onrender.com/client/payment'; 
  private api = 'https://surgery-vr.onrender.com/client/etudiant/paiement';


   constructor(private http: HttpClient) {}

  createCheckoutSession(userId: string, forfaitId: string) {
    return this.http.post<{ url: string }>(`${this.apiUrl}/create-checkout-session`,
      {
        userId,
        forfaitId
      }
    );
  }

   private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
 
  createCheckoutSessionEtudiant(
    userId: string,
    forfaitId: string,
    type: 'nouveau' | 'renouvellement' | 'upgrade' = 'nouveau'
  ): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      `${this.api}/create-checkout-session`,
      { userId, forfaitId, type },
      { headers: this.getHeaders() }
    );
  }
}
