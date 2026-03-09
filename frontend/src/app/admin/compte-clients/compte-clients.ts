import { ChangeDetectorRef, Component, Injectable, OnDestroy, OnInit } from '@angular/core';
import { SideBar } from "../side-bar/side-bar";
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AdminService } from '../../services/admin-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';


export interface User {
  _id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  role: 'professionnel' | 'etudiant';
  statut: 'en_attente' | 'approuve' | 'rejete';
  
  // Champs Médecin/Professionnel
  typeProfessionnel?: string;
  nomEtablissement?: string;
  fonctionResponsable?: string;
  numeroOrdreProfessionnel?: string;
  numeroImmatriculation?: string;
  adresse?: string;
  
  // Champs Étudiant
  specialite?: string;
  universite?: string;
  niveauEtude?: string;
  numeroInscription?: string;
  
  // Commun
  objectif?: string;
  documentVerification?: string;
  documentEtudiant?:string ; 
  motifRefus?: string;
  createdAt: Date;
  selected?: boolean;
}

export interface Stats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalUsers: number;
}

export type FilterType = 'tous' | 'en_attente' | 'approuve' | 'rejete';
export type RoleFilterType = 'tous' | 'professionnel' | 'etudiant';

@Component({
  selector: 'app-compte-clients',
  standalone: true,
  imports: [SideBar, CommonModule, FormsModule],
  templateUrl: './compte-clients.html',
  styleUrl: './compte-clients.css',
})
export class CompteClients implements OnInit, OnDestroy {
  
  // ========================================
  // Propriétés de Données
  // ========================================
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  
  stats: Stats = {
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalUsers: 0
  };
  
  // ========================================
  // Filtres et Recherche
  // ========================================
  currentFilter: FilterType = 'tous';
  currentRoleFilter: RoleFilterType = 'tous';
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
  
  // ========================================
  // Modales
  // ========================================
  showDetailsModal: boolean = false;
  showRejectModal: boolean = false;
  selectedUser: User | null = null;
  motifRefus: string = '';
  
  // ========================================
  // Sélection Multiple
  // ========================================
  selectedUserIds: Set<string> = new Set();
  selectAll: boolean = false;
  
  // ========================================
  // RxJS
  // ========================================
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private autoRefreshInterval: any;

  // Configuration du rechargement automatique (optionnel)
  // Mettre à 0 pour désactiver
  private autoRefreshMinutes: number = 0; // Changez à 5 pour recharger toutes les 5 minutes

  
  constructor(
    private adminService: AdminService,
      @Inject(PLATFORM_ID) private platformId: Object,
          private cdr: ChangeDetectorRef  


  ) {}

