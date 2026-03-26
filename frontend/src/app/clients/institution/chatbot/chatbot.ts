// chatbot.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SideBar } from '../side-bar/side-bar';
import { ChatbotService, Conversation } from '../../../services/chatbot-service';

export interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  time: string;
  isError?: boolean;
}

export interface Suggestion {
  icon: string;
  text: string;
}

export interface GroupedConversations {
  label: string;
  conversations: Conversation[];
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBar],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot implements OnInit, AfterViewChecked {

  @ViewChild('chatArea') chatAreaRef!: ElementRef<HTMLDivElement>;
  @ViewChild('chatInput') chatInputRef!: ElementRef<HTMLTextAreaElement>;

  // ── User info ──
  userId       = 'user123';
  userName     = 'Dr. Clara Martin';
  userInitials = 'DC';

  // ── State Chat ──
  inputText              = '';
  inputFocused           = false;
  isTyping               = false;
  showWelcome            = true;
  showSuggestions        = true;
  isLoadingHistory       = false;
  messages: ChatMessage[]= [];
  currentConversationId: string | null = null;
  currentTitle           = '';

  // ── State Historique ──
  showHistoryPanel          = false;
  isLoadingConversations    = false;
  groupedConversations: GroupedConversations[] = [];

  private shouldScroll = false;

  suggestions: Suggestion[] = [
    { icon: '🥽', text: 'Comment démarrer une simulation ?' },
    { icon: '🔪', text: 'Quels instruments pour l\'appendicectomie ?' },
    { icon: '🧠', text: 'Expliquez moi la craniotomie' },
    { icon: '🎮', text: 'Comment utiliser les controllers VR ?' },
  ];

  constructor(
    private chatbotApi: ChatbotService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadHistory();
    this.loadConversations();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.shouldScroll = false;
      this.scrollToBottom();
    }
  }

  // ── Charger la conversation active ──
  loadHistory(): void {
    this.isLoadingHistory = true;
    this.chatbotApi.getHistory(this.userId).subscribe({
      next: (res) => {
        this.isLoadingHistory = false;
        if (res.messages && res.messages.length > 0) {
          this.showWelcome = false;
          this.showSuggestions = false;
          this.currentConversationId = res.conversationId;
          this.currentTitle = res.title;
          this.messages = res.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'ai' : 'user',
            text: msg.content,
            time: this.formatDate(msg.createdAt)
          }));
          this.shouldScroll = true;
        } else {
          this.showWelcome = true;
          this.showSuggestions = true;
          this.addWelcomeMessage();
        }
      },
      error: () => {
        this.isLoadingHistory = false;
        this.addWelcomeMessage();
      }
    });
  }

  // ── Charger toutes les conversations ──
  loadConversations(): void {
    this.isLoadingConversations = true;
    this.chatbotApi.getConversations(this.userId).subscribe({
      next: (res) => {
        this.isLoadingConversations = false;
        this.groupConversationsByDate(res.conversations);
      },
      error: () => { this.isLoadingConversations = false; }
    });
  }

  // ── Grouper par date ──
  groupConversationsByDate(conversations: Conversation[]): void {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek  = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { [key: string]: Conversation[] } = {
      'Aujourd\'hui': [],
      'Hier': [],
      'Cette semaine': [],
      'Plus ancien': []
    };

    for (const conv of conversations) {
      const d = new Date(conv.updatedAt);
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (day.getTime() === today.getTime())          groups['Aujourd\'hui'].push(conv);
      else if (day.getTime() === yesterday.getTime()) groups['Hier'].push(conv);
      else if (d >= lastWeek)                         groups['Cette semaine'].push(conv);
      else                                            groups['Plus ancien'].push(conv);
    }

    this.groupedConversations = Object.entries(groups)
      .filter(([_, c]) => c.length > 0)
      .map(([label, conversations]) => ({ label, conversations }));
  }

  // ── Nouvelle conversation ──
  newConversation(): void {
    this.chatbotApi.createConversation(this.userId).subscribe({
      next: (res) => {
        if (res.success) {
          this.currentConversationId = res.conversationId;
          this.currentTitle = '';
          this.messages = [];
          this.showWelcome = true;
          this.showSuggestions = true;
          this.showHistoryPanel = false;
          this.addWelcomeMessage();
          this.loadConversations();
        }
      }
    });
  }

  // ── Sélectionner une conversation ──
  selectConversation(conv: Conversation): void {
    if (conv.id === this.currentConversationId) {
      this.showHistoryPanel = false;
      return;
    }
    this.isLoadingHistory = true;
    this.showHistoryPanel = false;

    this.chatbotApi.switchConversation(conv.id, this.userId).subscribe({
      next: (res) => {
        this.isLoadingHistory = false;
        this.currentConversationId = res.conversationId;
        this.currentTitle = res.title;
        this.messages = res.messages.map(msg => ({
          role: msg.role === 'assistant' ? 'ai' : 'user',
          text: msg.content,
          time: this.formatDate(new Date().toISOString())
        }));
        this.showWelcome = false;
        this.showSuggestions = false;
        this.shouldScroll = true;
        this.loadConversations();
      },
      error: () => { this.isLoadingHistory = false; }
    });
  }

  // ── Supprimer une conversation ──
  deleteConversation(conv: Conversation, event: Event): void {
    event.stopPropagation();
    this.chatbotApi.clearHistory(this.userId, conv.id).subscribe({
      next: (res) => {
        if (res.success) {
          if (conv.id === this.currentConversationId) {
            this.messages = [];
            this.currentConversationId = null;
            this.showWelcome = true;
            this.showSuggestions = true;
            this.addWelcomeMessage();
          }
          this.loadConversations();
        }
      }
    });
  }

  // ── Envoyer un message ──
  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isTyping) return;

    this.addMessage({ role: 'user', text, time: this.now() });
    this.inputText = '';
    this.resetTextareaHeight();
    this.showSuggestions = false;
    this.showWelcome = false;
    this.isTyping = true;
    this.shouldScroll = true;

    this.chatbotApi.sendMessage(this.userId, text, this.currentConversationId || undefined).subscribe({
      next: (res) => {
        this.isTyping = false;
        if (res.success) {
          this.currentConversationId = res.conversationId;
          this.currentTitle = res.title;
          this.addMessage({ role: 'ai', text: res.response, time: this.now() });
          this.loadConversations();
        }
      },
      error: () => {
        this.isTyping = false;
        this.addMessage({
          role: 'ai',
          text: '❌ Une erreur est survenue. Veuillez réessayer.',
          time: this.now(),
          isError: true
        });
      }
    });
  }

  // ── Effacer la conversation active ──
  clearChat(): void {
    if (!this.currentConversationId) return;
    this.chatbotApi.clearHistory(this.userId, this.currentConversationId).subscribe({
      next: (res) => {
        if (res.success) {
          this.messages = [];
          this.currentConversationId = null;
          this.currentTitle = '';
          this.showWelcome = true;
          this.showSuggestions = true;
          this.addWelcomeMessage();
          this.loadConversations();
        }
      }
    });
  }

  toggleHistoryPanel(): void {
    this.showHistoryPanel = !this.showHistoryPanel;
    if (this.showHistoryPanel) this.loadConversations();
  }

  sendSuggestion(text: string): void {
    this.inputText = text;
    this.sendMessage();
  }

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  formatMessage(text: string): SafeHtml {
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  private addWelcomeMessage(): void {
    this.messages = [];
    this.addMessage({
      role: 'ai', time: this.now(),
      text: 'Bonjour ! Je suis votre assistant pédagogique SurgeryVR 🎓\n\nJe peux vous aider à comprendre les simulations chirurgicales, les instruments utilisés, et l\'utilisation du casque VR. Comment puis-je vous aider ?'
    });
  }

  private addMessage(msg: ChatMessage): void {
    this.messages.push(msg);
    this.shouldScroll = true;
  }

  private scrollToBottom(): void {
    try { this.chatAreaRef.nativeElement.scrollTop = this.chatAreaRef.nativeElement.scrollHeight; } catch {}
  }

  private resetTextareaHeight(): void {
    if (this.chatInputRef) this.chatInputRef.nativeElement.style.height = 'auto';
  }

  private now(): string {
    const d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }
}