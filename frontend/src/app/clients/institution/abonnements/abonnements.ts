import { Component, OnInit ,ChangeDetectorRef } from '@angular/core';
import { SideBar } from "../side-bar/side-bar";
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AbonnementService } from '../../../services/abonnement-service';

@Component({
  selector: 'app-abonnements',
  standalone: true,
  imports: [SideBar, CommonModule],
  templateUrl: './abonnements.html',
  styleUrl: './abonnements.css',
})
export class Abonnements implements OnInit {

  userId = localStorage.getItem('userId') || '';

  // ── Data ──
  abonnementActif: any = null;
  historique: any[] = [];
  factures: any[] = [];
  forfaitsUpgrade: any[] = [];
  forfaitActuel: any = null;

  // ── Stats ──
  totalDepense: number = 0;
  expireBientotCount: number = 0;

  // ── UI ──
  selectedFilter: string = 'all';
  showPaymentSuccessPopup = false;
  isLoading = true;

  // ── Pay Modal ──
  payModalOpen = false;
  payModalType: 'renouveler' | 'upgrade' | '' = '';
  selectedUpgradeForfait: any = null;
  pmTitle = '';
  pmAmount = '';
  paymentLoading = false;
  paymentSuccess = false;

today = new Date().toISOString();
selectedMethod: string = 'card';

  constructor(
    private route: ActivatedRoute,
    private abonnementService: AbonnementService,
    private cdr: ChangeDetectorRef  
  ) {}

ngOnInit(): void {
  this.route.queryParams.subscribe(params => {
    if (params['payment'] === 'success') {
      this.showPaymentSuccessPopup = true;
    }
  });

  this.loadData();
}

loadData(): void {
  this.isLoading = true;

    console.log('loadData appelé, userId:', this.userId); // ← vérifier dans Console


  // Historique
  this.abonnementService.getHistoriqueAbonnements(this.userId).subscribe({
    next: (data) => {
      this.historique = Array.isArray(data) ? data : [];
      this.expireBientotCount = this.historique.filter(
        a => this.joursRestants(a.dateFin) <= 7 && a.status === 'active'
      ).length;

            console.log('isLoading -> false'); // ← vérifier

      this.isLoading = false; // ✅ ici
       this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Historique erreur:', err);
      this.historique = [];
      this.isLoading = false; // ✅ et ici
    }
  });

  // Factures
  this.abonnementService.getMesFactures(this.userId).subscribe({
    next: (data) => {
      this.factures = Array.isArray(data) ? data : [];
      this.totalDepense = this.factures.reduce((sum, f) => sum + (f.amount || 0), 0);
    },
    error: () => { this.factures = []; }
  });

  // Abonnement actif
  this.abonnementService.getMonAbonnement(this.userId).subscribe({
    next: (data) => {
      this.abonnementActif = data;
      this.loadForfaitsUpgrade();
    },
    error: () => { this.abonnementActif = null; }
  });
}
  loadForfaitsUpgrade(): void {
    this.abonnementService.getForfaitsUpgrade(this.userId).subscribe({
      next: (data) => {
        this.forfaitsUpgrade = data.forfaitsDisponibles;
        this.forfaitActuel = data.forfaitActuel;
      },
      error: () => { this.forfaitsUpgrade = []; }
    });
  }

