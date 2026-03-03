import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import {OnInit,ViewChild,ElementRef,AfterViewChecked} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SideBar } from "../side-bar/side-bar";


export interface ChatCard {
  icon: string;
  color: 'blue' | 'green' | 'pink';
  title: string;
  desc: string;
}

export interface ChatTag {
  label: string;
  color: 'blue' | 'green' | 'pink';
}

export interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  time: string;
  cards?: ChatCard[];
  tags?: ChatTag[];
}

export interface Suggestion {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-chatbot',
  standalone : true,
  imports: [CommonModule, FormsModule, SideBar],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot implements OnInit, AfterViewChecked {

  @ViewChild('chatArea') chatAreaRef!: ElementRef<HTMLDivElement>;
  @ViewChild('chatInput') chatInputRef!: ElementRef<HTMLTextAreaElement>;

  // ── User info (replace with auth service data) ──
  userName     = 'Dr. Clara Martin';
  userInitials = 'DC';

  // ── State ──
  inputText      = '';
  inputFocused   = false;
  isTyping       = false;
  showWelcome    = true;
  showSuggestions = true;
  messages: ChatMessage[] = [];

  private shouldScroll = false;

  // ── Suggestion chips ──
  suggestions: Suggestion[] = [
    { icon: '🥽', text: 'Comment démarrer une simulation ?' },
    { icon: '📊', text: 'Voir mes statistiques de performance' },
    { icon: '💎', text: 'Comparer les forfaits' },
    { icon: '🔧', text: 'Problème technique' },
  ];

  // ── Default AI responses (replace with real API call) ──
  private aiResponses: string[] = [
    "Je comprends votre question. D'après les données de votre dernière session, votre progression est remarquable. Continuez à pratiquer le module recommandé quotidiennement.",
    "Excellente question ! La simulation que vous mentionnez nécessite une configuration spécifique. Je vous recommande de vérifier vos paramètres VR dans les réglages avancés.",
    "Votre score de performance est dans le top 15% des utilisateurs de votre spécialité. Pour progresser davantage, je vous suggère de revoir les modules de niveau intermédiaire.",
    "Je vais analyser vos statistiques récentes… Votre temps de réaction s'est amélioré de 8% cette semaine. C'est un excellent indicateur de progression !",
  ];

  private responseIndex = 0;

  // ── Lifecycle ──

  ngOnInit(): void {
    // Push the initial AI welcome message
    this.messages.push({
      role: 'ai',
      time: this.now(),
      text: 'Bonjour ! Je suis prêt à vous assister. Voici ce que je peux faire pour vous aujourd\'hui :',
      tags: [
        { label: '🏥 Simulations', color: 'blue' },
        { label: '📈 Statistiques', color: 'green' },
        { label: '💡 Conseils',     color: 'pink' },
      ],
      cards: [
        {
          icon: '🥽',
          color: 'blue',
          title: 'Simulation active détectée',
          desc: 'Appendicectomie laparoscopique — Module 3 en cours. Score actuel : 87/100',
        },
      ],
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  // ── Public methods ──

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text) return;

    this.addMessage({ role: 'user', text, time: this.now() });
    this.inputText = '';
    this.resetTextareaHeight();
    this.showSuggestions = false;

    this.isTyping = true;
    this.shouldScroll = true;

    const delay = 1400 + Math.random() * 600;
    setTimeout(() => {
      this.isTyping = false;
      this.addMessage({
        role: 'ai',
        text: this.aiResponses[this.responseIndex % this.aiResponses.length],
        time: this.now(),
      });
      this.responseIndex++;
    }, delay);
  }

  sendSuggestion(text: string): void {
    this.inputText = text;
    this.sendMessage();
    this.showSuggestions = false;
  }

  clearChat(): void {
    this.messages = [];
    this.showWelcome = true;
    this.showSuggestions = true;
    this.isTyping = false;
    this.responseIndex = 0;
    this.ngOnInit();
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

  // ── Private helpers ──

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
}
