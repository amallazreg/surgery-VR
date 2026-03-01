import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SideBar } from "../side-bar/side-bar";

export type ExpStatus = 'live' | 'draft' | 'paused' | 'new';
export type SubStatus = 'active' | 'expiring' | 'expired';
export type ApkDevice = { icon: string; name: string; version: string; android: string; size: string; recommended?: boolean; };

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
  apkUsed: string;
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

  // ── Search ───────────────────────────────────────────────
  searchQuery = '';

  // ── Filter ───────────────────────────────────────────────
  activeFilter: string = 'all';

  filters = [
    { key: 'all',    label: 'Toutes' },
    { key: 'live',   label: '🟢 Live' },
    { key: 'draft',  label: '✏️ Brouillons' },
    { key: 'paused', label: '⏸ Pausées' },
  ];

  // ── Single active subscription ────────────────────────────
  subscriptionGroups: SubscriptionGroup[] = [
    {
      key: 'pro',
      planName: 'Forfait Pro',
      planIcon: '⚡',
      ref: 'SVR-PRO-2026-0128 · Expire le 28 Mars 2026 · 36 jours restants',
      expireLabel: '28 Mars 2026',
      headerClass: 'sgh-pro',
      status: 'active',
      totalExperiences: 5,
      totalRespondents: 987,
      apkUsed: '3/5',
      maxSlots: 6,
      experiences: [
        {
          id: 1,
          title: 'Satisfaction Magasin — Tunis Centre',
          description: 'Parcours client immersif dans un environnement de magasin 3D pour mesurer la satisfaction en rayon.',
          emoji: '🛍️', thumbClass: 'vrt-1', status: 'live',
          compatibility: 'Quest 2 & 3', respondents: 342, avgTime: '4:32', rating: 4.7,
        },
        {
          id: 2,
          title: 'Parcours Magasin — Sfax Point de Vente',
          description: 'Navigation guidée dans la boutique VR pour évaluer la signalétique et le placement des produits.',
          emoji: '🗺️', thumbClass: 'vrt-2', status: 'live',
          compatibility: 'Quest 3', respondents: 218, avgTime: '6:15', rating: 4.5,
        },
        {
          id: 3,
          title: 'Test Produit — Campagne Ramadan 2026',
          description: 'Évaluation des préférences produits dans un décor thématique Ramadan avec choix interactifs en VR.',
          emoji: '🌙', thumbClass: 'vrt-3', status: 'new',
          compatibility: 'Quest 2 & 3', respondents: 47, avgTime: '3:48', rating: 4.9,
        },
        {
          id: 4,
          title: 'Nouveau Concept Store — Avis Clients',
          description: 'Visite virtuelle d\'un concept store avant inauguration pour recueillir les avis sur l\'agencement.',
          emoji: '🏪', thumbClass: 'vrt-4', status: 'paused',
          compatibility: 'Quest 2', respondents: 95, avgTime: '5:02', rating: 4.2,
        },
        {
          id: 5,
          title: 'Test Packaging — Nouvelle Gamme Bio',
          description: 'Comparaison de designs packaging en environnement rayon 3D avant lancement commercial.',
          emoji: '📦', thumbClass: 'vrt-5', status: 'draft',
          compatibility: 'Quest 3', respondents: 0, avgTime: '—', rating: null,
        },
        { id: 6, title: '', description: '', emoji: '', thumbClass: '', status: 'draft', compatibility: '', respondents: 0, avgTime: '', rating: null, isEmpty: true },
      ],
    },
  ];

  /** The single active subscription */
  get activeSubscription(): SubscriptionGroup {
    return this.subscriptionGroups[0];
  }

  // ── Global stats ─────────────────────────────────────────
  get totalExperiences(): number {
    return this.activeSubscription.experiences.filter(e => !e.isEmpty).length;
  }

  /** Average completion rate: respondents / (respondents + 0 rated) — mocked as 87% here */
  get avgCompletionRate(): number {
    const exps = this.activeSubscription.experiences.filter(e => !e.isEmpty && e.respondents > 0);
    if (!exps.length) return 0;
    // Mocked formula: completion = 75 + (rating / 5) * 25
    const avg = exps.reduce((s, e) => s + (e.rating ? 75 + (e.rating / 5) * 25 : 75), 0) / exps.length;
    return Math.round(avg);
  }

  /** Global average session time across all experiences */
  get globalAvgTime(): string {
    const exps = this.activeSubscription.experiences.filter(e => !e.isEmpty && e.avgTime !== '—' && e.respondents > 0);
    if (!exps.length) return '—';
    const totalSecs = exps.reduce((s, e) => {
      const [m, sec] = e.avgTime.split(':').map(Number);
      return s + m * 60 + sec;
    }, 0);
    const avg = Math.round(totalSecs / exps.length);
    return `${Math.floor(avg / 60)}:${String(avg % 60).padStart(2, '0')}`;
  }

  get totalApk(): number { return 3; }

  // ── APK versions ─────────────────────────────────────────
  apkVersions: ApkDevice[] = [
    { icon: '🥽', name: 'Meta Quest 2 & 3', version: 'v2.4.1', android: 'Android 11+', size: '124 Mo', recommended: true },
    { icon: '🥽', name: 'Meta Quest Pro',    version: 'v2.4.1', android: 'Android 12+', size: '138 Mo' },
    { icon: '📱', name: 'Pico 4 / Neo 3',   version: 'v2.3.0', android: 'Android 10+', size: '119 Mo' },
  ];
  downloadStates: Record<number, 'idle' | 'loading' | 'done'> = { 0: 'idle', 1: 'idle', 2: 'idle' };

  // ── Helpers ──────────────────────────────────────────────
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
    return exp.status === 'live' || exp.status === 'new' || exp.status === 'paused';
  }

  getSubBadge(status: SubStatus): { label: string; cssClass: string } {
    const map: Record<SubStatus, { label: string; cssClass: string }> = {
      active:   { label: 'Actif',          cssClass: 'sgb-active' },
      expiring: { label: 'Expire bientôt', cssClass: 'sgb-expiring' },
      expired:  { label: 'Expiré',         cssClass: 'sgb-expired' },
    };
    return map[status];
  }

  filteredExperiencesFlat(): Experience[] {
    return this.activeSubscription.experiences.filter(exp => {
      if (exp.isEmpty) return this.activeFilter === 'all';
      const matchFilter = this.activeFilter === 'all' || exp.status === this.activeFilter;
      const matchSearch = !this.searchQuery || exp.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }

  setFilter(key: string): void { this.activeFilter = key; }

  // ── Modal : APK ──────────────────────────────────────────
  isApkModalOpen = false;
  selectedExpForApk = '';

  openAPKModal(exp: Experience): void {
    this.selectedExpForApk = exp.title;
    this.downloadStates = { 0: 'idle', 1: 'idle', 2: 'idle' };
    this.isApkModalOpen = true;
    document.body.style.overflow = 'hidden';
  }
  closeAPKModal(): void { this.isApkModalOpen = false; document.body.style.overflow = ''; }
  onApkOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('apk-overlay')) this.closeAPKModal();
  }
  downloadApk(index: number): void {
    this.downloadStates[index] = 'loading';
    setTimeout(() => {
      this.downloadStates[index] = 'done';
      setTimeout(() => { this.downloadStates[index] = 'idle'; }, 2500);
    }, 1500);
  }
  getDownloadIcon(index: number): string {
    const s = this.downloadStates[index];
    return s === 'loading' ? '⏳' : s === 'done' ? '✓' : '⬇';
  }

  // ── Modal : VR Test ──────────────────────────────────────
  isVrModalOpen = false;
  selectedExpForVr = '';
  vrLaunchState: 'idle' | 'loading' | 'done' = 'idle';

  openVRModal(exp: Experience): void {
    this.selectedExpForVr = exp.title;
    this.vrLaunchState = 'idle';
    this.isVrModalOpen = true;
    document.body.style.overflow = 'hidden';
  }
  closeVRModal(): void { this.isVrModalOpen = false; this.vrLaunchState = 'idle'; document.body.style.overflow = ''; }
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

  ngOnInit(): void {}
}