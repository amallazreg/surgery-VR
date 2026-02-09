import { Component, OnDestroy, OnInit } from '@angular/core';
import { SideBar } from "../side-bar/side-bar";
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AdminService } from '../../services/admin-service';
import { CommonEngine } from '@angular/ssr/node';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export interface User {
  _id: string;
  prenom: string;
  nom: string;
  email: string;
  phone?: string;
  role: 'medecin' | 'etudiant';
  statut: 'en_attente' | 'approuve' | 'rejete';
  
  // Champs Médecin
  specialite?: string;
  etablissement?: string;
  ville?: string;
  numeroOrdre?: string;
  
  // Champs Étudiant
  universite?: string;
  anneeEtude?: string;
  encadrant?: string;
  
  // Commun
  objectif?: string;
  documentVerification?: string;
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
export type RoleFilterType = 'tous' | 'medecin' | 'etudiant';

@Component({
  selector: 'app-compte-clients',
  standalone : true,
  imports: [SideBar,CommonModule,FormsModule],
  templateUrl: './compte-clients.html',
  styleUrl: './compte-clients.css',
})
export class CompteClients implements OnInit, OnDestroy {
  

  allUsers: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  
  stats: Stats = {
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalUsers: 0
  };
  
  currentFilter: FilterType = 'tous';
  currentRoleFilter: RoleFilterType = 'tous';
  searchQuery: string = '';
  
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  
  isLoading: boolean = false;
  showEmptyState: boolean = false;
  
  showDetailsModal: boolean = false;
  showRejectModal: boolean = false;
  selectedUser: User | null = null;
  motifRefus: string = '';
  
  selectedUserIds: Set<string> = new Set();
  selectAll: boolean = false;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  
  constructor(
    private adminService : AdminService
  ) {}


  ngOnInit(): void {
    this.loadUsers();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        this.applyFilters();
      });
  }

  toggleSelectAll() {
  this.filteredUsers.forEach(user => user.selected = this.selectAll);
  this.selectedUserIds = new Set(this.filteredUsers.filter(u => u.selected).map(u => u._id));
}

toggleUserSelection(user: User) {
  if (user.selected) this.selectedUserIds.add(user._id);
  else this.selectedUserIds.delete(user._id);
}


  loadUsers(): void {
    this.isLoading = true;
    
    this.adminService.tousclients()
      .pipe(takeUntil(this.destroy$))
         .subscribe({
         next: (users: User[]) => {
          this.allUsers = users;
          this.applyFilters();
          this.updateStats();
          this.isLoading = false;
       //   this.toastService.show('Données chargées avec succès', 'success');
       console.log(users)
       console.log('Données chargées avec succès', 'success')
        },
       error: (error) => {
          console.error('Erreur chargement comptes:', error);
          this.isLoading = false;
         // this.toastService.show('Erreur lors du chargement', 'error');
         console.log('Erreur lors du chargement', 'error')
        }
      });
  }


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
        const etablissement = (user.etablissement || user.universite || '').toLowerCase();
        
        return fullName.includes(query) || 
               email.includes(query) || 
               etablissement.includes(query);
      });
    }

    this.filteredUsers = filtered;
    this.updatePagination();
    this.showEmptyState = filtered.length === 0;
  }


  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
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


  viewUserDetails(user: User): void {
    this.selectedUser = user;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedUser = null;
  }

  approveUser(user: User): void {
    if (!confirm(`Êtes-vous sûr de vouloir approuver le compte de ${user.prenom} ${user.nom} ?`)) {
      return;
    }

 //   this.comptesService.approuverCompte(user._id)
   //   .pipe(takeUntil(this.destroy$))
   //   .subscribe({
   //     next: (updatedUser: User) => {
   //       const index = this.allUsers.findIndex(u => u._id === user._id);
   //       if (index !== -1) {
     //       this.allUsers[index] = updatedUser;
       //   }
    //      this.applyFilters();
      //    this.updateStats();
     //     this.toastService.show(`Compte de ${user.prenom} ${user.nom} approuvé !`, 'success');
     //   },
      //  error: (error) => {
      //    console.error('Erreur approbation:', error);
       //   this.toastService.show('Erreur lors de l\'approbation', 'error');
        //}
    //  });
  }

  openRejectModal(user: User): void {
    this.selectedUser = user;
    this.motifRefus = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedUser = null;
    this.motifRefus = '';
  }

  confirmReject(): void {
    if (!this.motifRefus.trim()) {
     // this.toastService.show('Veuillez indiquer un motif de rejet', 'error');
      return;
    }

    if (!this.selectedUser) return;

//    this.comptesService.rejeterCompte(this.selectedUser._id, this.motifRefus)
  //    .pipe(takeUntil(this.destroy$))
    //  .subscribe({
      //  next: (updatedUser: User) => {
     //     const index = this.allUsers.findIndex(u => u._id === this.selectedUser!._id);
       //   if (index !== -1) {
        //    this.allUsers[index] = updatedUser;
     //     }
       //   this.applyFilters();
         // this.updateStats();
   //       this.closeRejectModal();
     //     this.toastService.show('Compte rejeté', 'success');
       // },
     //   error: (error) => {
       //   console.error('Erreur rejet:', error);
         // this.toastService.show('Erreur lors du rejet', 'error');
     //   }
     // });
  }

  // ========================================
  // Sélection Multiple
  // ========================================

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds.has(userId);
  }

  // ========================================
  // Export
  // ========================================
  exportToCSV(): void {
    const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Rôle', 'Établissement', 'Statut', 'Date'];
    const rows = this.filteredUsers.map(user => [
      user.prenom,
      user.nom,
      user.email,
      user.phone || '',
      user.role,
      user.etablissement || user.universite || '',
      this.getStatusLabel(user.statut),
      this.formatDate(user.createdAt)
    ]);

    let csvContent = headers.join(',') + '\n';
    csvContent += rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = `comptes_medvr_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
 //   this.toastService.show('Export CSV réussi !', 'success');
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
    return role === 'medecin' ? '👨‍⚕️' : '🎓';
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
    return user.etablissement || user.universite || 'N/A';
  }

  getSecondaryInfo(user: User): string {
    if (user.role === 'medecin') {
      return user.specialite || '';
    } else {
      return user.anneeEtude || '';
    }
  }

  trackByUserId(index: number, user: User): string {
    return user._id;
  }
}