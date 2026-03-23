import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ForfaitService } from '../../../services/forfait-service';
import { SideBarEtudiant } from '../side-bar-etudiant/side-bar-etudiant';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Payement } from '../../../services/payement';

@Component({
  selector: 'app-forfait-etudiant',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBarEtudiant], 
  templateUrl: './forfait-etudiant.html',
  styleUrl: './forfait-etudiant.css',
})
export class ForfaitEtudiant  implements OnInit {
 
  // ── Data ─────────────────────────────────────────────────
  forfaits: any[]      = [];
  abonnementActif: any = null;
  isLoading            = true;
  souscriptionLoading  = '';
 
  // ── Modal ─────────────────────────────────────────────────
  isModalOpen   = false;
  selectedPlan: any = null;
  currentStep   = 1;
  isProcessing  = false;
  isSuccess     = false;
 
  // ── FAQ ───────────────────────────────────────────────────
  faqs = [
    {
      q: 'Puis-je accéder aux expériences immédiatement après le paiement ?',
      a: 'Oui, votre accès est activé automatiquement dès la confirmation du paiement Stripe. Vous pouvez lancer vos expériences VR dans les secondes qui suivent.',
      open: false,
    },
    {
      q: 'Que se passe-t-il à l\'expiration de mon forfait ?',
      a: 'Votre accès aux expériences VR est suspendu à la date d\'expiration. Vous pouvez souscrire à un nouveau forfait à tout moment pour retrouver votre accès.',
      open: false,
    },
    {
      q: 'Les forfaits étudiants sont-ils différents des forfaits institutionnels ?',
      a: 'Oui, les forfaits étudiants donnent accès à un sous-ensemble d\'expériences VR ciblées, sans APK ni formation institutionnelle. Ils sont conçus pour un usage individuel et autonome.',
      open: false,
    },
    {
      q: 'Puis-je souscrire si mon institution a déjà un abonnement ?',
      a: 'Oui, vous pouvez cumuler un accès via code institution et un abonnement personnel. Les expériences des deux sources seront disponibles simultanément.',
      open: false,
    },
    {
      q: 'Mon paiement est-il sécurisé ?',
      a: 'Absolument. Les paiements sont gérés par Stripe, leader mondial du paiement en ligne. Vos données bancaires ne transitent jamais par nos serveurs.',
      open: false,
    },
  ];
 
  constructor(
   private forfaitService: ForfaitService,
    private cdr: ChangeDetectorRef,
  private paymentService : Payement,
  private route: ActivatedRoute
  ) {}
 
  ngOnInit(): void {
    this.loadForfaits();
  }
 
  // ════════════════════════════════════════════════════════
  // CHARGEMENT
  // ════════════════════════════════════════════════════════
loadForfaits(): void {
  this.forfaitService.getForfaitsByCible('etudiant').subscribe({
    next: (data) => {
      this.forfaits = data.map((f: any) => ({
        _id:          f._id,
        name:         f.name,
        tagline:      f.tagline,
        desc:         f.desc,
        price:        f.price,
        dureeJours:   f.dureeJours,
        nbExperiences: f.nbExperiences || 0,
        badge:        f.badge || '',
        features:     f.features || [],
        actif:        f.actif,
      }));
      this.isLoading = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  });
}
  // ════════════════════════════════════════════════════════
  // MODAL
  // ════════════════════════════════════════════════════════
  openModal(plan: any): void {
    // Ne pas ouvrir si c'est le plan actuel
    if (this.abonnementActif?.forfait === plan.name) return;
 
    this.selectedPlan = plan;
    this.currentStep  = 1;
    this.isSuccess    = false;
    this.isProcessing = false;
    this.isModalOpen  = true;
    document.body.style.overflow = 'hidden';
  }
 
  closeModal(): void {
    this.isModalOpen  = false;
    this.selectedPlan = null;
    this.isSuccess    = false;
    this.isProcessing = false;
    document.body.style.overflow = '';
  }
 
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }
 
