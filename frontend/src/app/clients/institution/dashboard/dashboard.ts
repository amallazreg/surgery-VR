import { Component, ChangeDetectorRef } from '@angular/core';
import { SideBar } from "../side-bar/side-bar";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { timeout } from 'rxjs/operators';
import { TimeoutError } from 'rxjs';
import { AbonnementService, AbonnementResponse, FormationDetails } from '../../../services/abonnement-service';

export interface Invoice {
  date: string;
  description: string;
  amount: number;
  status: string;
  id: string;
}


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SideBar, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  userName: string = '';
  userEmail: string = '';
  userInitials: string = '';
  userPlan: string = '';
  abonnement: AbonnementResponse | null = null;
  loading = true;
  error: string | null = null;
  historique: any[]      = [];
  factures: any[]        = [];

  constructor(
    private router: Router,
    private abonnementService: AbonnementService,
    private cdr: ChangeDetectorRef   // ← AJOUTÉ
  ) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    const nom = localStorage.getItem('nom') || '';
    const prenom = localStorage.getItem('prenom') || '';
    const email = localStorage.getItem('email') || '';

    if (!userId) {
      this.router.navigate(['/signin']);
      return;
    }

    this.userName = `${prenom} ${nom}`.trim() || email || 'Utilisateur';
    this.userEmail = email;
    const parts = this.userName.split(' ').filter(p => p.length > 0);
    this.userInitials = parts.map((p: string) => p[0].toUpperCase()).slice(0, 2).join('');

    this.chargerAbonnement(userId);
    this.chargerHistorique(userId);  // ← AJOUTÉ
  this.chargerFactures(userId); 
  }

    formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  private chargerHistorique(userId: string): void {
  this.abonnementService.getHistoriqueAbonnements(userId).subscribe({
    next: (data) => {
      this.historique = data;
      this.cdr.detectChanges();
    },
    error: (err) => console.error('❌ Historique:', err)
  });
}

private chargerFactures(userId: string): void {
  this.abonnementService.getMesFactures(userId).subscribe({
    next: (data) => {
      this.factures = data;
      this.cdr.detectChanges();
    },
    error: (err) => console.error('❌ Factures:', err)
  });
}


  private chargerAbonnement(userId: string): void {
    this.abonnementService.getMesDroits(userId).pipe(
      timeout(60000)
    ).subscribe({
      next: (data) => {
        console.log('✅ Data reçue:', data);
        this.abonnement = data;
        this.loading = false;
        this.cdr.detectChanges();   // ← FORCE la mise à jour du template
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.loading = false;
        if (err instanceof TimeoutError) {
          this.error = 'Le serveur met trop de temps à répondre. Réessayez.';
        } else if (err.status === 404) {
          this.error = 'Aucun abonnement actif trouvé';
        } else if (err.status === 0) {
          this.error = 'Impossible de contacter le serveur (CORS ou réseau)';
        } else {
          this.error = `Erreur ${err.status} : ${err.message}`;
        }
        this.cdr.detectChanges();   // ← aussi pour l'erreur
      }
    });
  }

  getFormationStatus(): string {
    if (!this.abonnement?.formation) return '';
    const f = this.abonnement.formation;
    return f.activee
      ? `${f.codes?.length ?? 0} codes générés`
      : 'Activée mais non utilisée';
  }

  invoices: Invoice[] = [
    { id: 'INV-026', date: '28 Fév 2026', description: 'Forfait Pro — Mars 2026',    amount: 89, status: 'Payée' },
    { id: 'INV-025', date: '28 Jan 2026', description: 'Forfait Pro — Fév 2026',     amount: 89, status: 'Payée' },
    { id: 'INV-024', date: '28 Déc 2025', description: 'Forfait Pro — Jan 2026',     amount: 89, status: 'Payée' },
    { id: 'INV-023', date: '28 Nov 2025', description: 'Forfait Starter — Déc 2025', amount: 49, status: 'Payée' },
    { id: 'INV-022', date: '28 Oct 2025', description: 'Forfait Starter — Nov 2025', amount: 49, status: 'Payée' }
  ];
}