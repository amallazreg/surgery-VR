import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { AdminService } from '../../services/admin-service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SideBar } from '../side-bar/side-bar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';


export interface IDemandeDemo  {
  _id: string;
  typeEtablissement: string;
  pays: string;
  ville: string;
  domaineInteret: string;
  objectifs: string[];
  nomInstitution: string;
  emailProfessionnel: string;
  telephone: string;
  message?: string;
  consentement: boolean;
  statut: 'nouvelle' | 'contactee' | 'cloturee';
  dateCreation: Date;
  
  dateContact?: Date;
  dateCloture?: Date;
  videosEnvoyees?: Array<{
    id: string;
    titre: string;
    urlVideo: string;
    dateEnvoi: Date;
  }>;
  historiqueEmails?: Array<{
    dateEnvoi: Date;
    messageId: string;
    nbVideos: number;
    statut: 'envoye' | 'erreur';
  }>;
  
  // Pour l'UI
  selected?: boolean;
}

export interface Stats {
  totalNouvelle: number;
  totalContactee: number;
  totalCloturee: number;
  totalDemandes: number;
}

export type FilterType = 'tous' | 'nouvelle' | 'contactee' | 'cloturee';


@Component({
  selector: 'app-demande-demo',
  standalone: true,
  imports: [SideBar, CommonModule, FormsModule], 
  templateUrl: './demande-demo.html',
  styleUrl: './demande-demo.css',
})
export class DemandeDemo implements OnInit, OnDestroy {

  allDemandes: IDemandeDemo[] = [];
  filteredDemandes: IDemandeDemo[] = [];
  paginatedDemandes: IDemandeDemo[] = [];

  selectedDemande: IDemandeDemo | null = null;

  
  stats: Stats = {
    totalNouvelle: 0,
    totalContactee: 0,
    totalCloturee: 0,
    totalDemandes: 0
  };
  

  currentFilter: FilterType = 'tous';
  searchQuery: string = '';
  

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  
  isLoading: boolean = false;
  showEmptyState: boolean = false;
  isSendingEmail: boolean = false; // ✨ Nouveau
  

  showDetailsModal: boolean = false;
  showContactModal: boolean = false;
  showCloseModal: boolean = false;
  emailMessage: string = '';
  

