import { CommonModule } from '@angular/common';
import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SideBar } from "../side-bar/side-bar";
import { ForfaitService } from '../../../services/forfait-service';
import { Payement } from '../../../services/payement';
import { ActivatedRoute } from '@angular/router';

export interface PlanFeature {
  text: string;
  yes: boolean;
}

export interface Plan {
  _id : string
  key: string;
  icon: string;
  name: string;
  price: string;
  priceYearly: string;
  priceSub: string;
  desc: string;
  tagline: string;
  experiences: string;
  apk: string;
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

  constructor(private forfaitService: ForfaitService,private paymentService : Payement,private route: ActivatedRoute,
        private cdr: ChangeDetectorRef  

   ) {}

  isYearly = false;

 plans: Plan[] = [];

  // ── Compare table data ──────────────────────────────────
  compareRows = [
    { label: 'Expériences VR actives',  vals: ['5', '12', '20'] },
    { label: 'Accès aux expériences VR de base ', bools: [true, true, true]},
    { label: 'Accès aux expériences VR avancées',  bools: [false, true, true] },
    { label: 'interactions et scénarios complexes',   bools: [false, true, true] },
    { label: 'Rapports PDF de synthèse des expériences',bools: [false, true, true] },
    { label: 'Simulation Esthétique Médicale par IA',   bools: [false, false, true] },
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

  isModalOpen = false;
  selectedPlan: Plan | null = null;
  currentStep = 1;
  isProcessing = false;
  isSuccess = false;

  selectedPayMethod: PaymentMethod = 'card';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardName = '';

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

ngOnInit(): void {
  
  this.loadForfaits();
}

loadForfaits(): void {
  this.forfaitService.getAllForfaits().subscribe({
    next: (data) => {
      this.plans = data.map((f: any) => ({
        _id: f._id,
        key: f.name.toLowerCase(),
        icon: this.getIcon(f.name),
        name: f.name,
        tagline: f.tagline,
        price: f.price?.toString(),
        priceYearly: f.priceYearly?.toString(),
        priceSub: 'DT / mois',
        desc: f.tagline,
        experiences: `${f.experiences} expériences`,
        apk: `${f.apk} APK`,
        headerBg: this.getHeaderBg(f.name),
        cardClass: f.name.toLowerCase(),
        features: f.features || []
      }));
             this.cdr.detectChanges();

    },
    error: (err) => {
      console.error('Erreur chargement forfaits', err);
    }
  });
}

getIcon(name: string): string {
  switch (name.toLowerCase()) {
    case 'standard': return '🌱';
    case 'pro': return '⚡';
    case 'business': return '🏢';
    default: return '💎';
  }
}

getHeaderBg(name: string): string {
  switch (name.toLowerCase()) {
    case 'standard': return 'linear-gradient(145deg, #1A2B5F, #2D3E6F)';
    case 'pro': return 'linear-gradient(145deg, #0A1635, #1a2d5a)';
    case 'business': return 'linear-gradient(135deg, #B45309, #D97706)';
    default: return 'linear-gradient(135deg, #444, #222)';
  }
}
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

  if (!this.selectedPlan) return;

  this.isProcessing = true;

  const userId = localStorage.getItem('userId'); 
  const forfaitId = this.selectedPlan._id; 

  console.log("Selected Plan:", this.selectedPlan);
    console.log("Selected user :", userId);

console.log("Forfait ID envoyé:", this.selectedPlan._id);

  this.paymentService.createCheckoutSession(
    userId!,
    forfaitId
  ).subscribe({
    
    next: (res) => {
      
      window.location.href = res.url;
    },
    error: (err) => {
      console.error(err);
      this.isProcessing = false;
    }
  });
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

}