  // ========================================
  // Lifecycle Hooks
  // ========================================
  ngOnInit(): void {
    this.currentFilter = 'tous'

    console.log('=== CompteClients ngOnInit ===');
    console.log('Service AdminService disponible:', !!this.adminService);
    this.loadUsers();
    this.setupSearchDebounce();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearAutoRefresh();
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

  private setupAutoRefresh(): void {
    if (this.autoRefreshMinutes > 0) {
      console.log(`Auto-refresh activé: toutes les ${this.autoRefreshMinutes} minutes`);
      this.autoRefreshInterval = setInterval(() => {
        console.log('Rechargement automatique des données...');
        this.loadUsers();
      }, this.autoRefreshMinutes * 60 * 1000);
    }
  }

  private clearAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  // ========================================
  // Sélection Multiple
  // ========================================
  toggleSelectAll(): void {
    this.paginatedUsers.forEach(user => user.selected = this.selectAll);
    this.updateSelectedUserIds();
  }

  toggleUserSelection(user: User): void {
    this.updateSelectedUserIds();
    this.updateSelectAllState();
  }

  private updateSelectedUserIds(): void {
    this.selectedUserIds = new Set(
      this.allUsers.filter(u => u.selected).map(u => u._id)
    );
  }

  private updateSelectAllState(): void {
    this.selectAll = this.paginatedUsers.length > 0 && 
                     this.paginatedUsers.every(u => u.selected);
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds.has(userId);
  }



  // ========================================
  // Chargement des Données
  // ========================================
  loadUsers(): void {
    this.isLoading = true;
    
    this.adminService.tousclients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users: User[]) => {
          
          this.allUsers = users.map(user => ({ ...user, selected: false }));
          this.currentPage = 1; // Reset à la page 1
          this.applyFilters();
          this.updateStats();
          this.isLoading = false;
                 this.cdr.detectChanges();

       
        },
        error: (error) => {
          console.error('Erreur chargement comptes:', error);
          this.isLoading = false;
          this.allUsers = [];
          this.filteredUsers = [];
          this.paginatedUsers = [];
          this.showToast('Erreur lors du chargement des comptes', 'error');
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

  onRoleFilterChange(role: RoleFilterType): void {
    this.currentRoleFilter = role;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchInput(query: string): void {
    this.searchSubject.next(query);
  }

  applyFilters(): void {
    let filtered = [...this.allUsers];

    // Filtre par statut
    if (this.currentFilter !== 'tous') {
      filtered = filtered.filter(user => user.statut === this.currentFilter);
    }

    // Filtre par rôle
    if (this.currentRoleFilter !== 'tous') {
      filtered = filtered.filter(user => user.role === this.currentRoleFilter);
    }

    // Recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(user => {
        const fullName = `${user.prenom} ${user.nom}`.toLowerCase();
        const email = user.email.toLowerCase();
        const etablissement = (user.nomEtablissement || user.universite || '').toLowerCase();
        const telephone = (user.telephone || '').toLowerCase();
        
        return fullName.includes(query) || 
               email.includes(query) || 
               etablissement.includes(query) ||
               telephone.includes(query);
      });
    }

    this.filteredUsers = filtered;
    console.log('Filtres appliqués - Résultats:', this.filteredUsers.length);
    this.updatePagination();
    this.showEmptyState = filtered.length === 0 && !this.isLoading;
  }

  // ========================================
  // Pagination
  // ========================================
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    
    // S'assurer que la page actuelle est valide
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
    

    
    // Mettre à jour l'état de sélection globale
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

  // ========================================
  // Statistiques
  // ========================================
  updateStats(): void {
    this.stats = {
      totalPending: this.allUsers.filter(u => u.statut === 'en_attente').length,
      totalApproved: this.allUsers.filter(u => u.statut === 'approuve').length,
      totalRejected: this.allUsers.filter(u => u.statut === 'rejete').length,
      totalUsers: this.allUsers.length
    };
  }

  get badgeCounts() {
    return {
      tous: this.allUsers.length,
      en_attente: this.stats.totalPending,
      approuve: this.stats.totalApproved,
      rejete: this.stats.totalRejected
    };
  }

  // ========================================
  // Gestion des Modales
  // ========================================
  viewUserDetails(user: User): void {
    this.selectedUser = user;
    this.showDetailsModal = true;
      console.log('documentEtudiant:', user.documentEtudiant);

  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    setTimeout(() => {
      this.selectedUser = null;
    }, 300);
  }

  openRejectModal(user: User): void {
    this.selectedUser = user;
    this.motifRefus = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    setTimeout(() => {
      this.selectedUser = null;
      this.motifRefus = '';
    }, 300);
  }

  // ========================================
  // Actions sur les Comptes
  // ========================================
  approveUser(user: User): void {
    if (!confirm(`Êtes-vous sûr de vouloir approuver le compte de ${user.prenom} ${user.nom} ?`)) {
      return;
    }

    this.adminService.approuverCompte(user._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser: User) => {
          this.updateUserInList(updatedUser);
          this.showToast(`Compte de ${user.prenom} ${user.nom} approuvé avec succès !`, 'success');
          // Recharger automatiquement les données
                  this.cdr.detectChanges();

          this.loadUsers();
        },
        error: (error) => {
          console.error('Erreur approbation:', error);
          this.showToast('Erreur lors de l\'approbation du compte', 'error');
        }
      });
  }

  approveUserFromModal(user: User): void {
    this.closeDetailsModal();
    this.approveUser(user);
  }

  rejectUserFromModal(user: User): void {
    this.closeDetailsModal();
    setTimeout(() => {
      this.openRejectModal(user);
    }, 300);
  }

  confirmReject(): void {
    if (!this.motifRefus.trim()) {
      this.showToast('Veuillez indiquer un motif de rejet', 'error');
      return;
    }

    if (!this.selectedUser) return;

    const userId = this.selectedUser._id;
    const userName = `${this.selectedUser.prenom} ${this.selectedUser.nom}`;

    this.adminService.rejeterCompte(userId, this.motifRefus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser: User) => {
          this.updateUserInList(updatedUser);
          this.closeRejectModal();
          this.showToast(`Compte de ${userName} rejeté`, 'success');
          // Recharger automatiquement les données
          this.loadUsers();
        },
        error: (error) => {
          console.error('Erreur rejet:', error);
          this.showToast('Erreur lors du rejet du compte', 'error');
        }
      });
  }

  // Méthode helper pour mettre à jour un utilisateur dans la liste
  private updateUserInList(updatedUser: User): void {
    const index = this.allUsers.findIndex(u => u._id === updatedUser._id);
    if (index !== -1) {
      this.allUsers[index] = { ...updatedUser, selected: this.allUsers[index].selected };
      this.applyFilters();
      this.updateStats();
    }
  }

  // ========================================
  // Gestion des Documents
  // ========================================
