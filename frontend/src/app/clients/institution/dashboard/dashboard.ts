import { Component } from '@angular/core';
import { SideBar } from "../side-bar/side-bar";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface Invoice {
  date: string;
  description: string;
  amount: number;
  status: string;
  id: string;
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

  constructor(private router: Router) {}

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
}
  invoices: Invoice[] = [
    { id: 'INV-026', date: '28 Fév 2026', description: 'Forfait Pro — Mars 2026',    amount: 89, status: 'Payée' },
    { id: 'INV-025', date: '28 Jan 2026', description: 'Forfait Pro — Fév 2026',     amount: 89, status: 'Payée' },
    { id: 'INV-024', date: '28 Déc 2025', description: 'Forfait Pro — Jan 2026',     amount: 89, status: 'Payée' },
    { id: 'INV-023', date: '28 Nov 2025', description: 'Forfait Starter — Déc 2025', amount: 49, status: 'Payée' },
    { id: 'INV-022', date: '28 Oct 2025', description: 'Forfait Starter — Nov 2025', amount: 49, status: 'Payée' }
  ];
}
