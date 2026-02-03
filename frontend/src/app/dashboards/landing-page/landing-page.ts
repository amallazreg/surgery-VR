import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage implements AfterViewInit {

  isScrolled = false;
  isBrowser = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // =========================
  // Scroll (only in browser)
  // =========================
  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.isBrowser) return;

    this.isScrolled = window.scrollY > 50;
    this.applyParallax();
  }

  // =========================
  // After view init
  // =========================
  ngAfterViewInit() {
    if (!this.isBrowser) return;

    this.initFadeInObserver();
  }

  // =========================
  // Fade-in observer (SAFE)
  // =========================
  initFadeInObserver() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported');
      return;
    }

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el);
    });
  }

  // =========================
  // Play video
  // =========================
  onPlayVideo() {
    if (!this.isBrowser) return;
    alert('La vidéo de démonstration sera bientôt disponible!');
  }

  // =========================
  // Parallax
  // =========================
  applyParallax() {
    if (!this.isBrowser) return;

    const shapes = document.querySelectorAll('.shape');
    const scrolled = window.pageYOffset;

    shapes.forEach((shape: any, index: number) => {
      const speed = 0.5 + (index * 0.1);
      shape.style.transform = `translateY(${scrolled * speed}px)`;
    });
  }
}
