import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
}

export interface DownloadApkResponse {
  downloadUrl: string;
  fileName: string;
  apkRestants: number;
  dejaInstalle: boolean;
}


@Injectable({
  providedIn: 'root',
})
export class Experiences {

    private api = "https://surgery-vr.onrender.com/client/experiences" ; // ex: http://localhost:3000/api

  constructor(private http: HttpClient) {}

  // GET /client/experiences/:userId  (route: /mes-experiences/:userId selon le router)
  getMesExperiences(userId: string): Observable<any> {
    return this.http.get<any>(
      `${this.api}/mes-experiences/${userId}`
    );
  }

  // POST /client/experiences/download/:userId/:experienceId
  downloadExperienceApk(userId: string, experienceId: string): Observable<any> {
    return this.http.post<any>(
      `${this.api}/download/${userId}/${experienceId}`,
      {}
    );
  }

  private apiUrl = 'https://surgery-vr.onrender.com/admin/experiences';


  getAllExperiences(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

createExperience(data: any): Observable<any> {
  return this.http.post(`${this.apiUrl}`, data);
}

  deleteExperience(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

getExperiencesByForfait(forfaitId: string): Observable<any> {
  return this.http.get(`${this.api}/by-forfait/${forfaitId}`);
                         
}

updateExperience(id: string, data: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/${id}`, data);
}
  
}
