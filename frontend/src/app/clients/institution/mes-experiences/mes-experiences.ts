import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SideBar } from "../side-bar/side-bar";
import { AbonnementService } from '../../../services/abonnement-service';

export type ExpStatus = 'live' | 'draft' | 'paused' | 'new';
export type SubStatus = 'active' | 'expiring' | 'expired';
export type ApkDevice = {
  icon: string; name: string; version: string;
  android: string; size: string; recommended?: boolean;
};

export interface Experience {
  id: number;
  title: string;
  description: string;
  emoji: string;
  thumbClass: string;
  status: ExpStatus;
  compatibility: string;
  respondents: number;
  avgTime: string;
  rating: number | null;
  isEmpty?: boolean;
  apkInstalled?: boolean; // ← NOUVEAU : APK téléchargé pour cette expérience
}

export interface SubscriptionGroup {
  key: string;
  planName: string;
  planIcon: string;
  ref: string;
  expireLabel: string;
  headerClass: string;
  status: SubStatus;
  totalExperiences: number;
  totalRespondents: number;
  apkUsed: number;       // ← nombre d'APK téléchargés
  apkRestants: number;   // ← quota restant (depuis backend)
  apkTotal: number;      // ← quota total du forfait
  maxSlots: number;
  experiences: Experience[];
}

@Component({
  selector: 'app-mes-experiences',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBar],
  templateUrl: './mes-experiences.html',
  styleUrl: './mes-experiences.css',
})
export class MesExperiences implements OnInit {

  userId = localStorage.getItem('userId') || '';

  searchQuery  = '';
  activeFilter = 'all';
  isLoadingDroits = true;

  filters = [
    { key: 'all',    label: 'Toutes' },
    { key: 'live',   label: '🟢 Live' },
    { key: 'draft',  label: '✏️ Brouillons' },
    { key: 'paused', label: '⏸ Pausées' },
  ];

  // ── Abonnement actif ─────────────────────────────────────
  subscriptionGroups: SubscriptionGroup[] = [
    {
      key: 'pro',
      planName: 'Chargement...',
      planIcon: '⏳',
      ref: '',
      expireLabel: '',
      headerClass: 'sgh-pro',
      status: 'active',
      totalExperiences: 0,
      totalRespondents: 987,
      apkUsed: 0,
      apkRestants: 0,
      apkTotal: 0,
      maxSlots: 6,
      experiences: [
        {
          id: 1,
          title: 'Satisfaction Magasin — Tunis Centre',
          description: 'Parcours client immersif dans un environnement de magasin 3D pour mesurer la satisfaction en rayon.',
          emoji: '🛍️', thumbClass: 'vrt-1', status: 'live',
          compatibility: 'Quest 2 & 3', respondents: 342, avgTime: '4:32', rating: 4.7,
          apkInstalled: false,
        },
        {
          id: 2,
          title: 'Parcours Magasin — Sfax Point de Vente',
          description: 'Navigation guidée dans la boutique VR pour évaluer la signalétique et le placement des produits.',
          emoji: '🗺️', thumbClass: 'vrt-2', status: 'live',
          compatibility: 'Quest 3', respondents: 218, avgTime: '6:15', rating: 4.5,
          apkInstalled: false,
        },
        {
          id: 3,
          title: 'Test Produit — Campagne Ramadan 2026',
          description: 'Évaluation des préférences produits dans un décor thématique Ramadan avec choix interactifs en VR.',
          emoji: '🌙', thumbClass: 'vrt-3', status: 'new',
          compatibility: 'Quest 2 & 3', respondents: 47, avgTime: '3:48', rating: 4.9,
          apkInstalled: false,
        },
        {
          id: 4,
          title: 'Nouveau Concept Store — Avis Clients',
          description: 'Visite virtuelle d\'un concept store avant inauguration pour recueillir les avis sur l\'agencement.',
          emoji: '🏪', thumbClass: 'vrt-4', status: 'paused',
          compatibility: 'Quest 2', respondents: 95, avgTime: '5:02', rating: 4.2,
          apkInstalled: false,
        },
        {
          id: 5,
          title: 'Test Packaging — Nouvelle Gamme Bio',
          description: 'Comparaison de designs packaging en environnement rayon 3D avant lancement commercial.',
          emoji: '📦', thumbClass: 'vrt-5', status: 'draft',
          compatibility: 'Quest 3', respondents: 0, avgTime: '—', rating: null,
          apkInstalled: false,
        },
        {
          id: 6, title: '', description: '', emoji: '', thumbClass: '', status: 'draft',
          compatibility: '', respondents: 0, avgTime: '', rating: null, isEmpty: true,
        },
      ],
    },
  ];

  get activeSubscription(): SubscriptionGroup {
    return this.subscriptionGroups[0];
  }

  // ── Stats calculés ───────────────────────────────────────
  get totalExperiences(): number {
    return this.activeSubscription.experiences.filter(e => !e.isEmpty).length;
  }