  selectedDemandeIds: Set<string> = new Set();
  selectAll: boolean = false;
  
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private autoRefreshInterval: any;
  private autoRefreshMinutes: number = 0;

  
  constructor(
    private adminService: AdminService,
    @Inject(PLATFORM_ID) private platformId: Object,
        private cdr: ChangeDetectorRef  

  ) {}

 
  ngOnInit(): void {
    console.log('=== DemandesDemo ngOnInit ===');
    this.loadDemandes();
    this.setupSearchDebounce();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearAutoRefresh();
  }


  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery = query;
        this.currentPage = 1;
        this.applyFilters();
      });
  }

  private setupAutoRefresh(): void {
    if (this.autoRefreshMinutes > 0) {
      console.log(`Auto-refresh activé: toutes les ${this.autoRefreshMinutes} minutes`);
      this.autoRefreshInterval = setInterval(() => {
        console.log('Rechargement automatique des données...');
        this.loadDemandes();
      }, this.autoRefreshMinutes * 60 * 1000);
    }
  }

  private clearAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  
  toggleSelectAll(): void {
    this.paginatedDemandes.forEach(demande => demande.selected = this.selectAll);
    this.updateSelectedDemandeIds();
  }

  toggleDemandeSelection(demande: IDemandeDemo): void {
    this.updateSelectedDemandeIds();
    this.updateSelectAllState();
  }

  private updateSelectedDemandeIds(): void {
    this.selectedDemandeIds = new Set(
      this.allDemandes.filter(d => d.selected).map(d => d._id)
    );
  }

  private updateSelectAllState(): void {
    this.selectAll = this.paginatedDemandes.length > 0 && 
                     this.paginatedDemandes.every(d => d.selected);
  }

  isDemandeSelected(demandeId: string): boolean {
    return this.selectedDemandeIds.has(demandeId);
  }


  loadDemandes(): void {
    this.isLoading = true;
    
    this.adminService.tousDemandeDemo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (demandes: IDemandeDemo[]) => {
          this.allDemandes = demandes.map(demande => ({ 
            ...demande, 
            selected: false 
          }));

          console.log('Demandes rechargées - Exemple première demande contactée :', 
            this.allDemandes.find(d => d.statut === 'contactee'));

          this.currentPage = 1;
          this.applyFilters();
          this.updateStats();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erreur chargement demandes:', error);
          this.isLoading = false;
          this.allDemandes = [];
          this.filteredDemandes = [];
          this.paginatedDemandes = [];
          this.showToast('Erreur lors du chargement des demandes', 'error');
        }
      });
  }


  setActiveFilter(filter: FilterType): void {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchInput(query: string): void {
    this.searchSubject.next(query);
  }

  applyFilters(): void {
    let filtered = [...this.allDemandes];

    // Filtre par statut
    if (this.currentFilter !== 'tous') {
      filtered = filtered.filter(demande => demande.statut === this.currentFilter);
    }

    // Recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(demande => {
        const institution = demande.nomInstitution.toLowerCase();
        const email = demande.emailProfessionnel.toLowerCase();
        const telephone = demande.telephone.toLowerCase();
        const ville = demande.ville.toLowerCase();
        const pays = demande.pays.toLowerCase();
        
        return institution.includes(query) || 
               email.includes(query) || 
               telephone.includes(query) ||
               ville.includes(query) ||
               pays.includes(query);
      });
    }

    this.filteredDemandes = filtered;
    this.updatePagination();
    this.showEmptyState = filtered.length === 0 && !this.isLoading;
  }


  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredDemandes.length / this.itemsPerPage);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedDemandes = this.filteredDemandes.slice(startIndex, endIndex);
    
    this.updateSelectAllState();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.canGoPrevious) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.canGoNext) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  get canGoPrevious(): boolean {
    return this.currentPage > 1;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.totalPages;
  }


  updateStats(): void {
    this.stats = {
      totalNouvelle: this.allDemandes.filter(d => d.statut === 'nouvelle').length,
      totalContactee: this.allDemandes.filter(d => d.statut === 'contactee').length,
      totalCloturee: this.allDemandes.filter(d => d.statut === 'cloturee').length,
      totalDemandes: this.allDemandes.length
    };
  }

  get badgeCounts() {
    return {
      tous: this.allDemandes.length,
      nouvelle: this.stats.totalNouvelle,
      contactee: this.stats.totalContactee,
      cloturee: this.stats.totalCloturee
    };
  }

 
  viewDemandeDetails(demande: IDemandeDemo): void {
    this.selectedDemande = demande;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    setTimeout(() => {
      this.selectedDemande = null;
    }, 300);
  }

  openContactModal(demande: IDemandeDemo): void {
    this.selectedDemande = demande;
    this.emailMessage = this.genererMessageParDefaut(demande);
    this.showContactModal = true;
  }

  // Nouvelle méthode helper
  genererMessageParDefaut(demande: IDemandeDemo): string {
    return `,

Merci pour votre intérêt pour nos solutions de formation médicale en réalité virtuelle.

Nous avons sélectionné pour vous 5 vidéos de démonstration en lien avec ${demande.domaineInteret.toLowerCase()} qui vous permettront de découvrir notre plateforme.

Ces courtes démonstrations (10 secondes chacune) vous donneront un aperçu de :
• La qualité de nos simulations immersives
• L'intuitivité de notre interface
• La diversité de nos modules de formation

Si vous souhaitez plus de détails, vous devez avoir un compte.

Nous restons à votre disposition.

Cordialement,
L'équipe SurveryVR

---
📧 ${demande.emailProfessionnel}
📱 ${demande.telephone}
`;
  }

  closeContactModal(): void {
    this.showContactModal = false;
    setTimeout(() => {
      this.selectedDemande = null;
      this.emailMessage = '';
    }, 300);
  }


  openCloseModal(demande: IDemandeDemo): void {
    this.selectedDemande = demande;
    this.showCloseModal = true;
  }

  closeCloseModal(): void {
    this.showCloseModal = false;
    setTimeout(() => {
      this.selectedDemande = null;
    }, 300);
  }

 
