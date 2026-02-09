import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SideBar } from "../side-bar/side-bar";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SideBar],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit, AfterViewInit {

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // ❌ NE PAS mettre IntersectionObserver ici
  }

  ngAfterViewInit(): void {
    // ✅ Seulement dans le navigateur
    if (isPlatformBrowser(this.platformId)) {
      this.initAnimations();
    }
  }

  initAnimations(): void {

    // Sécurité supplémentaire
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('IntersectionObserver non disponible dans cet environnement');
      return;
    }

    const observerOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Attendre que le DOM soit bien rendu
    setTimeout(() => {
      document.querySelectorAll('.stat-card, .section-card').forEach(el => {
        observer.observe(el);
      });
    }, 100);
  }
}
