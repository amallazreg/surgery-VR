import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  standalone : true,
  imports: [CommonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage{

  mousePosition = { x: 0, y: 0 };
  scrollY = 0;
  activeTab = 0;
  language: 'fr' | 'en' = 'fr';
  mobileMenuOpen = false;

  translations: any = {
    fr: {
      nav: { solutions: 'Solutions', platform: 'Plateforme', about: 'À propos', contact: 'Contact', demo: 'Essai gratuit' },
      hero: {
        badge: 'TECHNOLOGIE MÉDICALE VR',
        pretitle: 'Bienvenue dans',
        title: 'LE FUTUR',
        subtitle: 'DE LA MÉDECINE',
        description: "Une plateforme de simulation VR qui transforme radicalement l'apprentissage médical.",
        cta1: 'Découvrir la plateforme',
        cta2: 'Voir une démo live',
        trust: 'Approuvé par 50+ institutions médicales'
      }
    },
    en: {
      nav: { solutions: 'Solutions', platform: 'Platform', about: 'About', contact: 'Contact', demo: 'Free Trial' },
      hero: {
        badge: 'VR MEDICAL TECHNOLOGY',
        pretitle: 'Welcome to',
        title: 'THE FUTURE',
        subtitle: 'OF MEDICINE',
        description: 'A VR simulation platform transforming medical learning.',
        cta1: 'Explore Platform',
        cta2: 'Watch Live Demo',
        trust: 'Trusted by 50+ institutions'
      }
    }
  };

  get t() {
    return this.translations[this.language];
  }

  setLanguage(lang: 'fr' | 'en') {
    this.language = lang;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  setActiveTab(index: number) {
    this.activeTab = index;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mousePosition = { x: event.clientX, y: event.clientY };
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrollY = window.scrollY;
  }

  solutions = [
  {
    title: 'Chirurgie Immersive',
    subtitle: 'Précision extrême',
    description: 'Des simulations chirurgicales photoréalistes avec retour haptique avancé.',
    features: ['500+ procédures', 'Retour temps réel', 'Protocoles validés'],
    color: 'blue'
  },
  {
    title: 'Gestion d\'Urgence',
    subtitle: 'Décisions critiques',
    description: 'Entraînement aux situations d\'urgence avec gestion du stress.',
    features: ['Scénarios critiques', 'Travail d\'équipe', 'Analyse de performance'],
    color: 'pink'
  },
  {
    title: 'Formation Continue',
    subtitle: 'Excellence durable',
    description: 'Programmes de formation évolutifs pour tous les niveaux.',
    features: ['Parcours personnalisés', 'Certifications', 'Suivi détaillé'],
    color: 'purple'
  }
];

features = [
  {
    icon: 'immersion',
    title: 'Immersion totale 360°',
    text: 'Environnements 3D photoréalistes avec physique médicale authentique'
  },
  {
    icon: 'ai',
    title: 'IA adaptative',
    text: 'Scénarios qui évoluent selon vos décisions'
  },
  {
    icon: 'collab',
    title: 'Multi-joueurs temps réel',
    text: 'Formez vos équipes ensemble'
  },
  {
    icon: 'analytics',
    title: 'Analytics avancées',
    text: 'Données précises sur chaque geste'
  },
  {
    icon: 'haptic',
    title: 'Retour haptique',
    text: 'Sensations tactiles réalistes'
  },
  {
    icon: 'library',
    title: 'Bibliothèque géante',
    text: '1000+ cas cliniques prêts'
  }
];

}