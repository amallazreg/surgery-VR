import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Payement {
  

  private apiUrl = 'https://surgery-vr.onrender.com/client/payment'; 

   constructor(private http: HttpClient) {}

  createCheckoutSession(userId: string, forfaitId: string) {
    return this.http.post<{ url: string }>(`${this.apiUrl}/create-checkout-session`,
      {
        userId,
        forfaitId
      }
    );
  }
}
