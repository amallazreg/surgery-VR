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
  

    private apiUrl = 'https://surgery-vr.onrender.com/admin'
   private apiUrlDemo = 'https://surgery-vr.onrender.com/adminDemoRoute'
  private apiUrlDevis = 'https://surgery-vr.onrender.com/adminDevisRoute'



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
      return this.http.get(`${this.apiUrl}/demande/getToutes-demande-demo`)
    }

    contacterDemo(message : any,id: any) : Observable<any> {
      return this.http.patch(`${this.apiUrlDemo}/${id}/contacter`,message)
    }
    
    cloturerDemande(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/demandes-demo/${id}/cloturer`, {});
  }





    toutesDemandesDevis(): Observable<any> {
      return this.http.get(`${this.apiUrl}/demande/getToutes-demande-devis` );
   }


   calculerDevis(demandeId: string): Observable<any> {
      return this.http.post( `${this.apiUrlDevis}/demandes-devis/${demandeId}/calculer`,{},);
   }

    envoyerDevis(demandeId: string, messagePersonnalise?: string): Observable<any> {
        return this.http.post( `${this.apiUrlDevis}/demandes-devis/${demandeId}/envoyer`, { messagePersonnalise } );
    }

    calculerEtEnvoyerDevis(demandeId: string, messagePersonnalise?: string): Observable<any> {
      return this.http.post( `${this.apiUrlDevis}/demandes-devis/${demandeId}/calculer-et-envoyer`, { messagePersonnalise }, );
    }



    demandesDevisParStatut(statut: 'nouvelle' | 'en_cours' | 'envoyee'): Observable<any> {
     return this.http.get(`${this.apiUrlDevis}/statut/${statut}`);
   }

  statistiquesDevis(): Observable<any> {
     return this.http.get(`${this.apiUrlDevis}/admin/demandes-devis/statistiques`);
  }


supprimerDemandeDevis(demandeId: string): Observable<any> {
  return this.http.delete(
    `${this.apiUrlDevis}/admin/demandes-devis/${demandeId}`,
  
  );
}

}