contactDemande(): void {
  if (!this.emailMessage || this.emailMessage.trim().length < 50) {
    this.showToast('⚠️ Le message doit contenir au moins 50 caractères', 'error');
    return;
  }
  if (this.emailMessage.length > 2000) {
    this.showToast('⚠️ Le message ne doit pas dépasser 2000 caractères', 'error');
    return;
  }
  if (!this.selectedDemande) return;

  const payload = { messageEmail: this.emailMessage };
  const demandeId = this.selectedDemande._id;
  const institution = this.selectedDemande.nomInstitution;

  this.isSendingEmail = true;
  this.showToast('📧 Envoi de l\'email en cours...', 'warning');

  this.adminService.contacterDemo(payload, demandeId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: any) => {
        this.isSendingEmail = false;
        this.closeContactModal();

        // Mise à jour optimiste + réelle
        if (this.selectedDemande && response.demande) {
          this.selectedDemande.statut = 'contactee';
          this.selectedDemande.dateContact = response.demande.dateContact || new Date();
          this.selectedDemande.videosEnvoyees = response.demande.videosEnvoyees || [];

          // Mise à jour dans la liste principale
          const index = this.allDemandes.findIndex(d => d._id === this.selectedDemande!._id);
          if (index !== -1) {
            this.allDemandes[index] = { 
              ...this.allDemandes[index], 
              ...this.selectedDemande 
            };
          }
        }

        this.applyFilters();
        this.updateStats();

        const nbVideos = response.nbVideosEnvoyees || 5;
        this.showToast(`✅ Email envoyé avec succès à ${institution} ! (${nbVideos} vidéos)`, 'success');

        // Recharge légère pour synchronisation
        setTimeout(() => this.loadDemandes(), 800);
      },
      error: (error) => {
        this.isSendingEmail = false;
        const errorMsg = error.error?.message || 'Erreur lors de l\'envoi de l\'email';
        this.showToast(`❌ ${errorMsg}`, 'error');
      }
    });
}
  contactFromModal(demande: IDemandeDemo): void {
    this.closeDetailsModal();
    setTimeout(() => {
      this.openContactModal(demande);
    }, 300);
  }

 closeDemande(demande: any): void {

  const demandeId = demande._id;
  const institution = demande.nomInstitution;

  if (isPlatformBrowser(this.platformId)) {
    const confirmer = confirm(
      `Voulez-vous vraiment clôturer la demande de ${institution} ?\n\nCette action indique que le visiteur s'est authentifié et a souscrit à un forfait.`
    );

    if (!confirmer) return;
  }

  this.adminService.cloturerDemande(demandeId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        console.log('✅ Demande clôturée avec succès');

        demande.statut = 'cloturee'; // ✅ mise à jour directe

        if (isPlatformBrowser(this.platformId)) {
          alert(`✅ Demande clôturée avec succès!\n\n${institution} est maintenant "Clôturée".`);
        }

        this.loadDemandes();
      },
      error: (error) => {
        console.error('❌ Erreur clôture:', error);

        if (isPlatformBrowser(this.platformId)) {
          alert(error.error?.message || 'Erreur lors de la clôture');
        }
      }
    });
}

