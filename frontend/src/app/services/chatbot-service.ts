import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// ── Interfaces ──

export interface SendMessageResponse {
  success: boolean;
  response: string;
  conversationId: string;
  title: string;
}

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface HistoryResponse {
  success: boolean;
  conversationId: string;
  title: string;
  messages: HistoryMessage[];
}

export interface Conversation {
  id: string;
  title: string;
  isActive: boolean;
  messageCount: number;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
}

export interface NewConversationResponse {
  success: boolean;
  conversationId: string;
  title: string;
}

export interface SwitchConversationResponse {
  success: boolean;
  conversationId: string;
  title: string;
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

  // ── POST /chatbot/message ──
  sendMessage(userId: string, message: string, conversationId?: string): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(`${this.apiUrl}/message`, {
      userId,
      message,
      conversationId
    });
  }

  // ── GET /chatbot/history/:userId ──
  getHistory(userId: string, conversationId?: string): Observable<HistoryResponse> {
    const url = conversationId
      ? `${this.apiUrl}/history/${userId}?conversationId=${conversationId}`
      : `${this.apiUrl}/history/${userId}`;
    return this.http.get<HistoryResponse>(url);
  }

  // ── GET /chatbot/conversations/:userId ──
  getConversations(userId: string): Observable<ConversationsResponse> {
    return this.http.get<ConversationsResponse>(`${this.apiUrl}/conversations/${userId}`);
  }

  // ── POST /chatbot/new ──
  createConversation(userId: string): Observable<NewConversationResponse> {
    return this.http.post<NewConversationResponse>(`${this.apiUrl}/new`, { userId });
  }

  // ── PUT /chatbot/switch/:conversationId ──
  switchConversation(conversationId: string, userId: string): Observable<SwitchConversationResponse> {
    return this.http.put<SwitchConversationResponse>(
      `${this.apiUrl}/switch/${conversationId}`,
      { userId }
    );
  }

  // ── DELETE /chatbot/clear/:userId ──
  clearHistory(userId: string, conversationId?: string): Observable<ClearResponse> {
    const url = conversationId
      ? `${this.apiUrl}/clear/${userId}?conversationId=${conversationId}`
      : `${this.apiUrl}/clear/${userId}`;
    return this.http.delete<ClearResponse>(url);
  }
}