  get avgCompletionRate(): number {
    const exps = this.activeSubscription.experiences.filter(e => !e.isEmpty && e.respondents > 0);
    if (!exps.length) return 0;
    const avg = exps.reduce((s, e) => s + (e.rating ? 75 + (e.rating / 5) * 25 : 75), 0) / exps.length;
    return Math.round(avg);
  }

  get globalAvgTime(): string {
    const exps = this.activeSubscription.experiences.filter(
      e => !e.isEmpty && e.avgTime !== '—' && e.respondents > 0
    );
    if (!exps.length) return '—';
    const totalSecs = exps.reduce((s, e) => {
      const [m, sec] = e.avgTime.split(':').map(Number);
      return s + m * 60 + sec;
    }, 0);
    const avg = Math.round(totalSecs / exps.length);
    return `${Math.floor(avg / 60)}:${String(avg % 60).padStart(2, '0')}`;
  }

  get totalApk(): number {
    return this.activeSubscription.apkUsed;
  }

  // ── APK versions ─────────────────────────────────────────
  apkVersions: ApkDevice[] = [
    { icon: '🥽', name: 'Meta Quest 2 & 3', version: 'v2.4.1', android: 'Android 11+', size: '124 Mo', recommended: true },
    { icon: '🥽', name: 'Meta Quest Pro',    version: 'v2.4.1', android: 'Android 12+', size: '138 Mo' },
    { icon: '📱', name: 'Pico 4 / Neo 3',   version: 'v2.3.0', android: 'Android 10+', size: '119 Mo' },
  ];

  downloadStates: Record<number, 'idle' | 'loading' | 'done'> = { 0: 'idle', 1: 'idle', 2: 'idle' };

  // APK en cours de téléchargement pour quelle expérience
  currentApkExpId: number | null = null;

  // Message de quota APK
  apkQuotaMessage = '';
  apkQuotaError   = false;

  constructor(
    private abonnementService: AbonnementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDroits();
  }

  // ════════════════════════════════════════════════════════
  // CHARGER LES DROITS DEPUIS LE BACKEND
  // ════════════════════════════════════════════════════════
  loadDroits(): void {
    this.isLoadingDroits = true;
    this.abonnementService.getMesDroits(this.userId).subscribe({
      next: (droits) => {
        const sub = this.subscriptionGroups[0];

        // Mise à jour des infos forfait
        sub.planName    = `Forfait ${droits.forfait}`;
        sub.planIcon    = this.getPlanIcon(droits.forfait);
        sub.headerClass = this.getPlanHeaderClass(droits.forfait);
        sub.apkRestants = droits.apkRestants;
        sub.apkTotal    = droits.apkTotal;
        sub.apkUsed     = droits.apkTotal - droits.apkRestants;

        // Limiter les slots au forfait
        sub.maxSlots = droits.apkTotal;

        this.isLoadingDroits = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingDroits = false;
      }
    });
  }

  getPlanIcon(name: string): string {
    switch (name?.toLowerCase()) {
      case 'standard': return '🌱';
      case 'pro':      return '⚡';
      case 'business': return '🏢';
      default:         return '💎';
    }
  }

  getPlanHeaderClass(name: string): string {
    switch (name?.toLowerCase()) {
      case 'standard': return 'sgh-starter';
      case 'pro':      return 'sgh-pro';
      case 'business': return 'sgh-business';
      default:         return 'sgh-pro';
    }
  }

  // ════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════
  getStatusTag(status: ExpStatus): { label: string; cssClass: string } {
    const map: Record<ExpStatus, { label: string; cssClass: string }> = {
      live:   { label: '● LIVE',       cssClass: 'est-live' },
      new:    { label: '✦ NOUVEAU',    cssClass: 'est-new' },
      paused: { label: '⏸ PAUSÉE',    cssClass: 'est-paused' },
      draft:  { label: '✏️ BROUILLON', cssClass: 'est-draft' },
    };
    return map[status];
  }

  isActionable(exp: Experience): boolean {
    // On peut lancer sur le casque uniquement si l'APK est installé
    return exp.apkInstalled === true;
  }

  getSubBadge(status: SubStatus): { label: string; cssClass: string } {
    const map: Record<SubStatus, { label: string; cssClass: string }> = {
      active:   { label: 'Actif',          cssClass: 'sgb-active' },
      expiring: { label: 'Expire bientôt', cssClass: 'sgb-expiring' },
      expired:  { label: 'Expiré',         cssClass: 'sgb-expired' },
    };
    return map[status];
  }

  // Texte APK button selon état
  getApkBtnLabel(exp: Experience): string {
    if (exp.apkInstalled) return '✅ APK Installé';
    return '📱 APK';
  }

  // Barre de progression APK
  apkBarWidth(): number {
    const sub = this.activeSubscription;
    if (!sub.apkTotal) return 0;
    return Math.round((sub.apkRestants / sub.apkTotal) * 100);
  }

  apkBarColor(): string {
    const pct = this.apkBarWidth();
    if (pct <= 20) return '#FF3B5C';
    if (pct <= 50) return '#F59E0B';
    return '#00C48C';
  }

