import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { AdminService } from '../../services/admin-service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SideBar } from '../side-bar/side-bar';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

export interface IDemandeDevis {
  _id: string;
  // Établissement
  nomEtablissement: string;
  typeEtablissement: string;
  pays: string;
  ville: string;
  
  // Besoins
  besoins: string[];
  
  // Dimensionnement
  nombreUtilisateurs: string;
  nombreCasquesVR: string;
  typeDeploiement: string;
  delaiMiseEnOeuvre: string;
  
  // Contact
  prenom: string;
  nom: string;
  fonction: string;
  emailProfessionnel: string;
  telephone: string;
  
  // Finalisation
  budgetEstime?: string;
  message?: string;
  consentement: boolean;
  
  // Statut
  statut: 'nouvelle' | 'en_cours' | 'envoyee';
  
// Devis calculé
  devisCalcule?: {
    coutLicences: number;
    coutCasquesVR: number;
    coutDeploiement: number;
    coutFormation: number;
    coutSupport: number;
    sousTotal: number;
    remisePourcentage: number;
    montantRemise: number;
    totalHT: number;
    tauxTVA: number;
    montantTVA: number;
    totalTTC: number;
    dateCalcul?: Date;
    formuleUtilisee?: string;
    parametresCalcul?: {
      nombreUtilisateurs: number;
      nombreCasquesVR: number;
      typeDeploiement: string;
      pays?: string;
    };
  };
  
  // Dates
  dateCreation: Date;
  dateTraitement?: Date;
  dateEnvoi?: Date;
  
  // Notes admin
  notesAdmin?: string;
  
  // UI
  selected?: boolean;
}

export interface Stats {
  totalNouvelle: number;
  totalEnCours: number;
  totalEnvoyee: number;
  totalDemandes: number;
  montantTotal: number;
}

export type FilterType = 'tous' | 'nouvelle' | 'en_cours' | 'envoyee';


@Component({
  selector: 'app-demande-devis',
  standalone: true,
  imports: [SideBar, CommonModule, FormsModule],   templateUrl: './demande-devis.html',
  styleUrl: './demande-devis.css',
})
export class DemandeDevis  implements OnInit, OnDestroy {
  
  // ========================================
  // Propriétés de Données
  // ========================================
  allDemandes: IDemandeDevis[] = [];
  filteredDemandes: IDemandeDevis[] = [];
  paginatedDemandes: IDemandeDevis[] = [];
  selectedDemande: IDemandeDevis | null = null;
  
  stats: Stats = {
    totalNouvelle: 0,
    totalEnCours: 0,
    totalEnvoyee: 0,
    totalDemandes: 0,
    montantTotal: 0
  };
  
  // ========================================
  // Filtres et Recherche
  // ========================================
  currentFilter: FilterType = 'tous';
  searchQuery: string = '';
  
  // ========================================
  // Pagination
  // ========================================
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  // ========================================
  // États UI
  // ========================================
  isLoading: boolean = false;
  showEmptyState: boolean = false;
  isCalculating: boolean = false;
  isSending: boolean = false;
  
  // ========================================
  // Modales
  // ========================================
  showDetailsModal: boolean = false;
  showDevisModal: boolean = false;
  showNotesModal: boolean = false;
  notesAdmin: string = '';
  
  // ========================================
  // Sélection Multiple
  // ========================================
  selectedDemandeIds: Set<string> = new Set();
  selectAll: boolean = false;
  
  // ========================================
  // RxJS
  // ========================================
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  constructor(
    private adminService: AdminService,
    @Inject(PLATFORM_ID) private platformId: Object,
        private cdr: ChangeDetectorRef  

  ) {}

