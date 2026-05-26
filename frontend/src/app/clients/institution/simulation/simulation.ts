import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';

import {
  AnalysisResult,
  SimulationAIService,
  SimulationResult
} from '../../../services/simulation-aiservice';
import { RouterModule } from '@angular/router';


import { SideBar } from "../side-bar/side-bar";
import { RapportSimulation } from '../../../services/rapport-simulation';

type Step = 'upload' | 'analyzing' | 'results';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule, HttpClientModule, SideBar,RouterModule],
  templateUrl: './simulation.html',
  styleUrl: './simulation.css',
})
export class Simulation {

  @ViewChild('fileInput') fileInput!: ElementRef;

  step: Step = 'upload';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  result: AnalysisResult | null = null;
  error: string | null = null;
  isDragging = false;
  analysisProgress = 0;

  simulationResult: SimulationResult | null = null;
  isSimulating = false;

  // ✅ Procédure choisie par le patient
  selectedProcedure: string | null = null;

  // ── Accès abonnement ──
  userId          = localStorage.getItem('userId') || '';
  droits: any     = null;
  isLoadingDroits = true;
  hasAccess       = false;   // ← true seulement si Business

  procedureLabels: Record<string, string> = {
    rhinoplastie:        'Rhinoplastie',
    blepharoplastie:     'Blépharoplastie',
    lifting:             'Lifting Facial',
    augmentation_levres: 'Augmentation des lèvres',
    aucune_intervention: 'Aucune intervention',
  };

  procedureIcons: Record<string, string> = {
    rhinoplastie:        '👃',
    blepharoplastie:     '👁️',
    lifting:             '✨',
    augmentation_levres: '💋',
    aucune_intervention: '✅',
  };

  constructor(
    private simulationService: SimulationAIService,
    private cdr: ChangeDetectorRef,
    private raportService : RapportSimulation
  ) {}

    ngOnInit(): void {
   this.verifierAcces();
      this.cdr.detectChanges();

  }

  // ── Vérification abonnement Business ──
  verifierAcces(): void {
    this.isLoadingDroits = true;

    this.simulationService.getMesDroits(this.userId).subscribe({
      next: (data) => {
        this.droits          = data;
        // ✅ Accès autorisé seulement si type === 'Business'
        this.hasAccess       = data?.typeAbonnement === 'Business'
                            || data?.forfait === 'Business'
                            || data?.simulation?.activee === true;
        this.isLoadingDroits = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.hasAccess       = false;
        this.isLoadingDroits = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging = true;
    this.cdr.detectChanges();
  }

  onDragLeave() {
    this.isDragging = false;
    this.cdr.detectChanges();
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.handleFile(file);
    this.cdr.detectChanges();
  }

  onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) this.handleFile(input.files[0]);
  }

  handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.error = 'Veuillez sélectionner une image valide.';
      this.cdr.detectChanges();
      return;
    }
    this.selectedFile = file;
    this.error = null;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  analyze() {
    if (!this.selectedFile) return;
    this.step = 'analyzing';
    this.analysisProgress = 0;
    this.cdr.detectChanges();

    const interval = setInterval(() => {
      this.analysisProgress += Math.random() * 15;
      if (this.analysisProgress >= 90) clearInterval(interval);
      this.cdr.detectChanges();
    }, 300);

    this.simulationService.analyzeFace(this.selectedFile).subscribe({
      next: (result) => {
        clearInterval(interval);
        this.analysisProgress = 100;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.result = result;
          this.step = 'results';
          // ✅ Initialiser avec la procédure recommandée
          this.selectedProcedure = result.recommendation.procedure;
          this.cdr.detectChanges();
        }, 500);
      },
      error: () => {
        clearInterval(interval);
        this.error = 'Erreur lors de l\'analyse. Veuillez réessayer.';
        this.step = 'upload';
        this.cdr.detectChanges();
      }
    });
  }

  reset() {
    this.step = 'upload';
    this.selectedFile = null;
    this.previewUrl = null;
    this.result = null;
    this.error = null;
    this.analysisProgress = 0;
    this.simulationResult = null;
    this.selectedProcedure = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
    this.cdr.detectChanges();
  }

  // ✅ Procédures disponibles pour ce patient
  getAvailableProcedures(): string[] {
    const available = ['rhinoplastie', 'blepharoplastie'];
    const recommended = this.result?.recommendation.procedure;
    const alternatives = this.result?.recommendation.alternatives.map(a => a.procedure) ?? [];

    return available.filter(p =>
      p === recommended || alternatives.includes(p)
    );
  }

  // ✅ Sélectionner une procédure
  selectProcedure(proc: string) {
    this.selectedProcedure = proc;
    this.simulationResult = null; // reset résultat précédent
    this.cdr.detectChanges();
  }

  // ✅ Simulation avec la procédure choisie
  simulate() {
    if (!this.selectedFile || !this.selectedProcedure) return;
    this.isSimulating = true;
    this.simulationResult = null;

    this.simulationService
      .generateSimulation(this.selectedFile, this.selectedProcedure)
      .subscribe({
        next: (res) => {
          this.simulationResult = res;
          this.isSimulating = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.status === 0
            ? 'La génération a pris trop de temps. Réessayez.'
            : 'Erreur lors de la simulation. Réessayez.';
          this.isSimulating = false;
          this.cdr.detectChanges();
        }
      });
  }

  isSimulationAvailable(): boolean {
    return this.getAvailableProcedures().length > 0;
  }

  getConfidencePercent(): number {
    return Math.round((this.result?.recommendation.confidence ?? 0) * 100);
  }

  getSymmetryPercent(): number {
    return Math.round((this.result?.features.scores.symmetry_score ?? 0) * 100);
  }

  getGoldenRatioPercent(): number {
    return Math.round((this.result?.features.scores.golden_ratio_score ?? 0) * 100);
  }

  getProcedureLabel(proc: string): string {
    return this.procedureLabels[proc] ?? proc;
  }

  getProcedureIcon(proc: string): string {
    return this.procedureIcons[proc] ?? '🔬';
  }

  getScoreColor(score: number): string {
    if (score >= 0.8) return '#00C48C';
    if (score >= 0.6) return '#0066FF';
    if (score >= 0.4) return '#FF6B00';
    return '#FF006E';
  }

  downloadReport() {
  if (!this.result) return;
  this.raportService.generateReport(
    this.result,
    this.simulationResult,
    this.previewUrl,
    this.selectedProcedure,
    this.procedureLabels
  );
}
}