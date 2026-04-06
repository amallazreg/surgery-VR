import { CommonModule }       from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule }         from '@angular/forms';
import { SideBar }             from '../side-bar/side-bar';
import { ExperienceBackend, Experiences } from '../../../services/experiences';

export type ExpStatus  = 'live' | 'draft' | 'paused' | 'new';
export type SubStatus  = 'active' | 'expiring' | 'expired';

export type ApkDevice = {
  icon: string; name: string; version: string;
  android: string; size: string; recommended?: boolean;
};

export interface Experience {
  id: string;
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
  apkInstalled: boolean;
  apkUrl?: string;
  apkOriginalName?: string;
  apkAndroid?: string;
  apkVersion?: string;
  apkSize?: string;
  appLabUrl?: string;
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
  apkUsed: number;
  apkRestants: number;
  apkTotal: number;
  maxSlots: number;
  experiences: Experience[];
}

@Component({
  selector:    'app-mes-experiences',
  standalone:  true,
  imports:     [CommonModule, FormsModule, SideBar],
  templateUrl: './mes-experiences.html',
  styleUrl:    './mes-experiences.css',
})
export class MesExperiences implements OnInit {

  userId = localStorage.getItem('userId') || '';

  searchQuery   = '';
  activeFilter  = 'all';
  isLoading     = true;
  errorMessage  = '';

  filters = [
    { key: 'all',    label: 'Toutes' },
    { key: 'live',   label: '🟢 Live' },
    { key: 'draft',  label: '✏️ Brouillons' },
    { key: 'paused', label: '⏸ Pausées' },
  ];

  subscriptionGroups: SubscriptionGroup[] = [
    {
      key:              'active',
      planName:         'Chargement...',
      planIcon:         '⏳',
      ref:              '',
      expireLabel:      '',
      headerClass:      'sgh-pro',
      status:           'active',
      totalExperiences: 0,
      totalRespondents: 0,
      apkUsed:          0,
      apkRestants:      0,
      apkTotal:         0,
      maxSlots:         6,
      experiences:      [],
    },
  ];

  get activeSubscription(): SubscriptionGroup {
    return this.subscriptionGroups[0];
  }

  get totalExperiences(): number {
    return this.activeSubscription.experiences.filter(e => !e.isEmpty).length;
  }

  get avgCompletionRate(): number {
    const exps = this.activeSubscription.experiences.filter(
      e => !e.isEmpty && e.respondents > 0
    );
    if (!exps.length) return 0;
    const avg = exps.reduce(
      (s, e) => s + (e.rating ? 75 + (e.rating / 5) * 25 : 75), 0
    ) / exps.length;
    return Math.round(avg);
  }

  get globalAvgTime(): string {
    const exps = this.activeSubscription.experiences.filter(
      e => !e.isEmpty && e.avgTime !== '—' && e.respondents > 0
    );
    if (!exps.length) return '—';
    const totalSecs = exps.reduce((s, e) => {
      const parts = e.avgTime.split(':').map(Number);
      return s + parts[0] * 60 + (parts[1] || 0);
    }, 0);
    const avg = Math.round(totalSecs / exps.length);
    return `${Math.floor(avg / 60)}:${String(avg % 60).padStart(2, '0')}`;
  }

  get totalApk(): number {
    return this.activeSubscription.apkUsed;
  }

  apkVersions: ApkDevice[] = [
    { icon: '🥽', name: 'Meta Quest 2 & 3', version: 'v2.4.1', android: 'Android 11+', size: '124 Mo', recommended: true },
    { icon: '🥽', name: 'Meta Quest Pro',   version: 'v2.4.1', android: 'Android 12+', size: '138 Mo' },
    { icon: '📱', name: 'Pico 4 / Neo 3',  version: 'v2.3.0', android: 'Android 10+', size: '119 Mo' },
  ];

  downloadStates: Record<number, 'idle' | 'loading' | 'done'> = {
    0: 'idle', 1: 'idle', 2: 'idle',
  };

  apkQuotaMessage = '';
  apkQuotaError   = false;

  isSubscriptionExpired = false;

