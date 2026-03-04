import { Component, OnInit } from '@angular/core';
import { SideBarEtudiant } from "../side-bar-etudiant/side-bar-etudiant";

@Component({
  selector: 'app-dashboard-etudiant',
  imports: [SideBarEtudiant],
  templateUrl: './dashboard-etudiant.html',
  styleUrl: './dashboard-etudiant.css',
})
export class DashboardEtudiant implements OnInit {

     userName: string = '';

     ngOnInit(): void {
  const userId = localStorage.getItem('userId');
  const nom = localStorage.getItem('nom') || '';
  const prenom = localStorage.getItem('prenom') || '';
  const specialite = localStorage.getItem('specialite') || '';

 

  this.userName = `${prenom} ${nom}`.trim() || specialite || 'Utilisateur';
  const parts = this.userName.split(' ').filter(p => p.length > 0);
}


}
