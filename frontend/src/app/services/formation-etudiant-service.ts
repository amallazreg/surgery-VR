import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
export interface PerformanceMetrics {
  totalScore: number;
  precisionScore: number;
  timeScore: number;
  safetyScore: number;
  instrumentHandlingScore: number;
  collaborationScore: number;
  totalErrors: number;
  criticalErrors: number;
  wrongInstrumentCount: number;
  excessivePressureCount: number;
  collisionWithCriticalZoneCount: number;
  bleedingEvents: number;
  csfLeak: boolean;
  tumorRemovalPercent: number;
  trajectoryLengthMeters: number;
  averageHandStability: number;
}
 
export interface Phase {
  phaseId: number;
  phaseName: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  mainActions: string[];
}
 
export interface FormationError {
  errorId: string;
  time: string;
  phaseId: number;
  type: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  scorePenalty: number;
}
 
export interface Feedback {
  globalComment: string;
  positivePoints: string[];
  improvementPoints: string[];
}
 
export interface Certification {
  isValidated: boolean;
  threshold: number;
  certificationName: string | null;
  issuedAt: string | null;
}
 
export interface Formation {
  _id: string;
  operationId: string;
  sessionId: string;
  userId: string;
  studentName: string;
  scenarioName: string;
  operationType: string;
  dateStart: string;
  dateEnd: string;
  durationSeconds: number;
  status: string;
  attemptNumber: number;
  phases: Phase[];
  instrumentsUsed: { instrumentId: string; name: string; usageCount: number }[];
  performanceMetrics: PerformanceMetrics;
  errors: FormationError[];
  feedback: Feedback;
  certification: Certification;
}
 
export interface ScenarioSummary {
  _id: string; // scenarioName
  totalAttempts: number;
  bestScore: number;
  lastAttemptDate: string;
  isValidated: boolean;
  certificationName: string | null;
  sessions: {
    operationId: string;
    dateStart: string;
    durationSeconds: number;
    totalScore: number;
    attemptNumber: number;
    isValidated: boolean;
  }[];
}
 
@Injectable({
  providedIn: 'root',
})
export class FormationEtudiantService {
  private baseUrl = 'https://surgery-vr.onrender.com/client/etudiant/formation';
  
    constructor(private http: HttpClient) {}
   
    private getHeaders(): HttpHeaders {
      const token = localStorage.getItem('token');
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
   
    // Toutes les sessions brutes d'un étudiant
    getAllFormations(userId: string): Observable<Formation[]> {
      return this.http
        .get<Formation[]>(`${this.baseUrl}/${userId}`, { headers: this.getHeaders() })
        .pipe(catchError(this.handleError));
    }
   
    // Résumé groupé par scénario
    getSummary(userId: string): Observable<ScenarioSummary[]> {
      return this.http
        .get<ScenarioSummary[]>(`${this.baseUrl}/${userId}/summary`, { headers: this.getHeaders() })
        .pipe(catchError(this.handleError));
    }
   
    // Détail d'une session précise
    getSession(userId: string, operationId: string): Observable<Formation> {
      return this.http
        .get<Formation>(`${this.baseUrl}/${userId}/session/${operationId}`, { headers: this.getHeaders() })
        .pipe(catchError(this.handleError));
    }
   
    // Certifications validées
    getCertifications(userId: string): Observable<Formation[]> {
      return this.http
        .get<Formation[]>(`${this.baseUrl}/${userId}/certifications`, { headers: this.getHeaders() })
        .pipe(catchError(this.handleError));
    }
   
    private handleError(error: any) {
      console.error('FormationService error:', error);
      return throwError(() => error);
    }
  }