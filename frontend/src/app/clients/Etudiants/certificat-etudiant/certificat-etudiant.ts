import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { SideBarEtudiant } from "../side-bar-etudiant/side-bar-etudiant";
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Formation, FormationEtudiantService } from '../../../services/formation-etudiant-service';

@Component({
  selector: 'app-certificat-etudiant',
  standalone: true,
  imports: [SideBarEtudiant, CommonModule],
  templateUrl: './certificat-etudiant.html',
  styleUrl: './certificat-etudiant.css',
})
export class CertificatEtudiant implements OnChanges, OnDestroy, OnInit {
  @Input() userId: string = '';

  private destroy$ = new Subject<void>();

  certifications: Formation[] = [];
  loading = false;
  downloadingId: string | null = null;

  constructor(
    private formationService: FormationEtudiantService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.userId) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.userId = payload.id || payload._id || payload.userId;
        } catch {
          return;
        }
      }
    }
    if (this.userId) {
      this.loadCertifications();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && this.userId) {
      this.loadCertifications();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCertifications(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.formationService
      .getCertifications(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Certifications reçues:', JSON.stringify(data[0]));
          this.certifications = data;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // ✅ Retourne l'identifiant disponible : operationId ou _id
  private getCertId(cert: Formation): string | null {
    return cert?.operationId || (cert as any)?._id || null;
  }

  async downloadCertificate(cert: Formation): Promise<void> {
    const id = this.getCertId(cert);

    if (!id) {
      alert('Identifiant de session introuvable');
      return;
    }

    this.downloadingId = id;
    this.cdr.markForCheck();

    const token = localStorage.getItem('token');
    const url = `https://surgery-vr.onrender.com/api/pdf/certificate/${id}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Certificat PDF error:', text);
        alert(`Erreur ${res.status} lors de la génération du certificat`);
        return;
      }

      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/pdf')) {
        console.error('Réponse non-PDF reçue:', contentType);
        alert('Erreur : réponse invalide du serveur');
        return;
      }

      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `certificat_${cert.certification?.certificationName || cert.scenarioName}_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);

    } catch (e) {
      console.error('Fetch error:', e);
      alert('Impossible de contacter le serveur');
    } finally {
      this.downloadingId = null;
      this.cdr.markForCheck();
    }
  }

  // ✅ Utilisé dans le template pour les comparaisons [disabled] et [class.downloading]
  getCertIdPublic(cert: Formation): string | null {
    return this.getCertId(cert);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  get bestScore(): number {
    if (!this.certifications.length) return 0;
    return Math.max(...this.certifications.map(c => c.performanceMetrics?.totalScore || 0));
  }

  get avgScore(): number {
    if (!this.certifications.length) return 0;
    const sum = this.certifications.reduce((acc, c) => acc + (c.performanceMetrics?.totalScore || 0), 0);
    return Math.round(sum / this.certifications.length);
  }
}