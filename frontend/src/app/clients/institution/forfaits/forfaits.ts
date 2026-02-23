import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SideBar } from "../side-bar/side-bar";


export interface PlanFeature {
  text: string;
  yes: boolean;
}

export interface Plan {
  key: string;
  icon: string;
  name: string;
  price: string;
  priceYearly: string;
  priceSub: string;
  desc: string;
  tagline: string;
  surveys: string;
  respondents: string;
  apk: string;
  storage: string;
  features: PlanFeature[];
  headerBg: string;
  isPopular?: boolean;
  isCurrent?: boolean;
  cardClass: string;
}

export type PaymentMethod = 'card' | 'virement' | 'd17' | 'flouci';


@Component({
  selector: 'app-forfaits',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBar],  
  templateUrl: './forfaits.html',
  styleUrl: './forfaits.css',
})
export class Forfaits  implements OnInit {

  isYearly = false;

  plans: Plan[] = [
    {
      key: 'starter',
      icon: '🌱',
      name: 'Starter',
      tagline: 'Parfait pour commencer',
      price: '149',
      priceYearly: '119',
      priceSub: 'DT / mois',
      desc: 'Parfait pour découvrir la puissance des enquêtes VR. Idéal pour un point de vente unique.',
      surveys: '1 enquête',
      respondents: '100 / mois',
      apk: '1 APK',
      storage: '1 Go',
      headerBg: 'linear-gradient(145deg, #1A2B5F, #2D3E6F)',
      cardClass: 'starter',
      features: [
        { text: '1 enquête VR active', yes: true },
        { text: '1 APK fourni', yes: true },
        { text: 'Tableau de bord basique', yes: true },
        { text: 'Support par email', yes: true },
        { text: 'Export Excel / CSV', yes: false },
        { text: 'Support prioritaire', yes: false },
        { text: 'Multi-sites', yes: false },
        { text: 'API & Intégrations', yes: false },
      ]
    },
    {
      key: 'pro',
      icon: '⚡',
      name: 'Pro',
      tagline: 'Pour les équipes actives',
      price: '349',
      priceYearly: '279',
      priceSub: 'DT / mois',
      desc: 'Idéal pour les équipes actives qui déploient des enquêtes VR en multi-points de vente.',
      surveys: '5 enquêtes',
      respondents: '500 / mois',
      apk: '5 APK',
      storage: '5 Go',
      headerBg: 'linear-gradient(145deg, #0A1635, #1a2d5a)',
      cardClass: 'pro',
      isPopular: true,
      isCurrent: true,
      features: [
        { text: '5 enquêtes VR actives', yes: true },
        { text: '5 APK fournis', yes: true },
        { text: 'Dashboard analytique avancé', yes: true },
        { text: 'Support prioritaire', yes: true },
        { text: 'Export Excel / CSV', yes: true },
        { text: 'Notifications temps réel', yes: true },
        { text: 'Multi-sites', yes: false },
        { text: 'API & Intégrations', yes: false },
      ]
    },
    {
      key: 'business',
      icon: '🏢',
      name: 'Business',
      tagline: 'Multi-sites & grandes équipes',
      price: '699',
      priceYearly: '559',
      priceSub: 'DT / mois',
      desc: 'Pour les grandes enseignes et les équipes multi-sites. Toutes les fonctionnalités Pro plus un support dédié.',
      surveys: '20 enquêtes',
      respondents: '2 000 / mois',
      apk: '20 APK',
      storage: '20 Go',
      headerBg: 'linear-gradient(135deg, #B45309, #D97706)',
      cardClass: 'business',
      features: [
        { text: '20 enquêtes VR actives', yes: true },
        { text: '2 000 répondants par mois', yes: true },
        { text: '20 APK fournis', yes: true },
        { text: '20 Go de stockage cloud', yes: true },
        { text: 'Dashboard multi-sites', yes: true },
        { text: 'Support dédié', yes: true },
        { text: 'Export Excel / CSV', yes: true },
        { text: 'Rapports personnalisés', yes: true },
        { text: 'Intégrations avancées', yes: true },
        { text: 'API (lecture)', yes: true },
      ]
    },
  
  ];

  // ── Compare table data ──────────────────────────────────
  compareRows = [
    { label: 'Enquêtes VR actives',  vals: ['1', '5', '20', '∞'] },
    { label: 'Répondants / mois',    vals: ['100', '500', '2 000', '∞'] },
    { label: 'APK inclus',           vals: ['1', '5', '20', '∞'] },
    { label: 'Stockage cloud',       vals: ['1 Go', '5 Go', '20 Go', '∞'] },
    { label: 'Support prioritaire',  bools: [false, true, true, true] },
    { label: 'Export Excel / CSV',   bools: [false, true, true, true] },
    { label: 'Dashboard multi-sites',bools: [false, false, true, true] },
    { label: 'API & Intégrations',   bools: [false, false, false, true] },
  ];

