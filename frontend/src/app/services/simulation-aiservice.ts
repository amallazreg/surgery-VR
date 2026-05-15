import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface FaceFeatures {
  distances: {
    face_width: number;
    face_height: number;
    eye_distance: number;
    mouth_width: number;
    nose_width: number;
  };
  ratios: {
    face_ratio: number;
    nose_face_ratio: number;
    mouth_face_ratio: number;
    eye_face_ratio: number;
    nose_mouth_ratio: number;
    mouth_openness: number;
    eye_symmetry: number;
  };
  scores: {
    symmetry_score: number;
    golden_ratio_score: number;
  };
}

export interface Recommendation {
  procedure: string;
  confidence: number;
  reason: string;
  alternatives: { procedure: string; confidence: number }[];
}

export interface AnalysisResult {
  face_detected: boolean;
  total_landmarks: number;
  image_size: { width: number; height: number };
  features: FaceFeatures;
  recommendation: Recommendation;
}
export interface SimulationResult {
  success:    boolean;
  available:  boolean;
  procedure:  string;
  label:      string;
  before_b64?: string;
  after_b64?:  string;
  message?:    string;
  error?:      string;
}

@Injectable({
  providedIn: 'root',
})
export class SimulationAIService {

  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  analyzeFace(file: File): Observable<AnalysisResult> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http.post<AnalysisResult>(
      `${this.apiUrl}/api/ai/analyze`, formData
    );
  }

  generateSimulation(file: File, procedure: string): Observable<SimulationResult> {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('procedure', procedure);
  return this.http.post<SimulationResult>(
    `${this.apiUrl}/api/ai/simulate`, formData
  );
}
  
}
