import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SideBarEtudiant }        from '../side-bar-etudiant/side-bar-etudiant';
import { FormationAccessService } from '../../../services/formation-access-service';
import { CommonModule }           from '@angular/common';
import { FormsModule }            from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, of }           from 'rxjs';
import { catchError }             from 'rxjs/operators';

@Component({
  selector:    'app-mes-experiences-vr',
  standalone:  true,
  imports:     [SideBarEtudiant, CommonModule, FormsModule],
  templateUrl: './mes-experiences-vr.html',
  styleUrl:    './mes-experiences-vr.css',
})
export class MesExperiencesVR implements OnInit {

  userName = '';

  // ── Onglet actif ──────────────────────────────────────────
  activeTab: 'code' | 'forfait' = 'code';

  // ── État global ───────────────────────────────────────────
  isLoading = true;

  // ── SOURCE 1 : Code institution ───────────────────────────
  accesCodeActif        = false;
  experiencesCode: any[] = [];
  dateExpirationCode    = '';

  // ── SOURCE 2 : Forfait personnel ─────────────────────────
  accesForfaitActif        = false;
  experiencesForfait: any[] = [];
  dateExpirationForfait    = '';
  nomForfaitActif          = '';

  // ── Stats ─────────────────────────────────────────────────
  completedCount = 0;
  scoreMoyen     = 0;

  // ── Recherche ─────────────────────────────────────────────
  searchQuery = '';

  // ── Activation code ───────────────────────────────────────
  codeInput        = '';
  codePreview: any = null;
  codeError        = '';
  verifyLoading    = false;
  activateLoading  = false;

  constructor(
    private codeService: FormationAccessService,
    private router:      Router,
    private route:       ActivatedRoute,
    private cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const nom    = localStorage.getItem('nom')    || '';
    const prenom = localStorage.getItem('prenom') || '';
    this.userName = `${prenom} ${nom}`.trim() || 'Étudiant';

    this.chargerMesExperiences();

    // ── Retour depuis Stripe success_url ──────────────────
    this.route.queryParams.subscribe(params => {
      if (params['payment'] === 'success') {
        // Attendre 1s que le webhook ait le temps d'écrire en base
        setTimeout(() => this.chargerMesExperiences(), 1500);
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // CHARGEMENT — appels parallèles code + forfait
  // ════════════════════════════════════════════════════════
  chargerMesExperiences(): void {
    this.isLoading = true;

    const userId = localStorage.getItem('userId') || '';

    // ── Appels en parallèle ──────────────────────────────
    forkJoin({
      code:    this.codeService.getMesExperiences().pipe(catchError(() => of(null))),
      forfait: this.codeService.getMesExperiencesForfait(userId).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ code, forfait }) => {
        this.isLoading = false;

        // ── SOURCE 1 : Code institution ──────────────────
        if (code) {
          const toutesExps = code.experiences ?? [];

          if (code.sources?.codeInstitution || code.accesActif) {
            const expsCode = toutesExps.filter((e: any) =>
              e.source === 'institution' || !e.source
            );
            if (expsCode.length > 0) {
              this.accesCodeActif     = true;
              this.experiencesCode    = expsCode;
              this.dateExpirationCode = code.dateExpiration ?? code.abonnementFin ?? '';
            }
          }

          // Ancienne route sans champ sources
          if (!code.sources && code.accesActif && toutesExps.length > 0) {
            this.accesCodeActif     = true;
            this.experiencesCode    = toutesExps;
            this.dateExpirationCode = code.dateExpiration ?? code.abonnementFin ?? '';
          }
        }

        // ── SOURCE 2 : Forfait personnel ─────────────────
        // Appel direct à getMesExperiencesForfait/:userId
        if (forfait?.abonnementActif) {
          this.accesForfaitActif     = true;
          this.experiencesForfait    = forfait.experiences ?? [];
          this.dateExpirationForfait = forfait.dateExpiration ?? '';
          this.nomForfaitActif       = forfait.forfait ?? 'Personnel';
        } else {
          this.accesForfaitActif  = false;
          this.experiencesForfait = [];
        }

        // ── Onglet par défaut ────────────────────────────
        // Si on revient de Stripe → aller sur forfait
        const params = this.route.snapshot.queryParams;
        if (params['payment'] === 'success') {
          this.activeTab = 'forfait';
        } else {
          this.activeTab = this.accesCodeActif ? 'code' : 'forfait';
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // NAVIGATION ONGLETS
  // ════════════════════════════════════════════════════════
  setTab(tab: 'code' | 'forfait'): void {
    this.activeTab   = tab;
    this.searchQuery = '';
  }

  // ════════════════════════════════════════════════════════
  // ACTIVATION CODE INSTITUTION
  // ════════════════════════════════════════════════════════
  onCodeInput(): void {
    this.codePreview = null;
    this.codeError   = '';
    this.codeInput   = this.codeInput.toUpperCase();
  }

  verifierCode(): void {
    if (!this.codeInput.trim()) return;
    this.verifyLoading = true;
    this.codePreview   = null;
    this.codeError     = '';

    this.codeService.verifierCode(this.codeInput.trim()).subscribe({
      next: (res) => {
        this.verifyLoading = false;
        if (res.valide) {
          this.codePreview = res;
        } else {
          this.codeError = res.message;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.verifyLoading = false;
        this.codeError     = err.error?.message || 'Code invalide.';
        this.cdr.detectChanges();
      }
    });
  }

  activerCode(): void {
    this.activateLoading = true;

    this.codeService.activerCode(this.codeInput.trim()).subscribe({
      next: (res) => {
        this.activateLoading    = false;
        this.accesCodeActif     = true;
        this.experiencesCode    = (res.experiences ?? []).map((e: any) => ({ ...e, source: 'institution' }));
        this.dateExpirationCode = res.dateExpiration ?? '';
        this.codeInput          = '';
        this.codePreview        = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.activateLoading = false;
        this.codeError       = err.error?.message || "Erreur lors de l'activation.";
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // NAVIGATION VERS FORFAITS
  // ════════════════════════════════════════════════════════
  goToForfaits(): void {
    this.router.navigate(['/etudiant/forfaits']);
  }

  // ════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════
  filtrerExperiences(exps: any[]): any[] {
    if (!this.searchQuery.trim()) return exps;
    const q = this.searchQuery.toLowerCase();
    return exps.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    );
  }

  get joursRestants(): number {
    const date = this.activeTab === 'code' ? this.dateExpirationCode : this.dateExpirationForfait;
    if (!date) return 999;
    return Math.max(0, Math.ceil(
      (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    ));
  }

  formatDateShort(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  ouvrirExperience(exp: any): void {
    if (exp.appLabUrl) window.open(exp.appLabUrl, '_blank');
  }

  get accesActif(): boolean {
    return this.accesCodeActif || this.accesForfaitActif;
  }
}