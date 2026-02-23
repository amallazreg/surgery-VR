import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './side-bar.html',
  styleUrls: ['./side-bar.css'], // fix typo : styleUrl -> styleUrls
})
export class SideBar implements OnInit {
  isSidebarOpen: boolean = true;

constructor(private router: Router) {}

logout() {
  localStorage.clear(); 
  this.router.navigate(['/signin']);
}
  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    if (typeof window !== 'undefined') { // ✅ Vérifie si window existe
      const isMobile = window.innerWidth <= 768;
      this.isSidebarOpen = !isMobile;
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;

    if (typeof document !== 'undefined') { // ✅ Vérifie si document existe
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        if (this.isSidebarOpen) {
          sidebar.classList.add('active');
        } else {
          sidebar.classList.remove('active');
        }
      }
    }
  }
}