  filteredExperiencesFlat(): Experience[] {
    return this.activeSubscription.experiences.filter(exp => {
      if (exp.isEmpty) return this.activeFilter === 'all';
      const matchFilter = this.activeFilter === 'all' || exp.status === this.activeFilter;
      const matchSearch = !this.searchQuery ||
        exp.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }

  setFilter(key: string): void { this.activeFilter = key; }

  // ════════════════════════════════════════════════════════
  // MODAL APK — avec appel backend
  // ════════════════════════════════════════════════════════
  isApkModalOpen    = false;
  selectedExpForApk = '';
  selectedExp: Experience | null = null;

  openAPKModal(exp: Experience): void {
    this.selectedExp       = exp;
    this.selectedExpForApk = exp.title;
    this.downloadStates    = { 0: 'idle', 1: 'idle', 2: 'idle' };
    this.apkQuotaMessage   = '';
    this.apkQuotaError     = false;
    this.isApkModalOpen    = true;
    document.body.style.overflow = 'hidden';
  }

  closeAPKModal(): void {
    this.isApkModalOpen = false;
    document.body.style.overflow = '';
  }

  onApkOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('apk-overlay')) this.closeAPKModal();
  }

  // ─── Télécharger APK : appel backend + mise à jour UI ───
  downloadApk(index: number): void {
    // Si déjà installé, pas besoin de redécrementer le quota
    if (this.selectedExp?.apkInstalled) {
      this.downloadStates[index] = 'loading';
      setTimeout(() => {
        this.downloadStates[index] = 'done';
      }, 1000);
      return;
    }

    // Vérifier quota local avant d'appeler le serveur
    if (this.activeSubscription.apkRestants <= 0) {
      this.apkQuotaMessage = `Quota APK épuisé (${this.activeSubscription.apkTotal} APK/mois). Renouvelez votre abonnement.`;
      this.apkQuotaError   = true;
      return;
    }

    this.downloadStates[index] = 'loading';
    this.apkQuotaMessage       = '';
    this.apkQuotaError         = false;

    // Appel backend — décrémente apkRestants
    this.abonnementService.telechargerApk(this.userId).subscribe({
      next: (res) => {
        this.downloadStates[index] = 'done';

        // ─── Mise à jour du compteur ───
        this.activeSubscription.apkRestants = res.apkRestants;
        this.activeSubscription.apkUsed     = res.apkTotal - res.apkRestants;

        // ─── Marquer l'expérience comme "APK installé" ───
        if (this.selectedExp) {
          const exp = this.activeSubscription.experiences.find(
            e => e.id === this.selectedExp!.id
          );
          if (exp) {
            exp.apkInstalled = true;
            // Si l'expérience était en draft, elle passe en "new" (prête à tester)
            if (exp.status === 'draft') {
              exp.status = 'new';
            }
          }
        }

        this.apkQuotaMessage = `✅ APK installé ! ${res.apkRestants} téléchargements restants ce mois.`;
        this.apkQuotaError   = false;

        this.cdr.detectChanges();

        // Ferme la modal après 2 secondes
        setTimeout(() => {
          this.closeAPKModal();
          this.downloadStates[index] = 'idle';
        }, 2000);
      },
      error: (err) => {
        this.downloadStates[index] = 'idle';
        this.apkQuotaMessage       = err.error?.message || 'Quota APK épuisé.';
        this.apkQuotaError         = true;
        this.cdr.detectChanges();
      }
    });
  }

  getDownloadIcon(index: number): string {
    const s = this.downloadStates[index];
    if (s === 'loading') return '⏳';
    if (s === 'done')    return '✓';
    return '⬇';
  }

  // ════════════════════════════════════════════════════════
  // MODAL VR
  // ════════════════════════════════════════════════════════
  isVrModalOpen    = false;
  selectedExpForVr = '';
  vrLaunchState: 'idle' | 'loading' | 'done' = 'idle';

  openVRModal(exp: Experience): void {
    if (!exp.apkInstalled) return; // bloquer si APK pas installé
    this.selectedExpForVr = exp.title;
    this.vrLaunchState    = 'idle';
    this.isVrModalOpen    = true;
    document.body.style.overflow = 'hidden';
  }

  closeVRModal(): void {
    this.isVrModalOpen = false;
    this.vrLaunchState = 'idle';
    document.body.style.overflow = '';
  }

  onVrOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('vr-overlay')) this.closeVRModal();
  }

  launchOnHeadset(): void {
    this.vrLaunchState = 'loading';
    setTimeout(() => {
      this.vrLaunchState = 'done';
      setTimeout(() => { this.vrLaunchState = 'idle'; }, 3500);
    }, 1800);
  }

  get vrLaunchLabel(): string {
    if (this.vrLaunchState === 'loading') return '⏳ Envoi vers le casque...';
    if (this.vrLaunchState === 'done')    return '✅ Expérience lancée sur le casque !';
    return '🥽 Lancer l\'expérience sur le casque';
  }
}