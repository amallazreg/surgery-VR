import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SendMessageResponse {
  success: boolean;
  response: string;
}
 
export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
 
export interface HistoryResponse {
  success: boolean;
  messages: HistoryMessage[];
}
 
export interface ClearResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {

  private apiUrl = 'https://surgery-vr.onrender.com/chatbot'; 
 
  constructor(private http: HttpClient) {}
 
  sendMessage(userId: string, message: string): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(`${this.apiUrl}/message`, {
      userId,
      message
    });
  }
 
  getHistory(userId: string): Observable<HistoryResponse> {
    return this.http.get<HistoryResponse>(`${this.apiUrl}/history/${userId}`);
  }
 
  clearHistory(userId: string): Observable<ClearResponse> {
    return this.http.delete<ClearResponse>(`${this.apiUrl}/clear/${userId}`);
  }
  
}
