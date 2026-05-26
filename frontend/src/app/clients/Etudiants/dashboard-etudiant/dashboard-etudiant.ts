import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { SideBarEtudiant } from '../side-bar-etudiant/side-bar-etudiant';
import { FormationEtudiantService, ScenarioSummary, Formation } from '../../../services/formation-etudiant-service';
import { AbonnementService } from '../../../services/abonnement-service';

@Component({
  selector: 'app-dashboard-etudiant',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, SideBarEtudiant],
  templateUrl: './dashboard-etudiant.html',
  styleUrl: './dashboard-etudiant.css',
})
export class DashboardEtudiant implements OnInit {

  // ── Infos utilisateur ──
  userName = '';
  userId   = '';
  today    = '';
  nbNotifs = 0;

  // ── Mode d'accès ──
  accessMode   : 'abonnement' | 'code' | null = null;
  accessLabel  = '';
  accessExpiry = '';
  institution  = '';
  simulationIncluse = false;

  // ── Données ──
  formations    : (ScenarioSummary & { color: string; emoji: string })[] = [];
  certifications: Formation[] = [];
  sessions      : Formation[] = [];
  isLoading     = true;

  // ── KPI ──
  stats = {
    totalSessions   : 0,
    scoreMoyen      : 0,
    certifications  : 0,
    heuresPratique  : 0,
    dernieresCertif : '',
  };

  private scenarioThemes = [
    { color: 'blue',   emoji: '🫀' },
    { color: 'green',  emoji: '🧠' },
    { color: 'amber',  emoji: '🦴' },
    { color: 'purple', emoji: '👁️' },
    { color: 'teal',   emoji: '🩺' },
  ];

  constructor(
    private formationService: FormationEtudiantService,
    private abonnementService: AbonnementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userId   = localStorage.getItem('userId')  || '';
    const nom     = localStorage.getItem('nom')     || '';
    const prenom  = localStorage.getItem('prenom')  || '';
    this.userName = `${prenom} ${nom}`.trim() || 'Étudiant';
    this.institution = localStorage.getItem('etablissement') || '—';

    const now = new Date();
    this.today = now.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    this.today = this.today.charAt(0).toUpperCase() + this.today.slice(1);

    if (!this.userId) return;
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.isLoading = true;

    forkJoin({
      resume   : this.formationService.getSummary(this.userId)
                   .pipe(catchError(() => of([] as ScenarioSummary[]))),
      certifs  : this.formationService.getCertifications(this.userId)
                   .pipe(catchError(() => of([] as Formation[]))),
      sessions : this.formationService.getAllFormations(this.userId)
                   .pipe(catchError(() => of([] as Formation[]))),
      droits   : this.abonnementService.getMesDroits(this.userId)
                   .pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ resume, certifs, sessions, droits }) => {

        // ── Formations par scénario ──
        this.formations = resume.map((f, i) => ({
          ...f,
          ...this.scenarioThemes[i % this.scenarioThemes.length],
        }));

        // ── Certifications ──
        this.certifications = certifs;

        // ── Sessions (tri par date desc) ──
        this.sessions = [...sessions].sort(
          (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
        );

        // ── KPI ──
        this.stats.totalSessions  = sessions.length;
        this.stats.certifications = certifs.length;

        const scores = sessions
          .map(s => s.performanceMetrics?.totalScore)
          .filter((s): s is number => s != null);

        this.stats.scoreMoyen = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        const totalSec = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
        this.stats.heuresPratique = Math.round(totalSec / 3600);

        if (certifs.length > 0) {
          this.stats.dernieresCertif = this.formatDate(certifs[0].certification?.issuedAt ?? undefined);
        }

        // ── Mode accès ──
        if (droits) {
          this.accessMode        = 'abonnement';
          this.accessLabel       = droits.forfait || 'Abonnement';
          this.simulationIncluse = droits.simulationEsthetique ?? false;
          this.accessExpiry      = droits.dateFin
            ? new Date(droits.dateFin).toLocaleDateString('fr-FR')
            : '—';
        } else {
          this.accessMode  = 'code';
          this.accessLabel = 'Code Formation';
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Helpers ──

  getScorePercent(score: number | null | undefined): number {
    return score != null ? Math.min(score, 100) : 0;
  }

  getScoreClass(score: number | null | undefined): string {
    if (score == null) return 'score-none';
    if (score >= 75)   return 'score-high';
    if (score >= 50)   return 'score-mid';
    return 'score-low';
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  formatDuration(seconds: number | undefined): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return `${h}h ${m % 60}min`;
    }
    return `${m}min`;
  }
}