import { Component } from '@angular/core';
import { SideBar } from "../side-bar/side-bar";
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [SideBar],
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

}
