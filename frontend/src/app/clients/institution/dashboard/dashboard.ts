import { Component } from '@angular/core';
import { SideBar } from "../side-bar/side-bar";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface Invoice {
  date: string;
  description: string;
  amount: number;
  status: string;
  id: string;
}
interface FormationDetails {
  dureeHeures: number;
  maxEtudiants: number;
  detaillee: boolean;
  activee: boolean;
  codes: any[];   // tu peux typer plus précisément si besoin
}
interface AbonnementResponse {
  forfait: string;
  abonnementId: string;
  apkTotal: number;
  apkRestants: number;
  dateFin?: string;
  formation: FormationDetails | null;
  simulationEsthetique: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone : true,
  imports: [SideBar,CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {


   userName: string = '';
 userEmail : string = ''
  userInitials: string = '';
  userPlan: string = '';
abonnement: AbonnementResponse | null = null;
  loading = true;
  error: string | null = null;
  constructor(private router: Router,private http: HttpClient) {}

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
  this.userEmail = email
  const parts = this.userName.split(' ').filter(p => p.length > 0);
  this.userInitials = parts.map((p: string) => p[0].toUpperCase()).slice(0, 2).join('');

  this.chargerAbonnement();
}

private chargerAbonnement(): void {
  const userId = localStorage.getItem('userId');

  if (!userId) {
    this.error = "Utilisateur non connecté";
    this.loading = false;
    return;
  }

  const url = `/client/abonnements/droits/${userId}`;   

  this.http.get<AbonnementResponse>(url, { 
    responseType: 'json'   
  })
  .subscribe({
    next: (data) => {
      console.log('✅ Réponse réussie :', data);
      this.abonnement = data;
      this.loading = false;
    },
    error: (err: any) => {
      this.loading = false;
      console.error('❌ Erreur HttpClient :', err);

      // Debug très utile :
      console.log('Status:', err.status);
      console.log('ok:', err.ok);
      console.log('Body brut (error.error):', err.error);

      if (err.status === 200) {
        this.error = "Le serveur a répondu 200 mais le contenu n'est pas du JSON valide.";
      } else if (err.status === 404) {
        this.error = "Aucun abonnement actif trouvé";
      } else {
        this.error = "Erreur lors du chargement de l'abonnement";
      }
    }
  });
}

  getFormationStatus(): string {
  if (!this.abonnement?.formation) {
    return '';
  }

  const formation = this.abonnement.formation;

  if (formation.activee) {
    const nbCodes = formation.codes?.length || 0;
    return nbCodes + ' codes générés';
  } else {
    return 'Activée mais non utilisée';
  }
}


  invoices: Invoice[] = [
    { id: 'INV-026', date: '28 Fév 2026', description: 'Forfait Pro — Mars 2026',    amount: 89, status: 'Payée' },
    { id: 'INV-025', date: '28 Jan 2026', description: 'Forfait Pro — Fév 2026',     amount: 89, status: 'Payée' },
    { id: 'INV-024', date: '28 Déc 2025', description: 'Forfait Pro — Jan 2026',     amount: 89, status: 'Payée' },
    { id: 'INV-023', date: '28 Nov 2025', description: 'Forfait Starter — Déc 2025', amount: 49, status: 'Payée' },
    { id: 'INV-022', date: '28 Oct 2025', description: 'Forfait Starter — Nov 2025', amount: 49, status: 'Payée' }
  ];
}