  // ── Helpers ───────────────────────────────────────────
  joursRestants(dateFin: string): number {
    if (!dateFin) return 0;
    const diff = new Date(dateFin).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  progressPct(dateDebut: string, dateFin: string): number {
    if (!dateDebut || !dateFin) return 0;
    const total = new Date(dateFin).getTime() - new Date(dateDebut).getTime();
    const elapsed = new Date().getTime() - new Date(dateDebut).getTime();
    return Math.min(100, Math.round((elapsed / total) * 100));
  }

  progressClass(dateDebut: string, dateFin: string): string {
    const jours = this.joursRestants(dateFin);
    if (jours <= 7) return 'fill-red';
    if (jours <= 14) return 'fill-gold';
    return 'fill-green';
  }

  daysClass(dateDebut: string, dateFin: string): string {
    const jours = this.joursRestants(dateFin);
    if (jours <= 7) return 'days-red';
    if (jours <= 14) return 'days-gold';
    return 'days-green';
  }

  daysIcon(dateDebut: string, dateFin: string): string {
    const jours = this.joursRestants(dateFin);
    if (jours <= 7) return '✕';
    if (jours <= 14) return '⚠';
    return '🟢';
  }

  getStatusChipClass(status: string): string {
    switch (status) {
      case 'active': return 'chip-active';
      case 'cancelled': return 'chip-expired';
      default: return 'chip-expired';
    }
  }

  getStatusLabel(status: string, dateFin: string): string {
    if (status === 'active' && this.joursRestants(dateFin) <= 7) return `Expire dans ${this.joursRestants(dateFin)} jours`;
    if (status === 'active') return 'Actif';
    if (status === 'cancelled') return 'Annulé';
    return 'Expiré';
  }

  getPlanIcon(name: string): string {
    switch (name?.toLowerCase()) {
      case 'standard': return '🌱';
      case 'pro': return '⚡';
      case 'business': return '🏢';
      default: return '💎';
    }
  }

  getPlanBadgeClass(name: string): string {
    switch (name?.toLowerCase()) {
      case 'standard': return 'pbb-starter';
      case 'pro': return 'pbb-pro';
      case 'business': return 'pbb-business';
      default: return 'pbb-pro';
    }
  }

  getCardClass(sub: any): string {
    const jours = this.joursRestants(sub.dateFin);
    if (sub.status !== 'active') return 'status-expired';
    if (jours <= 7) return 'status-expiring';
    return 'status-active';
  }

  getDataStatus(sub: any): string {
    const jours = this.joursRestants(sub.dateFin);
    if (sub.status !== 'active') return 'expired';
    if (jours <= 7) return 'expiring';
    return 'active';
  }

  get abonnementsFiltered(): any[] {
    if (this.selectedFilter === 'all') return this.historique;
    return this.historique.filter(a => this.getDataStatus(a) === this.selectedFilter);
  }

  get totalActifs(): number {
    return this.historique.filter(a => a.status === 'active').length;
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Filter ────────────────────────────────────────────
  filterSubs(status: string): void {
    this.selectedFilter = status;
  }

  // ── Pay Modal ─────────────────────────────────────────
  openRenouvelerModal(): void {
    if (!this.abonnementActif) return;
    this.payModalType = 'renouveler';
    this.pmTitle = `Renouveler ${this.abonnementActif.forfait.name}`;
    this.pmAmount = this.abonnementActif.forfait.price;
    this.paymentSuccess = false;
    this.payModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  openUpgradeModal(forfait: any): void {
    this.payModalType = 'upgrade';
    this.selectedUpgradeForfait = forfait;
    this.pmTitle = `Passer à ${forfait.name}`;
    this.pmAmount = forfait.price;
    this.paymentSuccess = false;
    this.payModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closePayModal(): void {
    this.payModalOpen = false;
    document.body.style.overflow = '';
  }

  confirmPayment(): void {
    this.paymentLoading = true;

    if (this.payModalType === 'renouveler') {
      this.abonnementService.renouvelerAbonnement(this.userId, this.abonnementActif._id).subscribe({
        next: (res) => { window.location.href = res.url; },
        error: () => { this.paymentLoading = false; }
      });
    } else if (this.payModalType === 'upgrade') {
      this.abonnementService.upgradeAbonnement(this.userId, this.selectedUpgradeForfait._id).subscribe({
        next: (res) => { window.location.href = res.url; },
        error: () => { this.paymentLoading = false; }
      });
    }
  }

  closeSuccessPopup(): void {
    this.showPaymentSuccessPopup = false;
  }

  onOverlayClick(event: MouseEvent): void {
  if ((event.target as HTMLElement).classList.contains('pay-overlay')) {
    this.closePayModal();
  }
}

selectQM(method: string): void {
  this.selectedMethod = method;
}
getRef(id: string): string {
  if (!id) return '—';
  return id.toString().slice(0, 12).toUpperCase();
}

}