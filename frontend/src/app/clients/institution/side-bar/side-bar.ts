import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  standalone : true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.css',
})
export class SideBar {

constructor(private router: Router) {}

logout() {
  localStorage.clear(); 
  this.router.navigate(['/signin']);
}
}