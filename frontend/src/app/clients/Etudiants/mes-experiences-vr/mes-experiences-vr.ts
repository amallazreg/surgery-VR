import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SideBarEtudiant } from "../side-bar-etudiant/side-bar-etudiant";
import { FormationAccessService } from '../../../services/formation-access-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mes-experiences-vr',
  standalone: true,
  imports: [SideBarEtudiant,CommonModule,FormsModule],
  templateUrl: './mes-experiences-vr.html',
  styleUrl: './mes-experiences-vr.css',
})
export class MesExperiencesVR implements OnInit {

  userName    = localStorage.getItem('userName') || 'Étudiant';
  userId      = localStorage.getItem('userId')   || '';

  // ── État accès ───────────────────────────────────────────
  accesActif      = false;
  isLoading       = true;
  experiences: any[] = [];
  dateExpiration  = '';
  searchQuery     = '';

  // ── Stats (à connecter à un vrai service plus tard) ─────
  completedCount  = 0;
  scoreMoyen      = 0;

  // ── Activation code ──────────────────────────────────────
  codeInput       = '';
  codePreview: any = null;   // réponse de verifierCode
  codeError       = '';
  verifyLoading   = false;
  activateLoading = false;

  // ── Particules de fond ───────────────────────────────────
  particles: { style: string }[] = [];

  constructor(
    private codeService: FormationAccessService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.genererParticules();
    this.chargerMesExperiences();

    const userId = localStorage.getItem('userId');
  const nom = localStorage.getItem('nom') || '';
  const prenom = localStorage.getItem('prenom') || '';
    this.userName = `${prenom} ${nom}`.trim() || 'Utilisateur';

  }

  // ════════════════════════════════════════════════════════
  // CHARGEMENT DES EXPÉRIENCES (accès déjà actif)
  // ════════════════════════════════════════════════════════

  chargerMesExperiences(): void {
    this.isLoading = true;

    this.codeService.getMesExperiences().subscribe({
      next: (res) => {
        this.isLoading = false;

        if (res.accesActif && res.experiences?.length > 0) {
          this.accesActif    = true;
          this.experiences   = res.experiences;
          this.dateExpiration = res.dateExpiration ?? res.abonnementFin ?? '';
        
        } else {
          this.accesActif  = false;
          this.experiences = [];
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading  = false;
        this.accesActif = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // VÉRIFIER UN CODE (aperçu sans activer)
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
          this.triggerShake();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.verifyLoading = false;
        this.codeError     = err.error?.message || 'Code invalide.';
        this.triggerShake();
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // ACTIVER LE CODE → débloque les expériences
  // ════════════════════════════════════════════════════════

  activerCode(): void {
    this.activateLoading = true;

    this.codeService.activerCode(this.codeInput.trim()).subscribe({
      next: (res) => {
        this.activateLoading = false;
        this.accesActif      = true;
        this.experiences     = res.experiences ?? [];
        this.dateExpiration  = res.dateExpiration ?? '';
        this.codeInput       = '';
        this.codePreview     = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.activateLoading = false;
        this.codeError       = err.error?.message || 'Erreur lors de l\'activation.';
        this.cdr.detectChanges();
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════

  get experiencesFiltrees(): any[] {
    if (!this.searchQuery.trim()) return this.experiences;
    const q = this.searchQuery.toLowerCase();
    return this.experiences.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    );
  }

  get joursRestants(): number {
    if (!this.dateExpiration) return 999;
    const diff = new Date(this.dateExpiration).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  formatDateShort(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  ouvrirExperience(exp: any): void {
    if (exp.appLabUrl) {
      window.open(exp.appLabUrl, '_blank');
    }
  }

  triggerShake(): void {
    // La classe shake est gérée par [class.shake]="codeError" dans le template
    setTimeout(() => { this.codeError = this.codeError; }, 600);
  }

  genererParticules(): void {
    this.particles = Array.from({ length: 18 }, () => ({
      style: `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        width: ${4 + Math.random() * 8}px;
        height: ${4 + Math.random() * 8}px;
        animation-delay: ${Math.random() * 6}s;
        animation-duration: ${6 + Math.random() * 8}s;
        opacity: ${0.08 + Math.random() * 0.15};
      `
    }));
  }
}