confirmClose(demande: any): void {
  Swal.fire({
    title: 'Êtes-vous sûr ?',
    html: `Voulez-vous vraiment clôturer la demande de <b>${demande.nomInstitution}</b> ?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '✅ Oui, clôturer',
    cancelButtonText: '❌ Annuler',
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: 'swal2-popup-modern',
      confirmButton: 'swal2-confirm-modern',
      cancelButton: 'swal2-cancel-modern'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // Appel backend pour clôturer
      this.adminService.cloturerDemande(demande._id).subscribe({
        next: () => {
          demande.statut = 'cloturee';
          Swal.fire({
            icon: 'success',
            title: 'Clôturée !',
            html: `La demande de <b>${demande.nomInstitution}</b> est maintenant clôturée.`,
            timer: 2500,
            showConfirmButton: false
          });
          this.loadDemandes(); // recharge si nécessaire
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: err.error?.message || 'Erreur lors de la clôture'
          });
        }
      });
    }
  });
}

  closeFromModal(demande: IDemandeDemo): void {
    this.closeDetailsModal();
    setTimeout(() => {
      this.openCloseModal(demande);
    }, 300);
  }

  private updateDemandeInList(updatedDemande: IDemandeDemo): void {
    const index = this.allDemandes.findIndex(d => d._id === updatedDemande._id);
    if (index !== -1) {
      this.allDemandes[index] = { ...updatedDemande, selected: this.allDemandes[index].selected };
      this.applyFilters();
      this.updateStats();
    }
  }


exportToPDF(): void {
  if (!isPlatformBrowser(this.platformId)) {
    return;
  }

  const doc = new jsPDF('landscape');

  // 📌 Logo (à gauche)
  const logo = new Image();
  logo.src = 'assets/logo.png';

  logo.onload = () => {

    doc.addImage(logo, 'PNG', 12, 10, 32, 15);

    // 📌 Header (Nom projet)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Surgery VR', 50, 15);

   

    // 📌 Ligne séparation
    doc.setLineWidth(0.5);
    doc.line(10, 28, 280, 28);

    // 📌 Titre
    doc.setFontSize(14);
    doc.text('Liste des demandes', 14, 35);

    // 📌 Données
    const headers = [[
      'Institution',
      'Email',
      'Téléphone',
      'Type',
      'Pays',
      'Ville',
      'Domaine',
      'Statut',
      'Date'
    ]];

    const rows = this.filteredDemandes.map(d => [
      d.nomInstitution || '',
      d.emailProfessionnel || '',
      d.telephone || '',
      d.typeEtablissement || '',
      d.pays || '',
      d.ville || '',
      d.domaineInteret || '',
      this.getStatusLabel(d.statut),
      this.formatDateTime(d.dateCreation)
    ]);

    // 📌 Tableau
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: 255,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      didDrawPage: (data) => {

        // 📌 Footer
        const pageSize = doc.internal.pageSize.height;
        doc.setFontSize(9);

        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber}`,
          data.settings.margin.left,
          pageSize - 10
        );

        // 📌 Signature
        doc.text(
          'Signature / Cachet',
          240,
          pageSize - 10
        );
      }
    });

    // 📌 Télécharger
    doc.save(`demandes_demos_${new Date().toISOString().split('T')[0]}.pdf`);

    this.showToast('Export PDF professionnel réussi !', 'success');
  };
}
  // ========================================
  // Notifications Toast
  // ========================================
  private showToast(
    message: string, 
    type: 'success' | 'error' | 'warning' = 'success'
  ): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.4s ease';
      setTimeout(() => {
        container.removeChild(toast);
      }, 400);
    }, 3000);
  }

  // ========================================
  // Helpers / Utilitaires
  // ========================================
  getInitials(nomInstitution: string): string {
    const words = nomInstitution.split(' ');
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return nomInstitution.substring(0, 2).toUpperCase();
  }

  getStatusLabel(statut: IDemandeDemo['statut']): string {
    const labels: Record<IDemandeDemo['statut'], string> = {
      'nouvelle': 'Nouvelle',
      'contactee': 'Contactée',
      'cloturee': 'Clôturée'
    };
    return labels[statut];
  }

  getStatusIcon(statut: IDemandeDemo['statut']): string {
    const icons: Record<IDemandeDemo['statut'], string> = {
      'nouvelle': '🆕',
      'contactee': '📧',
      'cloturee': '✅'
    };
    return icons[statut];
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getObjectifsDisplay(objectifs: string[]): string {
    if (!objectifs || objectifs.length === 0) return 'Aucun';
    return objectifs.join(', ');
  }

  trackByDemandeId(index: number, demande: IDemandeDemo): string {
    return demande._id;
  }

  // Ajoute ces méthodes dans la classe DemandeDemo

getDownloadUrl(video: any): string {
  if (!video || !video.urlVideo) return '#';

  // Force le téléchargement + nom personnalisé avec Cloudinary
  const baseUrl = video.urlVideo.split('?')[0]; // enlève les paramètres existants
  const safeName = this.getSafeFilename(video.titre || 'video');

  return `${baseUrl}?fl_attachment:${safeName}.mp4`;
}

getSafeFilename(titre: string): string {
  if (!titre) return 'demo-video';
  
  return titre
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')   // remplace les caractères spéciaux par -
    .replace(/-+/g, '-')          // évite les ----- 
    .replace(/^-|-$/g, '')        // enlève - au début/fin
    || 'demo-video';
}
}