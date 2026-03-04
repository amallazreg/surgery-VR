import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-bar-etudiant',
  standalone : true,
  imports: [RouterModule],
  templateUrl: './side-bar-etudiant.html',
  styleUrl: './side-bar-etudiant.css',
})
export class SideBarEtudiant implements OnInit {

   userName: string = '';
 specialite : string = ''
  userInitials: string = '';
  niveauEtude: string = '';

constructor(private router: Router) {}

ngOnInit(): void {
  const userId = localStorage.getItem('userId');
  const nom = localStorage.getItem('nom') || '';
  const prenom = localStorage.getItem('prenom') || '';
  const specialite = localStorage.getItem('specialite') || '';

  if (!userId) {
    this.router.navigate(['/signin']);
    return;
  }

  this.userName = `${prenom} ${nom}`.trim() || specialite || 'Utilisateur';
  this.specialite = specialite
  const parts = this.userName.split(' ').filter(p => p.length > 0);
  this.userInitials = parts.map((p: string) => p[0].toUpperCase()).slice(0, 2).join('');
}


  logout(): void {
    // Supprimer le token / session
    localStorage.removeItem('token');
    this.router.navigate(['/signin']);
  }
}
