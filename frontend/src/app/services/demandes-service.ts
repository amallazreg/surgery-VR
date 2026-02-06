import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DemandesService {

    private apiUrl = 'http://localhost:3000/demande';

      constructor(private http: HttpClient) {}

        envoyerDemandeDemo(donnees: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/demande-demo`, donnees);
  }


}
