import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type Cible = 'etudiant' | 'professionnel' | 'les deux';

export interface ExperienceBackend {
  _id: string;
  title: string;
  description: string;
  emoji: string;
  thumbClass: string;
  compatibility: string;
  apkUrl: string;
  apkOriginalName: string;
  apkSize: string;
  apkVersion: string;
  apkAndroid: string;
  respondents: number;
  avgTime: string;
  rating: number | null;
  apkInstalled: boolean;   // enrichi par le backend
  status: 'live' | 'new' | 'paused' | 'draft';
  appLabUrl?: string;  
  cible: Cible;
}

export interface DownloadApkResponse {
  downloadUrl: string;
  fileName: string;
  apkRestants: number;
  dejaInstalle: boolean;
  cible: Cible;
}


@Injectable({
  providedIn: 'root',
})
export class Experiences {

    private api = "https://surgery-vr.onrender.com/client/experiences" ; 
    private apiUrl = 'https://surgery-vr.onrender.com/admin/experiences';


  constructor(private http: HttpClient) {}

  private get authHeaders() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  //CLIENT
  getMesExperiences(userId: string): Observable<any> {
    return this.http.get<any>(
      `${this.api}/mes-experiences/${userId}`,
       this.authHeaders
    );
  }
  downloadExperienceApk(userId: string, experienceId: string): Observable<any> {
    return this.http.post<any>(
      `${this.api}/download/${userId}/${experienceId}`,
      {},
      this.authHeaders
    );
  }


//ADMIN
  getAllExperiences(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`,this.authHeaders);
  }

  createExperience(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, data,this.authHeaders);
  }

  deleteExperience(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`,this.authHeaders);
  }

  getExperiencesByForfait(forfaitId: string): Observable<any> {
    return this.http.get(`${this.api}/by-forfait/${forfaitId}`,this.authHeaders);                      
  }

  updateExperience(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data,this.authHeaders);
  }

  getExperiencesForEtudiant(): Observable<any> {
    return this.http.get(`${this.apiUrl}/etudiants`,this.authHeaders);
  }

  getExperiencesForProfessionnel(): Observable<any> {
    return this.http.get(`${this.apiUrl}/professionnels`,this.authHeaders);
  }
  
}
