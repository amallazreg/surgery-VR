import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core'; // ✅
import { Subject, takeUntil } from 'rxjs';
import { Formation, ScenarioSummary, FormationEtudiantService } from '../../../services/formation-etudiant-service';
import { SideBarEtudiant } from '../side-bar-etudiant/side-bar-etudiant';
import { CertificatEtudiant } from '../certificat-etudiant/certificat-etudiant';

type TabType = 'scenarios' | 'certifications';

@Component({
  selector: 'app-formation-etudiant',
  standalone: true,
  imports: [CommonModule, SideBarEtudiant,CertificatEtudiant],
  templateUrl: './formation-etudiant.html',
  styleUrl: './formation-etudiant.css',
})
export class FormationEtudiant implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  activeTab: TabType = 'scenarios';
  loading = true;
  loadingSession = false;
  error: string | null = null;

  summaries: ScenarioSummary[] = [];
  certifications: Formation[] = [];
  expandedScenario: string | null = null;
  selectedSession: Formation | null = null;
  showSessionModal = false;

  totalSessions = 0;
  validatedCount = 0;
  avgScore = 0;

  @Input()  userId: string = '';

  constructor(
    private formationService: FormationEtudiantService,
    private cdr: ChangeDetectorRef // ✅
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userId = payload.id || payload._id || payload.userId;
      } catch {
        this.error = 'Session invalide. Veuillez vous reconnecter.';
        this.loading = false;
        return;
      }
    }
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.formationService
      .getSummary(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.summaries = data;
          this.computeStats();
          this.loading = false;
          this.cdr.markForCheck(); // ✅
        },
        error: () => {
          this.error = 'Impossible de charger les formations.';
          this.loading = false;
          this.cdr.markForCheck(); // ✅
        },
      });

    this.formationService
      .getCertifications(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.certifications = data;
          this.cdr.markForCheck(); // ✅
        },
        error: () => {},
      });
  }

  computeStats(): void {
    this.totalSessions = this.summaries.reduce((acc, s) => acc + s.totalAttempts, 0);
    this.validatedCount = this.summaries.filter((s) => s.isValidated).length;
    const allScores = this.summaries.map((s) => s.bestScore);
    this.avgScore = allScores.length
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;
  }

  setTab(tab: TabType): void {
    this.activeTab = tab;
    this.cdr.markForCheck(); // ✅
  }

  toggleScenario(scenarioName: string): void {
    this.expandedScenario = this.expandedScenario === scenarioName ? null : scenarioName;
    this.cdr.markForCheck(); // ✅
  }

  isExpanded(scenarioName: string): boolean {
    return this.expandedScenario === scenarioName;
  }

  openSessionDetail(operationId: string): void {
    this.loadingSession = true;
    this.showSessionModal = true;
    this.formationService
      .getSession(this.userId, operationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (session) => {
          this.selectedSession = session;
          this.loadingSession = false;
          this.cdr.markForCheck(); // ✅
        },
        error: () => {
          this.loadingSession = false;
          this.showSessionModal = false;
          this.cdr.markForCheck(); // ✅
        },
      });
  }

  closeModal(): void {
    this.showSessionModal = false;
    this.selectedSession = null;
    this.cdr.markForCheck(); // ✅
  }

  downloadSessionPDF(session: Formation, event: Event): void {
    event.stopPropagation();
    this.downloadPDF(`/api/pdf/session/${session.operationId}`);
  }

  downloadSummaryPDF(summary: ScenarioSummary, event: Event): void {
    event.stopPropagation();
    this.downloadPDF(`/api/pdf/summary/${this.userId}/${encodeURIComponent(summary._id)}`);
  }

  downloadCurrentSessionPDF(): void {
    if (this.selectedSession) {
      this.downloadPDF(`/api/pdf/session/${this.selectedSession.operationId}`);
    }
  }

private downloadPDF(url: string): void {
  const token = localStorage.getItem('token');
  const fullUrl = `https://surgery-vr.onrender.com${url}`;
  
  fetch(fullUrl, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => {
      // ✅ Vérification du statut HTTP
      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }
      
      // ✅ Vérification du Content-Type
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/pdf')) {
        throw new Error('Réponse invalide du serveur');
      }
      
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `rapport_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((e) => {
      console.error('Erreur téléchargement PDF:', e);
      alert('Erreur lors du téléchargement du PDF');
    });
}

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 70) return 'score-mid';
    return 'score-low';
  }

  getScoreGradient(score: number): string {
    if (score >= 80) return 'var(--gradient-3)';
    if (score >= 70) return 'linear-gradient(135deg, #FF8C00, #FFB800)';
    return 'var(--gradient-2)';
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  getSeverityClass(severity: string): string {
    return (
      ({ minor: 'severity-minor', major: 'severity-major', critical: 'severity-critical' } as Record<string, string>)[severity] || ''
    );
  }

  trackByScenario(_: number, item: ScenarioSummary): string {
    return item._id;
  }
}