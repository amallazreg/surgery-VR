import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  // ── Data ────────────────────────────────────────────────
  abonnementActif: any = null;
  historique: any[]   = [];
  factures: any[]     = [];
  forfaitsUpgrade: any[] = [];
  forfaitActuel: any  = null;

  // ── Droits & Fonctionnalités ────────────────────────────
  droits: any = null;          // { apkTotal, apkRestants, formation, simulationEsthetique }
  droitsLoading = false;

  // ── Formation ───────────────────────────────────────────
  formationModalOpen  = false;
  formationResult: any = null;  // réponse du serveur après activation
  formationLoading    = false;
  formationError      = '';

  // ── APK ─────────────────────────────────────────────────
  apkLoading  = false;
  apkMessage  = '';
  apkError    = '';
  apkSuccess  = false;

  // ── Stats ───────────────────────────────────────────────
  totalDepense: number      = 0;
  expireBientotCount: number = 0;

  // ── UI ──────────────────────────────────────────────────
  selectedFilter      = 'all';
  showPaymentSuccessPopup = false;
  isLoading           = true;

  // ── Pay Modal ───────────────────────────────────────────
  payModalOpen    = false;
  payModalType: 'renouveler' | 'upgrade' | '' = '';
  selectedUpgradeForfait: any = null;
  pmTitle         = '';
  pmAmount        = '';
  paymentLoading  = false;
  paymentSuccess  = false;

  today          = new Date().toISOString();
  selectedMethod = 'card';

  constructor(
    private route: ActivatedRoute,
    private abonnementService: AbonnementService,
    private cdr: ChangeDetectorRef
  ) {}

  // ════════════════════════════════════════════════════════
  // LIFECYCLE
  // ════════════════════════════════════════════════════════

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

    // ── Historique ──
    this.abonnementService.getHistoriqueAbonnements(this.userId).subscribe({
      next: (data) => {
        this.historique = Array.isArray(data) ? data : [];
        this.expireBientotCount = this.historique.filter(
          a => this.joursRestants(a.dateFin) <= 7 && a.status === 'active'
        ).length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.historique = [];
        this.isLoading = false;
      }
    });

    // ── Factures ──
    this.abonnementService.getMesFactures(this.userId).subscribe({
      next: (data) => {
        this.factures = Array.isArray(data) ? data : [];
        this.totalDepense = this.factures.reduce(
          (sum, f) => sum + (parseFloat(f.amount) || 0), 0
        );
        this.cdr.detectChanges();
      },
      error: () => { this.factures = []; }
    });

    // ── Abonnement actif ──
    this.abonnementService.getMonAbonnement(this.userId).subscribe({
      next: (data) => {
        this.abonnementActif = data;
        this.loadForfaitsUpgrade();
        this.loadDroits();        // ← charge les droits dès qu'on a l'abonnement
        this.cdr.detectChanges();
      },
      error: () => { this.abonnementActif = null; }
    });
  }

  loadForfaitsUpgrade(): void {
    this.abonnementService.getForfaitsUpgrade(this.userId).subscribe({
      next: (data) => {
        this.forfaitsUpgrade = data.forfaitsDisponibles || [];
        this.forfaitActuel   = data.forfaitActuel;
        this.cdr.detectChanges();
      },
      error: () => { this.forfaitsUpgrade = []; }
    });
  }

  // ════════════════════════════════════════════════════════
  // DROITS — APK — FORMATION
  // ════════════════════════════════════════════════════════

  // ── Charger les droits ──────────────────────────────────
  loadDroits(): void {
    this.droitsLoading = true;
    this.abonnementService.getMesDroits(this.userId).subscribe({
      next: (data) => {
        this.droits = data;
        this.droitsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.droits = null;
        this.droitsLoading = false;
      }
    });
  }

  // ── Télécharger un APK ──────────────────────────────────
  telechargerApk(): void {
    this.apkLoading  = true;
    this.apkMessage  = '';
    this.apkError    = '';
    this.apkSuccess  = false;

    this.abonnementService.telechargerApk(this.userId).subscribe({
      next: (res) => {
        this.apkLoading  = false;
        this.apkSuccess  = true;
        this.apkMessage  = `APK téléchargé ! Il vous reste ${res.apkRestants} / ${res.apkTotal} APK ce mois-ci.`;

        // Met à jour le compteur local immédiatement
        if (this.droits) {
          this.droits.apkRestants = res.apkRestants;
        }

        // Ouvre le lien de téléchargement
        if (res.downloadUrl) {
          window.open(res.downloadUrl, '_blank');
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.apkLoading = false;
        this.apkError   = err.error?.message || 'Quota APK épuisé ou erreur serveur.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── Ouvrir modal formation ──────────────────────────────
  openFormationModal(): void {
    this.formationModalOpen = true;
    this.formationResult    = null;
    this.formationError     = '';
    document.body.style.overflow = 'hidden';
  }

  closeFormationModal(): void {
    this.formationModalOpen = false;
    document.body.style.overflow = '';
  }

  // ── Activer la formation ────────────────────────────────
  activerFormation(): void {
    this.formationLoading = true;
    this.formationError   = '';

    this.abonnementService.activerFormation(this.userId).subscribe({
      next: (res) => {
        this.formationResult  = res;
        this.formationLoading = false;

        // Met à jour les droits localement
        if (this.droits?.formation) {
          this.droits.formation.activee    = true;
          this.droits.formation.codesAcces = res.codesAcces;
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.formationError   = err.error?.message || 'Erreur lors de l\'activation.';
        this.formationLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Copier un code dans le presse-papier ────────────────
  copierCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      // feedback visuel géré dans le template via une variable
    });
  }

  // ════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════

  joursRestants(dateFin: string): number {
    if (!dateFin) return 0;
    const diff = new Date(dateFin).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  progressPct(dateDebut: string, dateFin: string): number {
    if (!dateDebut || !dateFin) return 0;
    const total   = new Date(dateFin).getTime()   - new Date(dateDebut).getTime();
    const elapsed = new Date().getTime()           - new Date(dateDebut).getTime();
    return Math.min(100, Math.round((elapsed / total) * 100));
  }

  progressClass(dateDebut: string, dateFin: string): string {
    const jours = this.joursRestants(dateFin);
    if (jours <= 7)  return 'fill-red';
    if (jours <= 14) return 'fill-gold';
    return 'fill-green';
  }

  daysClass(dateDebut: string, dateFin: string): string {
    const jours = this.joursRestants(dateFin);
    if (jours <= 7)  return 'days-red';
    if (jours <= 14) return 'days-gold';
    return 'days-green';
  }

  daysIcon(dateDebut: string, dateFin: string): string {
    const jours = this.joursRestants(dateFin);
    if (jours <= 7)  return '✕';
    if (jours <= 14) return '⚠';
    return '🟢';
  }

  getStatusChipClass(status: string): string {
    switch (status) {
      case 'active':    return 'chip-active';
      case 'cancelled': return 'chip-expired';
      default:          return 'chip-expired';
    }
  }

  getStatusLabel(status: string, dateFin: string): string {
    if (status === 'active' && this.joursRestants(dateFin) <= 7)
      return `Expire dans ${this.joursRestants(dateFin)} jours`;
    if (status === 'active')    return 'Actif';
    if (status === 'cancelled') return 'Annulé';
    return 'Expiré';
  }

  getPlanIcon(name: string): string {
    switch (name?.toLowerCase()) {
      case 'standard': return '🌱';
      case 'pro':      return '⚡';
      case 'business': return '🏢';
      default:         return '💎';
    }
  }

  getPlanBadgeClass(name: string): string {
    switch (name?.toLowerCase()) {
      case 'standard': return 'pbb-starter';
      case 'pro':      return 'pbb-pro';
      case 'business': return 'pbb-business';
      default:         return 'pbb-pro';
    }
  }

  getCardClass(sub: any): string {
    const jours = this.joursRestants(sub.dateFin);
    if (sub.status !== 'active') return 'status-expired';
    if (jours <= 7)              return 'status-expiring';
    return 'status-active';
  }

  getDataStatus(sub: any): string {
    const jours = this.joursRestants(sub.dateFin);
    if (sub.status !== 'active') return 'expired';
    if (jours <= 7)              return 'expiring';
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
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  getRef(id: string): string {
    if (!id) return '—';
    return id.toString().slice(0, 12).toUpperCase();
  }

  // ── APK bar width ────────────────────────────────────────
  apkBarWidth(): number {
    if (!this.droits || !this.droits.apkTotal) return 0;
    return Math.round((this.droits.apkRestants / this.droits.apkTotal) * 100);
  }

  apkBarClass(): string {
    const pct = this.apkBarWidth();
    if (pct <= 20) return 'fill-red';
    if (pct <= 50) return 'fill-gold';
    return 'fill-green';
  }

  // ════════════════════════════════════════════════════════
  // ACTIONS
  // ════════════════════════════════════════════════════════

  filterSubs(status: string): void {
    this.selectedFilter = status;
  }

  openRenouvelerModal(): void {
    if (!this.abonnementActif) return;
    this.payModalType    = 'renouveler';
    this.pmTitle         = `Renouveler ${this.abonnementActif.forfait.name}`;
    this.pmAmount        = this.abonnementActif.forfait.price;
    this.paymentSuccess  = false;
    this.payModalOpen    = true;
    document.body.style.overflow = 'hidden';
  }

  openUpgradeModal(forfait: any): void {
    this.payModalType          = 'upgrade';
    this.selectedUpgradeForfait = forfait;
    this.pmTitle               = `Passer à ${forfait.name}`;
    this.pmAmount              = forfait.price;
    this.paymentSuccess        = false;
    this.payModalOpen          = true;
    document.body.style.overflow = 'hidden';
  }

  closePayModal(): void {
    this.payModalOpen = false;
    document.body.style.overflow = '';
  }

  confirmPayment(): void {
    this.paymentLoading = true;

    if (this.payModalType === 'renouveler') {
      this.abonnementService
        .renouvelerAbonnement(this.userId, this.abonnementActif._id)
        .subscribe({
          next: (res) => { window.location.href = res.url; },
          error: () => { this.paymentLoading = false; }
        });
    } else if (this.payModalType === 'upgrade') {
      this.abonnementService
        .upgradeAbonnement(this.userId, this.selectedUpgradeForfait._id)
        .subscribe({
          next: (res) => { window.location.href = res.url; },
          error: () => { this.paymentLoading = false; }
        });
    }
  }

  closeSuccessPopup(): void {
    this.showPaymentSuccessPopup = false;
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('pay-overlay') ||
        (event.target as HTMLElement).classList.contains('formation-overlay')) {
      this.closePayModal();
      this.closeFormationModal();
    }
  }

  selectQM(method: string): void {
    this.selectedMethod = method;
  }

  voirFacture(sub: any): void {
    const facture = this.factures.find(f => f.abonnement?._id === sub._id);
    if (facture) {
      this.abonnementService.telechargerFacture(facture._id);
    }
  }
}