  // ── FAQ ─────────────────────────────────────────────────
  faqs = [
    {
      q: 'Puis-je changer de forfait à tout moment ?',
      a: 'Oui, vous pouvez passer à un forfait supérieur immédiatement. Le passage à un forfait inférieur prend effet à la fin de la période de facturation en cours.',
      open: false
    },
    {
      q: 'Quels moyens de paiement sont acceptés ?',
      a: 'Nous acceptons les cartes bancaires Visa / Mastercard, le virement bancaire (RIB), et le paiement mobile via D17 et Flouci.',
      open: false
    },
    {
      q: 'Y a-t-il une période d\'essai gratuite ?',
      a: 'Oui, tous les nouveaux comptes bénéficient de 14 jours d\'essai gratuit sur le forfait Pro, sans carte bancaire requise.',
      open: false
    }
  ];

  // ── Modal state ─────────────────────────────────────────
  isModalOpen = false;
  selectedPlan: Plan | null = null;
  currentStep = 1;
  isProcessing = false;
  isSuccess = false;

  // ── Payment form ────────────────────────────────────────
  selectedPayMethod: PaymentMethod = 'card';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardName = '';

  // ── Computed ─────────────────────────────────────────────
  get currentPrice(): string {
    if (!this.selectedPlan) return '';
    return this.isYearly ? this.selectedPlan.priceYearly : this.selectedPlan.price;
  }

  get billingLabel(): string {
    return this.isYearly ? 'Annuelle (−20%)' : 'Mensuelle';
  }

  get payMethodLabel(): string {
    const labels: Record<PaymentMethod, string> = {
      card: 'Carte bancaire',
      virement: 'Virement bancaire',
      d17: 'D17 Mobile',
      flouci: 'Flouci'
    };
    return labels[this.selectedPayMethod];
  }

  get modalHeaderBg(): string {
    return this.selectedPlan?.headerBg ?? '';
  }

  get stepHint(): string {
    const hints = ['Vérifiez les détails de votre forfait', 'Choisissez votre mode de paiement', 'Vérifiez votre commande avant de payer'];
    return hints[this.currentStep - 1];
  }

  get nextBtnLabel(): string {
    if (this.isProcessing) return '⏳ Traitement...';
    if (this.currentStep === 3) return '💳 Payer maintenant';
    return 'Continuer →';
  }

  getPlanPrice(plan: Plan): string {
    return this.isYearly ? plan.priceYearly : plan.price;
  }

  ngOnInit(): void {}

  // ── Billing toggle ──────────────────────────────────────
  toggleBilling(): void {
    this.isYearly = !this.isYearly;
  }

  // ── Modal ────────────────────────────────────────────────
  openModal(plan: Plan): void {
    this.selectedPlan = plan;
    this.currentStep = 1;
    this.isSuccess = false;
    this.selectedPayMethod = 'card';
    this.cardNumber = '';
    this.cardExpiry = '';
    this.cardCvv = '';
    this.cardName = '';
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSuccess = false;
    document.body.style.overflow = '';
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  // ── Steps ────────────────────────────────────────────────
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    } else {
      this.processPayment();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isStepActive(step: number): boolean { return this.currentStep === step; }
  isStepDone(step: number): boolean { return this.currentStep > step; }

  // ── Payment ──────────────────────────────────────────────
  selectPayMethod(method: PaymentMethod): void {
    this.selectedPayMethod = method;
  }

  processPayment(): void {
    this.isProcessing = true;
    setTimeout(() => {
      this.isProcessing = false;
      this.isSuccess = true;
    }, 2000);
  }

  // ── Card formatting ──────────────────────────────────────
  formatCard(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').substring(0, 16);
    this.cardNumber = v.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) v = v.substring(0, 2) + ' / ' + v.substring(2);
    this.cardExpiry = v;
  }

  // ── FAQ ──────────────────────────────────────────────────
  toggleFaq(faq: any): void {
    faq.open = !faq.open;
  }

  // ── Nav ──────────────────────────────────────────────────
  navItems = [
    { icon: '🏠', label: 'Dashboard', badge: null, active: false, route: '/dashboard' },
    { icon: '🥽', label: 'Mes Enquêtes VR', badge: 3, active: false, route: '/enquetes' },
    { icon: '📋', label: 'Mes Demandes', badge: 2, active: false, route: '/demandes' },
    { icon: '📱', label: 'Mes APK', badge: null, active: false, route: '/apk' },
    { icon: '📊', label: 'Résultats & Stats', badge: null, active: false, route: '/stats' },
    { icon: '💎', label: 'Forfaits', badge: null, active: true, route: '/forfaits' },
    { icon: '⚙️', label: 'Mon Compte', badge: null, active: false, route: '/compte' },
    { icon: '🎧', label: 'Support', badge: null, active: false, route: '/support' },
  ];

  navSections = [
    { label: 'Général', items: [0, 1, 2] },
    { label: 'Application', items: [3, 4] },
    { label: 'Compte', items: [5, 6, 7] },
  ];
}