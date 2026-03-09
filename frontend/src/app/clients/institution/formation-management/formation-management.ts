import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbonnementService } from '../../../services/abonnement-service';
import { FormationManagementService } from '../../../services/formation-management-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SideBar } from "../side-bar/side-bar";

@Component({
  selector: 'app-formation-management',
  standalone : true ,
  imports: [CommonModule, FormsModule, SideBar],
  templateUrl: './formation-management.html',
  styleUrl: './formation-management.css',
})
export class FormationManagement implements OnInit {

  userId = localStorage.getItem('userId') || '';

  // ── State ────────────────────────────────────────────────
  isLoading        = true;
  droits: any      = null;
  formationActivee = false;
  abonnementId     = '';

  // ── Codes ────────────────────────────────────────────────
  codes: any[]     = [];
  stats            = { total: 0, disponibles: 0, utilises: 0, expires: 0, revoques: 0 };

  // ── Filtres ──────────────────────────────────────────────
  filtreActif  = 'tous';
  searchQuery  = '';
  filtres = [
    { key: 'tous',        label: 'Tous'        },
    { key: 'disponible',  label: 'Disponibles' },
    { key: 'utilise',     label: 'Utilisés'    },
    { key: 'revoque',     label: 'Révoqués'    },
  ];

  // ── Activation ───────────────────────────────────────────
  activationLoading = false;
  activationError   = '';

  // ── Révocation ───────────────────────────────────────────
  modalRevocationOpen = false;
  codeARevoquer: any  = null;
  revocationLoading   = false;

  // ── UI ───────────────────────────────────────────────────
  codeCopie = '';
  toast     = { show: false, message: '', type: 'success' };

  constructor(
    private abonnementService: AbonnementService,
    private codeService: FormationManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  // ════════════════════════════════════════════════════════
  // CHARGEMENT
  // ════════════════════════════════════════════════════════

  chargerDonnees(): void {
    this.isLoading = true;

    this.abonnementService.getMesDroits(this.userId).subscribe({
      next: (data) => {
        this.droits          = data;
        this.abonnementId    = data.abonnementId ?? '';
        this.formationActivee = data.formation?.activee ?? false;

        if (this.formationActivee && this.abonnementId) {
          this.chargerCodes();
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  chargerCodes(): void {
    this.codeService.getCodesAbonnement(this.abonnementId).subscribe({
      next: (res) => {
        this.codes     = res.codes ?? [];
        this.stats     = res.stats ?? this.stats;
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
  // ACTIVATION FORMATION
  // ════════════════════════════════════════════════════════

  activerFormation(): void {
    this.activationLoading = true;
    this.activationError   = '';

    this.abonnementService.activerFormation(this.userId).subscribe({
      next: (res) => {
        this.activationLoading = false;
        this.formationActivee  = true;
        this.codes             = res.codes ?? [];
        this.abonnementId      = res.abonnementId ?? this.abonnementId;
        this.recalculerStats();
        this.showToast('Formation activée ! Codes générés avec succès.', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.activationLoading = false;
        this.activationError   = err.error?.message || 'Erreur lors de l\'activation.';
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // RÉVOCATION
  // ════════════════════════════════════════════════════════

  confirmerRevocation(code: any): void {
    this.codeARevoquer      = code;
    this.modalRevocationOpen = true;
  }

  revoquerCode(): void {
    if (!this.codeARevoquer) return;
    this.revocationLoading = true;

    this.codeService.revoquerCode(this.codeARevoquer._id).subscribe({
      next: () => {
        // Mise à jour locale immédiate
        const idx = this.codes.findIndex(c => c._id === this.codeARevoquer._id);
        if (idx !== -1) {
          this.codes[idx] = { ...this.codes[idx], statut: 'revoque' };
        }
        this.recalculerStats();
        this.revocationLoading  = false;
        this.modalRevocationOpen = false;
        this.codeARevoquer       = null;
        this.showToast('Code révoqué avec succès.', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.revocationLoading = false;
        this.showToast(err.error?.message || 'Erreur lors de la révocation.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════

  get codesFiltres(): any[] {
    let liste = this.codes;

    // Filtre par statut
    if (this.filtreActif !== 'tous') {
      liste = liste.filter(c => c.statut === this.filtreActif);
    }

    // Filtre par recherche
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      liste = liste.filter(c =>
        c.code?.toLowerCase().includes(q) ||
        c.etudiant?.nom?.toLowerCase().includes(q) ||
        c.etudiant?.prenom?.toLowerCase().includes(q) ||
        c.etudiant?.email?.toLowerCase().includes(q)
      );
    }

    return liste;
  }

  get tauxUtilisation(): number {
    if (!this.stats.total) return 0;
    return Math.round((this.stats.utilises / this.stats.total) * 100);
  }

  getCount(key: string): number {
    if (key === 'tous') return this.stats.total;
    if (key === 'disponible') return this.stats.disponibles;
    if (key === 'utilise')    return this.stats.utilises;
    if (key === 'revoque')    return this.stats.revoques;
    return 0;
  }

  setFiltre(key: string): void { this.filtreActif = key; }

  getStatutLabel(statut: string): string {
    const map: Record<string, string> = {
      disponible: 'Disponible',
      utilise:    'Utilisé',
      expire:     'Expiré',
      revoque:    'Révoqué',
    };
    return map[statut] ?? statut;
  }

  getInitials(prenom: string, nom: string): string {
    return `${(prenom?.[0] ?? '').toUpperCase()}${(nom?.[0] ?? '').toUpperCase()}`;
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  copierCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.codeCopie = code;
      setTimeout(() => { this.codeCopie = ''; this.cdr.detectChanges(); }, 1500);
      this.cdr.detectChanges();
    });
  }

  recalculerStats(): void {
    this.stats = {
      total:       this.codes.length,
      disponibles: this.codes.filter(c => c.statut === 'disponible').length,
      utilises:    this.codes.filter(c => c.statut === 'utilise').length,
      expires:     this.codes.filter(c => c.statut === 'expire').length,
      revoques:    this.codes.filter(c => c.statut === 'revoque').length,
    };
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { show: true, message, type };
    setTimeout(() => { this.toast.show = false; this.cdr.detectChanges(); }, 3500);
  }

  closeModal(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.modalRevocationOpen = false;
    }
  }
}