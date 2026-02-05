import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, AfterViewInit, Inject, PLATFORM_ID, ElementRef, ViewChild } from '@angular/core';
import { Navbar } from "../../layout/navbar/navbar";
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, Navbar, ButtonModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage implements AfterViewInit {
  @ViewChild('reviewsTrack', { static: false }) reviewsTrack!: ElementRef;

  isScrolled = false;
  isBrowser = false;
  currentReviewIndex = 0;
  totalReviewSlides = 3;

  // Tous les avis regroupés par slides
  reviewSlides = [
    // Slide 1
    [
      {
        stars: 5,
        text: "Une révolution dans la formation chirurgicale. Mes résidents peuvent maintenant pratiquer des procédures complexes en toute sécurité avant d'entrer en salle d'opération.",
        name: "Dr. Pierre Martin",
        title: "Chef de Service Chirurgie, CHU Lyon",
        avatar: "👨‍⚕️"
      },
      {
        stars: 5,
        text: "L'immersion est incroyable. Les scénarios d'urgence nous préparent vraiment aux situations de stress que nous rencontrons quotidiennement aux urgences.",
        name: "Dr. Sarah Dubois",
        title: "Urgentiste, Hôpital Bichat",
        avatar: "👩‍⚕️"
      },
      {
        stars: 5,
        text: "Un outil pédagogique exceptionnel. Nos étudiants gagnent en confiance et en compétence deux fois plus rapidement qu'avec les méthodes traditionnelles.",
        name: "Pr. Michel Renard",
        title: "Doyen, Faculté de Médecine Paris",
        avatar: "👨‍🏫"
      },
      {
        stars: 5,
        text: "La qualité graphique et le réalisme des simulations sont bluffants. C'est comme être dans une vraie salle d'opération sans le stress du patient réel.",
        name: "Dr. Laurent Dubois",
        title: "Chirurgien Orthopédiste, Marseille",
        avatar: "👨‍⚕️"
      }
    ],
    // Slide 2
    [
      {
        stars: 5,
        text: "Excellent pour la formation continue. Je peux m'entraîner à de nouvelles techniques depuis mon domicile. Le retour sur investissement est impressionnant.",
        name: "Dr. Claire Moreau",
        title: "Cardiologue, Toulouse",
        avatar: "👩‍⚕️"
      },
      {
        stars: 5,
        text: "Les scénarios de complications sont particulièrement utiles. On peut enfin pratiquer des situations rares sans attendre qu'elles se présentent en vrai.",
        name: "Dr. Antoine Bernard",
        title: "Anesthésiste-Réanimateur, Bordeaux",
        avatar: "👨‍⚕️"
      },
      {
        stars: 5,
        text: "Mes internes adorent ! La gamification rend l'apprentissage ludique tout en restant rigoureux. Les statistiques de progression sont très motivantes.",
        name: "Pr. Sophie Laurent",
        title: "Chef de Clinique, CHU Strasbourg",
        avatar: "👩‍🏫"
      },
      {
        stars: 5,
        text: "Support technique au top et mises à jour régulières. L'équipe est très à l'écoute de nos besoins spécifiques en pédiatrie.",
        name: "Dr. Marc Petit",
        title: "Pédiatre, Nantes",
        avatar: "👨‍⚕️"
      }
    ],
    // Slide 3
    [
      {
        stars: 5,
        text: "Parfait pour maintenir mes compétences à jour. Les modules de formation continue sont régulièrement enrichis avec les dernières techniques.",
        name: "Dr. Émilie Rousseau",
        title: "Gynécologue-Obstétricienne, Lille",
        avatar: "👩‍⚕️"
      },
      {
        stars: 5,
        text: "La courbe d'apprentissage de mes équipes s'est considérablement améliorée. Nous avons réduit les erreurs de 40% depuis l'adoption de la plateforme.",
        name: "Jean Dupont",
        title: "Directeur Formation, Clinique Privée Nice",
        avatar: "👨‍💼"
      },
      {
        stars: 5,
        text: "Interface intuitive et ergonomique. Même les moins technophiles de l'équipe s'y sont mis facilement. Un vrai plus pour notre service.",
        name: "Dr. Marie Lefevre",
        title: "Radiologue, Rennes",
        avatar: "👩‍⚕️"
      },
      {
        stars: 5,
        text: "Investissement rentabilisé en moins d'un an. La réduction des coûts de formation traditionnelle est significative tout en améliorant la qualité.",
        name: "Philippe Martin",
        title: "DRH, Groupe Hospitalier Montpellier",
        avatar: "👨‍💼"
      }
    ]
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.isBrowser) return;
    this.isScrolled = window.scrollY > 50;
    this.applyParallax();
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    this.initFadeInObserver();
  }

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

  onPlayVideo() {
    if (!this.isBrowser) return;
    alert('La vidéo de démonstration sera bientôt disponible!');
  }

  applyParallax() {
    if (!this.isBrowser) return;

    const shapes = document.querySelectorAll('.shape');
    const scrolled = window.pageYOffset;

    shapes.forEach((shape: any, index: number) => {
      const speed = 0.5 + (index * 0.1);
      shape.style.transform = `translateY(${scrolled * speed}px)`;
    });
  }

  // Méthodes du carrousel
  nextReviews() {
    console.log('Next clicked, current:', this.currentReviewIndex);
    this.currentReviewIndex = (this.currentReviewIndex + 1) % this.totalReviewSlides;
    console.log('New index:', this.currentReviewIndex);
  }

  previousReviews() {
    console.log('Previous clicked, current:', this.currentReviewIndex);
    this.currentReviewIndex = this.currentReviewIndex === 0
      ? this.totalReviewSlides - 1
      : this.currentReviewIndex - 1;
    console.log('New index:', this.currentReviewIndex);
  }

  goToReview(index: number) {
    console.log('Going to index:', index);
    this.currentReviewIndex = index;
  }

  getStars(count: number): string {
    return '⭐'.repeat(count);
  }

  goToDemo() {
    console.log('click OK');

    this.router.navigate(['/demanderDemo']);
  }

  goToDevis(){
    this.router.navigate(['/demanderDevis'])
  }

  goToExperience() {
    this.router.navigate(['/demanderExperience'])
  }


}