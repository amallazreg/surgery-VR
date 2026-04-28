import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { SideBar } from '../side-bar/side-bar';
import { AdminService } from '../../services/admin-service';

// ── Types ──────────────────────────────────────────────────────────────────

interface StatComptesClients {
  totaux: { all: number; enAttente: number; approuve: number; rejete: number };
  periode30j: { inscriptions: number; variation: number | null };
  taux: { approbation: number; enAttenteRatio: number; delaiMoyenApprobH: number | null };
  courbes: {
    parJour: { date: string; total: number; approuves: number; rejetes: number; enAttente: number }[];
    parMois: { periode: string; total: number; approuves: number; rejetes: number }[];
  };
}

interface StatDevis {
  totaux: { all: number; nouvelle: number; enCours: number; envoyee: number };
  periode30j: { total: number; montant: number; nbEnvoyes: number; variation: number | null };
  finances: {
    montantTotal: number;
    montantMoyen: number;
    montantMin: number;
    montantMax: number;
    nbDevisEnvoyes: number;
  };
  taux: { envoi: number; delaiMoyenH: number | null };
  courbes: {
    parJour: { date: string; total: number; envoyees: number; enCours: number; montantJour: number }[];
    parMois: { periode: string; total: number; montantMois: number }[];
  };
}

interface StatDemo {
  totaux: { all: number; nouvelle: number; contactee: number; cloturee: number };
  periode30j: {
    total: number;
    nouvelle: number;
    contactee: number;
    cloturee: number;
    variation: number | null;
  };
  taux: { contactage: number; cloture: number };
  delaiMoyenContactH: number | null;
  courbes: {
    parJour: { date: string; total: number; nouvelles: number; contactees: number; cloturees: number }[];
    parMois: { periode: string; total: number }[];
  };
}

// ── Valeurs vides (évite les erreurs de template avant chargement) ──────────

const emptyComptes: StatComptesClients = {
  totaux: { all: 0, enAttente: 0, approuve: 0, rejete: 0 },
  periode30j: { inscriptions: 0, variation: null },
  taux: { approbation: 0, enAttenteRatio: 0, delaiMoyenApprobH: null },
  courbes: { parJour: [], parMois: [] },
};

const emptyDevis: StatDevis = {
  totaux: { all: 0, nouvelle: 0, enCours: 0, envoyee: 0 },
  periode30j: { total: 0, montant: 0, nbEnvoyes: 0, variation: null },
  finances: { montantTotal: 0, montantMoyen: 0, montantMin: 0, montantMax: 0, nbDevisEnvoyes: 0 },
  taux: { envoi: 0, delaiMoyenH: null },
  courbes: { parJour: [], parMois: [] },
};

const emptyDemo: StatDemo = {
  totaux: { all: 0, nouvelle: 0, contactee: 0, cloturee: 0 },
  periode30j: { total: 0, nouvelle: 0, contactee: 0, cloturee: 0, variation: null },
  taux: { contactage: 0, cloture: 0 },
  delaiMoyenContactH: null,
  courbes: { parJour: [], parMois: [] },
};

// ── Composant ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule, SideBar],
  templateUrl: './statistiques.html',
  styleUrl: './statistiques.css',
})
export class Statistiques implements OnInit, AfterViewInit {
  activeTab: 'comptes' | 'devis' | 'demo' = 'comptes';
  loaded = false;
  loading = true;
  errorMessage: string | null = null;
  today = new Date();

  comptes: StatComptesClients = emptyComptes;
  devis: StatDevis = emptyDevis;
  demo: StatDemo = emptyDemo;