getDocumentUrl(documentPath: string): string {
  // Si c'est déjà une URL complète, renvoyer telle quelle
  if (!documentPath) return '';
  if (documentPath.startsWith('http')) {
    return documentPath;
  }
  // Sinon construire l'URL vers le backend
  return `${this.getBackendUrl()}/uploads/${documentPath}`;
}


  getDocumentName(documentPath: string): string {
    if (!documentPath) return 'Document';
    
    // Extraire le nom du fichier du chemin
    const fileName = documentPath.split('/').pop() || documentPath;
    
    // Décoder les caractères URL encodés
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  }

  downloadDocument(documentPath: string): void {
    const url = this.getDocumentUrl(documentPath);
    const fileName = this.getDocumentName(documentPath);
    
    // Créer un lien temporaire pour télécharger
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Nettoyer
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        
        this.showToast('Document téléchargé avec succès', 'success');
      })
      .catch(error => {
        console.error('Erreur téléchargement:', error);
        this.showToast('Erreur lors du téléchargement du document', 'error');
        
        // Fallback: ouvrir dans un nouvel onglet
        window.open(url, '_blank');
      });
  }

  private getBackendUrl(): string {
  
    return'http://localhost:3000';
  }

  // ========================================
  // Export
  // ========================================
exportToCSV(): void {

  if (!isPlatformBrowser(this.platformId)) {
    return; // SSR protection
  }

  const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Établissement', 'Statut', 'Date d\'inscription'];
  const rows = this.filteredUsers.map(user => [
    user.prenom,
    user.nom,
    user.email,
    user.telephone || '',
    this.capitalizeFirst(user.role),
    this.getEtablissement(user),
    this.getStatusLabel(user.statut),
    this.formatDateTime(user.createdAt)
  ]);

  let csvContent = headers.join(',') + '\n';
  csvContent += rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `comptes_medvr_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  this.showToast('Export CSV réussi !', 'success');
}

  // ========================================
  // Notifications Toast
  // ========================================
private showToast(
  message: string, 
  type: 'success' | 'error' | 'warning' = 'success'
): void {

  if (!isPlatformBrowser(this.platformId)) {
    return; // ❌ côté serveur → on sort
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
  getInitials(prenom: string, nom: string): string {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  }

  capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getStatusLabel(statut: User['statut']): string {
    const labels: Record<User['statut'], string> = {
      'en_attente': 'En attente',
      'approuve': 'Approuvé',
      'rejete': 'Rejeté'
    };
    return labels[statut];
  }

  getStatusIcon(statut: User['statut']): string {
    const icons: Record<User['statut'], string> = {
      'en_attente': '⏳',
      'approuve': '✅',
      'rejete': '❌'
    };
    return icons[statut];
  }

  getRoleIcon(role: User['role']): string {
    return role === 'professionnel' ? '👨‍⚕️' : '🎓';
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

  getEtablissement(user: User): string {
    return user.nomEtablissement || user.universite || 'Non renseigné';
  }

  getSecondaryInfo(user: User): string {
    if (user.role === 'professionnel') {
      return user.typeProfessionnel || 'Professionnel';
    } else {
      return user.niveauEtude || 'Étudiant';
    }
  }

  trackByUserId(index: number, user: User): string {
    return user._id;
  }
}