  // ========================================
  // Lifecycle Hooks
  // ========================================
  ngOnInit(): void {
    console.log('=== DemandesDevis ngOnInit ===');
    this.loadDemandes();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================
  // Initialisation
  // ========================================
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

  // ========================================
  // Sélection Multiple
  // ========================================
  toggleSelectAll(): void {
    this.paginatedDemandes.forEach(demande => demande.selected = this.selectAll);
    this.updateSelectedDemandeIds();
  }

  toggleDemandeSelection(demande: IDemandeDevis): void {
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

  // ========================================
  // Chargement des Données
  // ========================================
  loadDemandes(): void {
    this.isLoading = true;
    
    this.adminService.toutesDemandesDevis()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (demandes: IDemandeDevis[]) => {
          this.allDemandes = demandes.map(demande => ({ ...demande, selected: false }));
          this.currentPage = 1;
          this.applyFilters();
          this.updateStats();
          this.isLoading = false;
                 this.cdr.detectChanges();

        },
        error: (error) => {
          console.error('Erreur chargement demandes:', error);
          this.isLoading = false;
          this.showToast('Erreur lors du chargement des demandes', 'error');
        }
      });
  }

  // ========================================
  // Filtres
  // ========================================
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
        const etablissement = demande.nomEtablissement.toLowerCase();
        const email = demande.emailProfessionnel.toLowerCase();
        const nom = `${demande.prenom} ${demande.nom}`.toLowerCase();
        const ville = demande.ville.toLowerCase();
        