  // Canvas refs
  @ViewChild('chartCompteJour') chartCompteJourRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCompteMois') chartCompteMoisRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDevisJour') chartDevisJourRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDevisMontant') chartDevisMontantRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDemoJour') chartDemoJourRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartDemoFunnel') chartDemoFunnelRef!: ElementRef<HTMLCanvasElement>;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private adminService: AdminService
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit() {
    this.chargerToutesStatistiques();
  }

  ngAfterViewInit() {
    // Les graphiques se dessinent après le chargement des données (voir chargerToutesStatistiques)
  }

  // ── Chargement des données ────────────────────────────────────────────────

  chargerToutesStatistiques() {
    this.loading = true;
    this.errorMessage = null;

    forkJoin({
      comptes: this.adminService.statistiquesCompte(),
      devis: this.adminService.statistiquesDevis(),
      demo: this.adminService.statistiquesDemo(),
    }).subscribe({
      next: ({ comptes, devis, demo }) => {
        this.comptes = comptes;
        this.devis = devis;
        this.demo = demo;
        this.loading = false;
        this.loaded = true;
        this.cdr.detectChanges();
        setTimeout(() => this.renderCharts(), 300);
      },
      error: (err) => {
        console.error('Erreur chargement statistiques:', err);
        this.errorMessage = 'Impossible de charger les statistiques. Veuillez réessayer.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Navigation entre onglets ──────────────────────────────────────────────

  setTab(tab: 'comptes' | 'devis' | 'demo') {
    this.activeTab = tab;
    this.cdr.detectChanges();
    setTimeout(() => this.renderCharts(), 150);
  }

  // ── Formatage ─────────────────────────────────────────────────────────────

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      maximumFractionDigits: 0,
    }).format(v);
  }

  formatVariation(v: number | null): string {
    if (v === null || v === undefined) return 'N/A';
    return (v > 0 ? '+' : '') + v + '%';
  }

  variationClass(v: number | null): string {
    if (v === null || v === undefined) return '';
    return v >= 0 ? 'positive' : 'negative';
  }

  // ── Rendu des graphiques ──────────────────────────────────────────────────

  private renderCharts() {
    if (this.activeTab === 'comptes') {
      if (this.comptes.courbes.parJour.length) {
        this.drawLineChart(
          'chartCompteJour',
          this.chartCompteJourRef,
          this.comptes.courbes.parJour.map((d) => d.date.slice(5)),
          [
            { label: 'Total', data: this.comptes.courbes.parJour.map((d) => d.total), color: '#0066FF' },
            { label: 'Approuvés', data: this.comptes.courbes.parJour.map((d) => d.approuves), color: '#00C48C' },
            { label: 'En attente', data: this.comptes.courbes.parJour.map((d) => d.enAttente), color: '#FF8C00' },
          ]
        );
      }
      if (this.comptes.courbes.parMois.length) {
        this.drawBarChart(
          'chartCompteMois',
          this.chartCompteMoisRef,
          this.comptes.courbes.parMois.map((d) => d.periode),
          [
            { label: 'Total', data: this.comptes.courbes.parMois.map((d) => d.total), color: '#0066FF' },
            { label: 'Approuvés', data: this.comptes.courbes.parMois.map((d) => d.approuves), color: '#00C48C' },
            { label: 'Rejetés', data: this.comptes.courbes.parMois.map((d) => d.rejetes), color: '#FF006E' },
          ]
        );
      }
    } else if (this.activeTab === 'devis') {
      if (this.devis.courbes.parJour.length) {
        this.drawAreaChart(
          'chartDevisJour',
          this.chartDevisJourRef,
          this.devis.courbes.parJour.map((d) => d.date.slice(5)),
          [
            { label: 'Total', data: this.devis.courbes.parJour.map((d) => d.total), color: '#0066FF' },
            { label: 'Envoyées', data: this.devis.courbes.parJour.map((d) => d.envoyees), color: '#00C48C' },
          ]
        );
      }
      if (this.devis.courbes.parMois.length) {
        this.drawBarChart(
          'chartDevisMontant',
          this.chartDevisMontantRef,
          this.devis.courbes.parMois.map((d) => d.periode),
          [{ label: 'Montant (TND)', data: this.devis.courbes.parMois.map((d) => d.montantMois), color: '#FF006E' }]
        );
      }
    } else {
      if (this.demo.courbes.parJour.length) {
        this.drawLineChart(
          'chartDemoJour',
          this.chartDemoJourRef,
          this.demo.courbes.parJour.map((d) => d.date.slice(5)),
          [
            { label: 'Nouvelles', data: this.demo.courbes.parJour.map((d) => d.nouvelles), color: '#0066FF' },
            { label: 'Contactées', data: this.demo.courbes.parJour.map((d) => d.contactees), color: '#9D00FF' },
            { label: 'Clôturées', data: this.demo.courbes.parJour.map((d) => d.cloturees), color: '#00C48C' },
          ]
        );
      }
      this.drawFunnelChart('chartDemoFunnel', this.chartDemoFunnelRef);
    }
  }

  // ── Helpers canvas ────────────────────────────────────────────────────────

  private getCtx(ref: ElementRef<HTMLCanvasElement> | undefined): CanvasRenderingContext2D | null {
    return ref?.nativeElement?.getContext('2d') || null;
  }

  // ── Line chart ────────────────────────────────────────────────────────────

  private drawLineChart(
    key: string,
    ref: ElementRef<HTMLCanvasElement> | undefined,
    labels: string[],
    series: { label: string; data: number[]; color: string }[]
  ) {
    const ctx = this.getCtx(ref);
    if (!ctx) return;
    const W = (ctx.canvas.width = ctx.canvas.offsetWidth);
    const H = (ctx.canvas.height = ctx.canvas.offsetHeight);
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const allVals = series.flatMap((s) => s.data);
    const maxV = Math.max(...allVals) * 1.15 || 1;

    // Grid
    ctx.strokeStyle = 'rgba(90,107,140,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + chartH - (i / 5) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = '#5A6B8C';
      ctx.font = '10px Sora, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round((i / 5) * maxV)), pad.left - 6, y + 4);
    }

    // X labels
    ctx.fillStyle = '#5A6B8C';
    ctx.font = '9px Sora, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((l, i) => {
      if (i % 5 === 0) {
        const x = pad.left + (i / (labels.length - 1)) * chartW;
        ctx.fillText(l, x, H - pad.bottom + 16);
      }
    });

    // Lines
    series.forEach(({ data, color }) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      data.forEach((v, i) => {
        const x = pad.left + (i / (data.length - 1)) * chartW;
        const y = pad.top + chartH - (v / maxV) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      [0, data.length - 1].forEach((i) => {
        const x = pad.left + (i / (data.length - 1)) * chartW;
        const y = pad.top + chartH - (data[i] / maxV) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    });

    // Legend
    let lx = pad.left;
    series.forEach(({ label, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(lx, 10, 16, 8);
      ctx.fillStyle = '#1A2B5F';
      ctx.font = '10px Sora, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, lx + 20, 18);
      lx += ctx.measureText(label).width + 40;
    });
  }

  // ── Area chart ────────────────────────────────────────────────────────────

  private drawAreaChart(
    key: string,
    ref: ElementRef<HTMLCanvasElement> | undefined,
    labels: string[],
    series: { label: string; data: number[]; color: string }[]
  ) {
    const ctx = this.getCtx(ref);
    if (!ctx) return;
    const W = (ctx.canvas.width = ctx.canvas.offsetWidth);
    const H = (ctx.canvas.height = ctx.canvas.offsetHeight);
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const allVals = series.flatMap((s) => s.data);
    const maxV = Math.max(...allVals) * 1.15 || 1;

    // Grid
    ctx.strokeStyle = 'rgba(90,107,140,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + chartH - (i / 5) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = '#5A6B8C';
      ctx.font = '10px Sora, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round((i / 5) * maxV)), pad.left - 6, y + 4);
    }

    labels.forEach((l, i) => {
      if (i % 5 === 0) {
        const x = pad.left + (i / (labels.length - 1)) * chartW;
        ctx.fillStyle = '#5A6B8C';
        ctx.font = '9px Sora, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(l, x, H - pad.bottom + 16);
      }
    });

    series.forEach(({ data, color }) => {
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
      grad.addColorStop(0, color + '33');
      grad.addColorStop(1, color + '00');

      ctx.beginPath();
      data.forEach((v, i) => {
        const x = pad.left + (i / (data.length - 1)) * chartW;
        const y = pad.top + chartH - (v / maxV) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.lineTo(pad.left + chartW, pad.top + chartH);
      ctx.lineTo(pad.left, pad.top + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      data.forEach((v, i) => {
        const x = pad.left + (i / (data.length - 1)) * chartW;
        const y = pad.top + chartH - (v / maxV) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    let lx = pad.left;
    series.forEach(({ label, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(lx, 10, 16, 8);
      ctx.fillStyle = '#1A2B5F';
      ctx.font = '10px Sora, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, lx + 20, 18);
      lx += ctx.measureText(label).width + 40;
    });
  }

  // ── Bar chart ─────────────────────────────────────────────────────────────

  private drawBarChart(
    key: string,
    ref: ElementRef<HTMLCanvasElement> | undefined,
    labels: string[],
    series: { label: string; data: number[]; color: string }[]
  ) {
    const ctx = this.getCtx(ref);
    if (!ctx) return;
    const W = (ctx.canvas.width = ctx.canvas.offsetWidth);
    const H = (ctx.canvas.height = ctx.canvas.offsetHeight);
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 30, right: 20, bottom: 50, left: 55 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const allVals = series.flatMap((s) => s.data);
    const maxV = Math.max(...allVals) * 1.15 || 1;

    for (let i = 0; i <= 5; i++) {
      const y = pad.top + chartH - (i / 5) * chartH;
      ctx.strokeStyle = 'rgba(90,107,140,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = '#5A6B8C';
      ctx.font = '10px Sora, sans-serif';
      ctx.textAlign = 'right';
      const val = Math.round((i / 5) * maxV);
      ctx.fillText(val > 999 ? (val / 1000).toFixed(1) + 'k' : String(val), pad.left - 6, y + 4);
    }

    const groupW = chartW / labels.length;
    const barW = (groupW - 8) / series.length;

    labels.forEach((label, gi) => {
      const gx = pad.left + gi * groupW + 4;

      ctx.fillStyle = '#5A6B8C';
      ctx.font = '10px Sora, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label.slice(-5), gx + (groupW - 8) / 2, H - pad.bottom + 16);

      series.forEach(({ data, color }, si) => {
        const v = data[gi];
        const bh = (v / maxV) * chartH;
        const bx = gx + si * barW;
        const by = pad.top + chartH - bh;

        const grad = ctx.createLinearGradient(0, by, 0, by + bh);
        grad.addColorStop(0, color);
        grad.addColorStop(1, color + '88');
        ctx.fillStyle = grad;
        const r = Math.min(4, barW / 2);
        ctx.beginPath();
        ctx.roundRect(bx + 1, by, barW - 2, bh, [r, r, 0, 0]);
        ctx.fill();
      });
    });

    let lx = pad.left;
    series.forEach(({ label, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(lx, 10, 16, 8);
      ctx.fillStyle = '#1A2B5F';
      ctx.font = '10px Sora, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, lx + 20, 18);
      lx += ctx.measureText(label).width + 40;
    });
  }

  // ── Funnel chart ──────────────────────────────────────────────────────────

  private drawFunnelChart(key: string, ref: ElementRef<HTMLCanvasElement> | undefined) {
    const ctx = this.getCtx(ref);
    if (!ctx) return;
    const W = (ctx.canvas.width = ctx.canvas.offsetWidth);
    const H = (ctx.canvas.height = ctx.canvas.offsetHeight);
    ctx.clearRect(0, 0, W, H);

    const stages = [
      {
        label: 'Nouvelles',
        value: this.demo.totaux.nouvelle + this.demo.totaux.contactee + this.demo.totaux.cloturee,
        color: '#0066FF',
      },
      { label: 'Contactées', value: this.demo.totaux.contactee + this.demo.totaux.cloturee, color: '#9D00FF' },
      { label: 'Clôturées', value: this.demo.totaux.cloturee, color: '#00C48C' },
    ];
    const maxV = stages[0].value || 1;
    const stageH = H / (stages.length + 1);

    stages.forEach((s, i) => {
      const ratio = s.value / maxV;
      const nextRatio = stages[i + 1] ? stages[i + 1].value / maxV : ratio * 0.4;
      const botW = (stages[i + 1] ? nextRatio : ratio * 0.5) * W * 0.8;
      const topW = ratio * W * 0.8;
      const cx = W / 2;
      const y1 = i * stageH + 10;
      const y2 = (i + 1) * stageH + 10;

      const grad = ctx.createLinearGradient(cx - topW / 2, y1, cx + topW / 2, y1);
      grad.addColorStop(0, s.color + '88');
      grad.addColorStop(0.5, s.color);
      grad.addColorStop(1, s.color + '88');

      ctx.beginPath();
      ctx.moveTo(cx - topW / 2, y1);
      ctx.lineTo(cx + topW / 2, y1);
      ctx.lineTo(cx + botW / 2, y2);
      ctx.lineTo(cx - botW / 2, y2);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Sora, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${s.label} — ${s.value}`, cx, (y1 + y2) / 2 + 5);
    });
  }

  // ── Donut gauge ───────────────────────────────────────────────────────────

  drawDonut(canvas: HTMLCanvasElement, value: number, color: string) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = (canvas.width = canvas.offsetWidth);
    const H = (canvas.height = canvas.offsetHeight);
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2,
      cy = H / 2,
      r = Math.min(W, H) / 2 - 8;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(90,107,140,0.12)';
    ctx.lineWidth = 10;
    ctx.stroke();

    const angle = (value / 100) * Math.PI * 2 - Math.PI / 2;
    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + 'AA');
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, angle);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#1A2B5F';
    ctx.font = `bold ${Math.round(r * 0.45)}px Sora, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${value}%`, cx, cy);
  }
}