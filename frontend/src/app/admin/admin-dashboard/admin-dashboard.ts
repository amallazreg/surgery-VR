import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  AfterViewInit,
  PLATFORM_ID
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SideBar } from '../side-bar/side-bar';
import { AdminService } from '../../services/admin-service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HttpClientModule, SideBar,RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit, AfterViewInit {

  isLoading = true;
  error: string | null = null;

  stats = {
    demandesDemo:         0, demandesDemoVariation:  null as number | null,
    devis:                0, devisVariation:         null as number | null,
    clientsActifs:        0, clientsVariation:       null as number | null,
    enAttente:            0, enAttenteVariation:     null as number | null,
  };

  dernieresDemandes: any[] = [];
  tousLesComptes:    any[] = [];
  activiteRecente:   { icon: string; titre: string; desc: string; temps: string; type: string }[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initAnimations(), 300);
    }
  }

  chargerDonnees(): void {
    this.isLoading = true;
    this.error = null;

    // ── Stats KPI (3 appels en parallèle) ──
    forkJoin([
      this.adminService.statistiquesDemo(),
      this.adminService.statistiquesDevis(),
      this.adminService.statistiquesCompte()
    ]).subscribe({
      next: ([statsDemo, statsDevis, statsComptes]) => {
        this.stats.demandesDemo          = statsDemo.totaux?.all          ?? 0;
        this.stats.demandesDemoVariation = statsDemo.periode30j?.variation ?? null;

        this.stats.devis         = statsDevis.totaux?.all          ?? 0;
        this.stats.devisVariation = statsDevis.periode30j?.variation ?? null;

        this.stats.clientsActifs   = statsComptes.totaux?.approuve         ?? 0;
        this.stats.clientsVariation = statsComptes.periode30j?.variation   ?? null;

        this.stats.enAttente        = statsComptes.totaux?.enAttente ?? 0;
        this.stats.enAttenteVariation = null;

        this.activiteRecente = this.construireActivite(statsDemo, statsDevis, statsComptes);

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur de chargement des statistiques.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    // ── Tableau demandes démo ──
    this.adminService.tousDemandeDemo().subscribe({
      next: (data: any[]) => {
        this.dernieresDemandes = data
          .filter((d: any) => d.statut === 'nouvelle')
          .slice(0, 5);
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    // ── Tableau comptes clients ──
    this.adminService.tousclients().subscribe({
      next: (data: any[]) => {
        this.tousLesComptes = data.slice(0, 6);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  construireActivite(statsDemo: any, statsDevis: any, statsComptes: any): any[] {
    const items: any[] = [];

    const nDemo = statsDemo.totaux?.nouvelle ?? 0;
    if (nDemo > 0) items.push({
      icon: '🎥', type: 'demo',
      titre: 'Demandes de démo nouvelles',
      desc: `${nDemo} demande(s) en attente de traitement`,
      temps: "Aujourd'hui"
    });

    const nDevis = statsDevis.totaux?.nouvelle ?? 0;
    if (nDevis > 0) items.push({
      icon: '📄', type: 'quote',
      titre: 'Devis en attente',
      desc: `${nDevis} devis à traiter`,
      temps: "Aujourd'hui"
    });

    const nComptes = statsComptes.totaux?.enAttente ?? 0;
    if (nComptes > 0) items.push({
      icon: '👤', type: 'user',
      titre: "Comptes en attente d'approbation",
      desc: `${nComptes} compte(s) à valider`,
      temps: "Aujourd'hui"
    });

    const montant = statsDevis.finances?.montantTotal ?? 0;
    if (montant > 0) items.push({
      icon: '💰', type: 'quote',
      titre: "Chiffre d'affaires total",
      desc: `${montant.toLocaleString('fr-FR')} DT générés`,
      temps: 'Depuis le début'
    });

    const nContactee = statsDemo.totaux?.contactee ?? 0;
    if (nContactee > 0) items.push({
      icon: '✅', type: 'user',
      titre: 'Démos contactées',
      desc: `${nContactee} demande(s) traitée(s)`,
      temps: 'Total'
    });

    const nEnvoyee = statsDevis.totaux?.envoyee ?? 0;
    if (nEnvoyee > 0) items.push({
      icon: '🎯', type: 'demo',
      titre: 'Devis envoyés',
      desc: `${nEnvoyee} devis envoyés avec succès`,
      temps: 'Total'
    });

    return items.slice(0, 6);
  }

  getVariationLabel(v: number | null): string {
    if (v === null) return 'N/A';
    return v >= 0 ? `↗ +${v}%` : `↘ ${v}%`;
  }

  isPositive(v: number | null): boolean { return v !== null && v >= 0; }
  isNegative(v: number | null): boolean { return v !== null && v < 0; }

  getStatutLabel(statut: string): string {
    return ({ approuve: 'Actif', en_attente: 'En attente', rejete: 'Rejeté' } as any)[statut] ?? statut;
  }

  getStatutClass(statut: string): string {
    return ({ approuve: 'status-active', en_attente: 'status-inactive', rejete: 'status-inactive' } as any)[statut] ?? '';
  }

  getDemoStatutLabel(statut: string): string {
    return ({ nouvelle: 'En attente', contactee: 'Contactée', cloturee: 'Clôturée' } as any)[statut] ?? statut;
  }

  getDemoStatutClass(statut: string): string {
    return ({ nouvelle: 'status-pending', contactee: 'status-approved', cloturee: 'status-approved' } as any)[statut] ?? '';
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  initAnimations(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    setTimeout(() => {
      document.querySelectorAll('.stat-card, .section-card').forEach(el => observer.observe(el));
    }, 100);
  }
}