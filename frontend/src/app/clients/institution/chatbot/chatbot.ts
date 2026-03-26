// chatbot.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SideBar } from '../side-bar/side-bar';
import { ChatbotService } from '../../../services/chatbot-service';
// Ajouter dans les imports
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// ── Interfaces ──
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

  // ── User info (à remplacer par ton AuthService) ──
  userId       = 'user123'; // ← remplacer par l'id réel de l'utilisateur connecté
  userName     = 'Dr. Clara Martin';
  userInitials = 'DC';

  // ── State ──
  inputText       = '';
  inputFocused    = false;
  isTyping        = false;
  showWelcome     = true;
  showSuggestions = true;
  isLoadingHistory = false;
  messages: ChatMessage[] = [];

  private shouldScroll = false;

  // ── Suggestion chips ──
  suggestions: Suggestion[] = [
    { icon: '🥽', text: 'Comment démarrer une simulation ?' },
    { icon: '🔪', text: 'Quels instruments pour l\'appendicectomie ?' },
    { icon: '🧠', text: 'Expliquez moi la craniotomie' },
    { icon: '🎮', text: 'Comment utiliser les controllers VR ?' },
  ];

  constructor(private chatbotApi: ChatbotService,private sanitizer: DomSanitizer,
        private cdr: ChangeDetectorRef

   ) {}

  // ── Lifecycle ──

  ngOnInit(): void {
    this.loadHistory();
  }

 ngAfterViewChecked(): void {
  if (this.shouldScroll) {
    this.shouldScroll = false; 
    this.scrollToBottom();
  }
}

  // ── Charger l'historique depuis le backend ──
  loadHistory(): void {
    this.isLoadingHistory = true;

    this.chatbotApi.getHistory(this.userId).subscribe({
      next: (res) => {
        this.isLoadingHistory = false;
                this.cdr.detectChanges();

        if (res.messages && res.messages.length > 0) {
          // Historique existant → afficher les messages
          this.showWelcome = false;
          this.showSuggestions = false;

          this.messages = res.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'ai' : 'user',
            text: msg.content,
            time: this.formatDate(msg.createdAt)
            
          }));
                          this.cdr.detectChanges();

          this.shouldScroll = true;
        } else {
          // Pas d'historique → message de bienvenue
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

  // ── Envoyer un message ──
  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isTyping) return;

    // 1. Afficher le message utilisateur immédiatement
    this.addMessage({ role: 'user', text, time: this.now() });
    this.inputText = '';
    this.resetTextareaHeight();
    this.showSuggestions = false;
    this.showWelcome = false;

    // 2. Afficher le typing indicator
    this.isTyping = true;
    this.shouldScroll = true;

    // 3. Appeler le backend
    this.chatbotApi.sendMessage(this.userId, text).subscribe({
      next: (res) => {
        this.isTyping = false;
        if (res.success) {
          this.addMessage({
            role: 'ai',
            text: res.response,
            time: this.now()
          });
        this.cdr.detectChanges();
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

formatMessage(text: string): SafeHtml {
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  return this.sanitizer.bypassSecurityTrustHtml(formatted);
}

  // ── Envoyer une suggestion ──
  sendSuggestion(text: string): void {
    this.inputText = text;
    this.sendMessage();
  }

  // ── Effacer l'historique ──
  clearChat(): void {
    this.chatbotApi.clearHistory(this.userId).subscribe({
      next: (res) => {
        if (res.success) {
          this.messages = [];
          this.showWelcome = true;
          this.showSuggestions = true;
          this.isTyping = false;
          this.addWelcomeMessage();
        }
      },
      error: () => {
        console.error('Erreur lors de la suppression de l\'historique');
      }
    });
  }

  // ── Gestion clavier ──
  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // ── Auto resize textarea ──
  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  // ── Private helpers ──

  private addWelcomeMessage(): void {
    this.messages = [];
    this.addMessage({
      role: 'ai',
      time: this.now(),
      text: 'Bonjour ! Je suis votre assistant pédagogique SurgeryVR 🎓\n\nJe peux vous aider à comprendre les simulations chirurgicales, les instruments utilisés, et l\'utilisation du casque VR. Comment puis-je vous aider ?'
    });
  }

  private addMessage(msg: ChatMessage): void {
    this.messages.push(msg);
    this.shouldScroll = true;
  }

  private scrollToBottom(): void {
    try {
      const el = this.chatAreaRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  private resetTextareaHeight(): void {
    if (this.chatInputRef) {
      this.chatInputRef.nativeElement.style.height = 'auto';
    }
  }

  private now(): string {
    const d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' +
           d.getMinutes().toString().padStart(2, '0');
  }

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.getHours().toString().padStart(2, '0') + ':' +
           d.getMinutes().toString().padStart(2, '0');
  }
}