        return etablissement.includes(query) || 
               email.includes(query) || 
               nom.includes(query) ||
               ville.includes(query);
      });
    }

    this.filteredDemandes = filtered;
    this.updatePagination();
    this.showEmptyState = filtered.length === 0 && !this.isLoading;
  }

  // ========================================
  // Pagination
  // ========================================
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

  // ========================================
  // Statistiques
  // ========================================
  updateStats(): void {
    this.stats = {
      totalNouvelle: this.allDemandes.filter(d => d.statut === 'nouvelle').length,
      totalEnCours: this.allDemandes.filter(d => d.statut === 'en_cours').length,
      totalEnvoyee: this.allDemandes.filter(d => d.statut === 'envoyee').length,
      totalDemandes: this.allDemandes.length,
      montantTotal: this.allDemandes
        .filter(d => d.statut === 'envoyee' && d.devisCalcule?.totalTTC)
        .reduce((sum, d) => sum + (d.devisCalcule?.totalTTC || 0), 0)
    };
  }

  get badgeCounts() {
    return {
      tous: this.allDemandes.length,
      nouvelle: this.stats.totalNouvelle,
      en_cours: this.stats.totalEnCours,
      envoyee: this.stats.totalEnvoyee
    };
  }

  // ========================================
  // Gestion des Modales
  // ========================================
  viewDemandeDetails(demande: IDemandeDevis): void {
    this.selectedDemande = demande;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    setTimeout(() => {
      this.selectedDemande = null;
    }, 300);
  }

  openDevisModal(demande: IDemandeDevis): void {
    this.selectedDemande = demande;
    this.showDevisModal = true;
  }

  closeDevisModal(): void {
    this.showDevisModal = false;
    setTimeout(() => {
      this.selectedDemande = null;
    }, 300);
  }

  openNotesModal(demande: IDemandeDevis): void {
    this.selectedDemande = demande;
    this.notesAdmin = demande.notesAdmin || '';
    this.showNotesModal = true;
  }

  closeNotesModal(): void {
    this.showNotesModal = false;
    setTimeout(() => {
      this.selectedDemande = null;
      this.notesAdmin = '';
    }, 300);
  }

  // ========================================
  // Actions sur les Demandes
  // ========================================
  calculerEtEnvoyerDevis(): void {
    if (!this.selectedDemande) return;

    if (isPlatformBrowser(this.platformId)) {
      const confirmer = confirm(
        `Calculer et envoyer le devis à ${this.selectedDemande.nomEtablissement} ?\n\n` +
        `Email : ${this.selectedDemande.emailProfessionnel}\n` +
        `Le devis sera automatiquement calculé et envoyé.`
      );
      
      if (!confirmer) return;
    }

    const demandeId = this.selectedDemande._id;
    const etablissement = this.selectedDemande.nomEtablissement;

    this.isCalculating = true;
    this.isSending = true;

    this.adminService.calculerEtEnvoyerDevis(demandeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Devis calculé et envoyé:', response);
          
          this.isCalculating = false;
          this.isSending = false;
          this.closeDevisModal();
          
          const montantTTC = response.devis?.totalTTC || response.emailInfo?.montantTTC || 0;
          
          if (isPlatformBrowser(this.platformId)) {
            alert(
              `✅ Devis envoyé avec succès à ${etablissement}!\n\n` +
              `Montant TTC : ${this.formatCurrency(montantTTC)}\n\n` +
              `Le devis a été envoyé à ${response.emailInfo?.destinataire}`
            );
          }
          
          this.loadDemandes();
        },
        error: (error) => {
          console.error('❌ Erreur:', error);
          this.isCalculating = false;
          this.isSending = false;
          
          if (isPlatformBrowser(this.platformId)) {
            const errorMsg = error.error?.message || 'Erreur lors de l\'envoi du devis';
            alert(`❌ Erreur: ${errorMsg}\n\nVeuillez réessayer.`);
          }
          
          this.showToast('Erreur lors de l\'envoi du devis', 'error');
        }
      });
  }

  sauvegarderNotes(): void {
   // if (!this.selectedDemande) return;

    //const demandeId = this.selectedDemande._id;

    //this.adminService.mettreAJourNotesDevis(demandeId, this.notesAdmin)
  //    .pipe(takeUntil(this.destroy$))
    //  .subscribe({
      //  next: () => {
        //  this.showToast('Notes sauvegardées', 'success');
    //      this.closeNotesModal();
      //    this.loadDemandes();
   //     },
     //   error: (error) => {
       //   console.error('Erreur sauvegarde notes:', error);
   //       this.showToast('Erreur lors de la sauvegarde', 'error');
     //   }
     // });
  }


  exportToPDFFiltered(): void {
  if (!isPlatformBrowser(this.platformId)) return;

  // PDF paysage
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Headers
  const headers = [['Établissement', 'Contact', 'Email', 'Téléphone', 
    'Ville', 'Pays', 'Utilisateurs', 'Casques VR', 
    'Statut', 'Montant TTC', 'Date']];

  // Contenu
  const rows = this.filteredDemandes.map(d => [
    d.nomEtablissement,
    `${d.prenom} ${d.nom}`,
    d.emailProfessionnel,
    d.telephone,
    d.ville,
    d.pays,
    d.nombreUtilisateurs,
    d.nombreCasquesVR,
    this.getStatusLabel(d.statut),
    d.devisCalcule?.totalTTC ? this.formatCurrency(d.devisCalcule.totalTTC) : 'N/A',
    this.formatDateTime(d.dateCreation)
  ]);

  // Génération du tableau
  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 20,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
  });

  // Titre
  doc.text('Liste des Demandes de Devis', 14, 15);

  // Sauvegarde
  const fileName = `demandes_devis_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  this.showToast('Export PDF réussi !', 'success');
}

  // ========================================
  // Notifications Toast
  // ========================================
  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    if (!isPlatformBrowser(this.platformId)) return;

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
      setTimeout(() => container.removeChild(toast), 400);
    }, 3000);
  }

  // ========================================
  // Helpers / Utilitaires
  // ========================================
  getInitials(etablissement: string): string {
    const words = etablissement.split(' ');
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return etablissement.substring(0, 2).toUpperCase();
  }

  getStatusLabel(statut: IDemandeDevis['statut']): string {
    const labels: Record<IDemandeDevis['statut'], string> = {
      'nouvelle': 'Nouvelle',
      'en_cours': 'En cours',
      'envoyee': 'Envoyée'
    };
    return labels[statut];
  }

  getStatusIcon(statut: IDemandeDevis['statut']): string {
    const icons: Record<IDemandeDevis['statut'], string> = {
      'nouvelle': '🆕',
      'en_cours': '⏳',
      'envoyee': '✅'
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  trackByDemandeId(index: number, demande: IDemandeDevis): string {
    return demande._id;
  }

  hasDevis(demande: IDemandeDevis): boolean {
    return !!demande.devisCalcule && !!demande.devisCalcule.totalTTC;
  }


  
}