  constructor(
    private experienceService: Experiences,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadMesExperiences();
  }

  loadMesExperiences(): void {
    this.isLoading    = true;
    this.errorMessage = '';

    this.experienceService.getMesExperiences(this.userId).subscribe({
      next: (data) => {
        const sub = this.subscriptionGroups[0];

        sub.planName    = `Forfait ${data.abonnement.forfaitName}`;
        sub.planIcon    = this.getPlanIcon(data.abonnement.forfaitName);
        sub.headerClass = this.getPlanHeaderClass(data.abonnement.forfaitName);
        sub.apkRestants = data.abonnement.apkRestants;
        sub.apkTotal    = data.abonnement.apkTotal;
        sub.apkUsed     = data.abonnement.apkTotal - data.abonnement.apkRestants;
        sub.expireLabel = data.abonnement.dateFin
          ? new Date(data.abonnement.dateFin).toLocaleDateString('fr-FR')
          : '';

        const mapped: Experience[] = data.experiences.map(
          (e: ExperienceBackend) => this.mapBackendExp(e)
        );

        if (mapped.length < sub.maxSlots) {
          mapped.push(this.emptySlot());
        }

        sub.experiences      = mapped;
        sub.totalExperiences = data.experiences.length;

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        // 404 = pas d'abonnement actif → afficher empty state proprement
        if (err.status === 404) {
          const sub = this.subscriptionGroups[0];
          sub.planName         = 'Aucun abonnement';
          sub.planIcon         = '❌';
          sub.experiences      = [];
          sub.totalExperiences = 0;
          sub.apkRestants      = 0;
          sub.apkTotal         = 0;
          sub.apkUsed          = 0;
          sub.status           = 'expired';
          this.isSubscriptionExpired = true;
          this.errorMessage    = ''; // ← Pas d'erreur affichée
        } else {
          this.errorMessage = err.error?.message || 'Impossible de charger vos expériences.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private mapBackendExp(e: ExperienceBackend): Experience {
    return {
      id:              e._id,
      title:           e.title,
      description:     e.description     || '',
      emoji:           e.emoji           || '🥽',
      thumbClass:      e.thumbClass      || 'vrt-1',
      status:          e.status          || 'new',
      compatibility:   e.compatibility   || 'Quest 2 & 3',
      respondents:     e.respondents     ?? 0,
      avgTime:         e.avgTime         || '—',
      rating:          e.rating          ?? null,
      apkInstalled:    e.apkInstalled,
      apkUrl:          e.apkUrl,
      apkOriginalName: e.apkOriginalName,
      apkAndroid:      e.apkAndroid,
      apkVersion:      e.apkVersion,
      apkSize:         e.apkSize,
      appLabUrl:       e.appLabUrl,
    };
  }

  private emptySlot(): Experience {
    return {
      id: '', title: '', description: '', emoji: '', thumbClass: '',
      status: 'draft', compatibility: '', respondents: 0,
      avgTime: '', rating: null, isEmpty: true, apkInstalled: false,
    };
  }

  // ════════════════════════════════════════════════════════
  // HELPERS UI
  // ════════════════════════════════════════════════════════
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

  getStatusTag(status: ExpStatus): { label: string; cssClass: string } {
    const map: Record<ExpStatus, { label: string; cssClass: string }> = {
      live:   { label: '● LIVE',       cssClass: 'est-live'   },
      new:    { label: '✦ NOUVEAU',    cssClass: 'est-new'    },
      paused: { label: '⏸ PAUSÉE',    cssClass: 'est-paused' },
      draft:  { label: '✏️ BROUILLON', cssClass: 'est-draft'  },
    };
    return map[status];
  }

  getSubBadge(status: SubStatus): { label: string; cssClass: string } {
    const map: Record<SubStatus, { label: string; cssClass: string }> = {
      active:   { label: 'Actif',          cssClass: 'sgb-active'   },
      expiring: { label: 'Expire bientôt', cssClass: 'sgb-expiring' },
      expired:  { label: 'Expiré',         cssClass: 'sgb-expired'  },
    };
    return map[status];
  }

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
  // MODAL APK
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
    if ((e.target as HTMLElement).classList.contains('apk-overlay')) {
      this.closeAPKModal();
    }
  }

  downloadApk(index: number): void {
    if (!this.selectedExp) return;

    if (this.activeSubscription.apkRestants <= 0 && !this.selectedExp.apkInstalled) {
      this.apkQuotaMessage = `Quota APK épuisé (${this.activeSubscription.apkTotal} APK/mois). Renouvelez votre abonnement.`;
      this.apkQuotaError   = true;
      return;
    }

    this.downloadStates[index] = 'loading';
    this.apkQuotaMessage       = '';
    this.apkQuotaError         = false;

    this.experienceService
      .downloadExperienceApk(this.userId, this.selectedExp.id)
      .subscribe({
        next: (res) => {
          this.downloadStates[index] = 'done';

          this.activeSubscription.apkRestants = res.apkRestants;
          this.activeSubscription.apkUsed =
            this.activeSubscription.apkTotal - res.apkRestants;

          const exp = this.activeSubscription.experiences.find(
            e => e.id === this.selectedExp!.id
          );
          if (exp) {
            exp.apkInstalled = true;
            if (exp.status === 'draft') exp.status = 'new';
          }

          this.triggerDownload(res.downloadUrl, res.fileName);

          this.apkQuotaMessage = res.dejaInstalle
            ? `✅ Re-téléchargement OK — quota non décompté.`
            : `✅ APK téléchargé ! ${res.apkRestants} restants ce mois.`;
          this.apkQuotaError = false;

          this.cdr.detectChanges();

          setTimeout(() => {
            this.closeAPKModal();
            this.downloadStates[index] = 'idle';
          }, 2200);
        },
        error: (err) => {
          this.downloadStates[index] = 'idle';
          this.apkQuotaMessage       = err.error?.message || 'Erreur lors du téléchargement.';
          this.apkQuotaError         = true;
          this.cdr.detectChanges();
        },
      });
  }

  private triggerDownload(url: string, fileName: string): void {
    const a   = document.createElement('a');
    a.href    = url;
    a.download = fileName;
    a.target  = '_blank';
    a.rel     = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
  isVrModalOpen     = false;
  selectedExpForVr  = '';
  selectedExpVr: Experience | null = null;
  vrLaunchState: 'idle' | 'loading' | 'done' = 'idle';
  linkCopied        = false;

  openVRModal(exp: Experience): void {
    if (!exp.apkInstalled) return;
    this.selectedExpVr    = exp;
    this.selectedExpForVr = exp.title;
    this.vrLaunchState    = 'idle';
    this.linkCopied       = false;
    this.isVrModalOpen    = true;
    document.body.style.overflow = 'hidden';
  }

  closeVRModal(): void {
    this.isVrModalOpen = false;
    this.vrLaunchState = 'idle';
    this.linkCopied    = false;
    document.body.style.overflow = '';
  }

  onVrOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('vr-overlay')) {
      this.closeVRModal();
    }
  }

  launchOnHeadset(): void {
    if (!this.selectedExpVr?.appLabUrl) {
      alert('Lien Meta App Lab non configuré pour cette expérience.');
      return;
    }
    this.vrLaunchState = 'loading';
    setTimeout(() => {
      this.vrLaunchState = 'done';
      window.open(this.selectedExpVr!.appLabUrl, '_blank');
    }, 1000);
    setTimeout(() => {
      this.vrLaunchState = 'idle';
    }, 4000);
  }

  copyAppLabLink(): void {
    if (!this.selectedExpVr?.appLabUrl) return;
    navigator.clipboard.writeText(this.selectedExpVr.appLabUrl).then(() => {
      this.linkCopied = true;
      setTimeout(() => { this.linkCopied = false; }, 2500);
    });
  }

  get vrLaunchLabel(): string {
    if (this.vrLaunchState === 'loading') return '⏳ Ouverture du lien...';
    if (this.vrLaunchState === 'done')    return '✅ Lien ouvert ! Ouvrez-le depuis votre casque.';
    return '🥽 Lancer l\'expérience sur le casque';
  }
}