  // ════════════════════════════════════════════════════════
  // NAVIGATION STEPS
  // ════════════════════════════════════════════════════════
nextStep(): void {
  if (this.currentStep < 3) {
    this.currentStep++;
    return;
  }
  // Step 3 → lancer le paiement
  this.processPayment();
}
 
  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }
 
  isStepActive(step: number): boolean { return this.currentStep === step; }
  isStepDone(step: number): boolean   { return this.currentStep > step; }
 
  // ════════════════════════════════════════════════════════
  // GETTERS UI
  // ════════════════════════════════════════════════════════
  get nextBtnLabel(): string {
    if (this.isProcessing) return 'Redirection...';
    if (this.currentStep === 3) return '💳 Payer maintenant';
    return 'Continuer →';
  }
 
  get stepHint(): string {
    const hints: Record<number, string> = {
      1: 'Vérifiez les détails du forfait',
      2: 'Choisissez votre moyen de paiement',
      3: 'Confirmez votre commande',
    };
    return hints[this.currentStep] ?? '';
  }
 
  // ════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════
  getMaxExperiences(): number {
    if (!this.forfaits.length) return 0;
    return Math.max(...this.forfaits.map(f => f.nbExperiences || 0));
  }
 
  getMinPrice(): number {
    if (!this.forfaits.length) return 0;
    return Math.min(...this.forfaits.map(f => f.price || 0));
  }
 
  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
 
  toggleFaq(faq: any): void {
    faq.open = !faq.open;
  }

  // ── Ajoute ces méthodes dans ForfaitEtudiant (forfait-etudiant.ts) ──

// Classe du header selon la position de la card
getPlanHeaderClass(index: number): string {
  const classes = ['h-0', 'h-1', 'h-2'];
  return classes[index % 3];
}

// Couleur du texte : blanc sur fond sombre/coloré, sombre sur fond clair
getPlanTextClass(index: number): string {
  return index % 3 === 0 ? 'text-dark' : 'text-white';
}

// Classe du bouton CTA selon la position
getPlanCtaClass(index: number): string {
  const classes = ['cta-0', 'cta-1', 'cta-2'];
  return classes[index % 3];
}

// Background de la modal hero selon le forfait
getModalBg(plan: any): string {
  const idx = this.forfaits.indexOf(plan);
  const bgs = [
    'linear-gradient(145deg, #1A2B5F, #2D3E6F)',
    'linear-gradient(145deg, #0A1635, #1a2d5a)',
    'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
  ];
  return bgs[idx % 3];
}

// ══════════════════════════════════════════════════════════
// AJOUTER dans ForfaitEtudiant (forfait-etudiant.ts)
// ══════════════════════════════════════════════════════════

// ── Getter compareRows ────────────────────────────────────
// Construit les lignes du tableau comparatif dynamiquement
// en faisant l'union de toutes les features des forfaits
get compareRows(): { label: string; vals: boolean[] }[] {
  if (!this.forfaits?.length) return [];

  // Récupère tous les labels uniques de features
  const allLabels = new Set<string>();
  this.forfaits.forEach(f => {
    (f.features || []).forEach((feat: any) => {
      allLabels.add(feat.text);
    });
  });

  // Pour chaque label, vérifie si chaque forfait l'a à true
  return Array.from(allLabels).map(label => ({
    label,
    vals: this.forfaits.map(f => {
      const feat = (f.features || []).find((ft: any) => ft.text === label);
      return feat?.yes === true;
    })
  }));
}


processPayment(): void {
  if (!this.selectedPlan) return;
  this.isProcessing        = true;
  this.souscriptionLoading = this.selectedPlan._id;
 
  const userId    = localStorage.getItem('userId') || '';
  const forfaitId = this.selectedPlan._id;
 
  this.paymentService.createCheckoutSessionEtudiant(userId, forfaitId, 'nouveau').subscribe({
    next: (res) => {
      window.location.href = res.url; // redirection Stripe
    },
    error: (err) => {
      console.error(err);
      this.isProcessing        = false;
      this.souscriptionLoading = '';
      this.cdr.detectChanges();
    },
  });
}


}