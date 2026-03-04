import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ForfaitService } from '../../services/forfait-service';
import { SideBar } from "../side-bar/side-bar";
import { Router } from '@angular/router';

export interface Feature {
  text: string;
  yes: boolean;
}

export interface Formation {
  incluse: boolean;
  dureeHeures: number;
  maxEtudiants: number;
  detaillee: boolean;
}

export interface Forfait {
  _id?: string;
  name: string;
  tagline?: string;
  price?: number;
  priceYearly?: string;
  priceSub?: string;
  desc?: string;
  experiences?: string;
  nbExperiences?: number;
  apk?: string;
  nbApk?: number;
  formation: Formation;
  simulationEsthetique: boolean;
  features: Feature[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Default form values ──────────────────────────────────────────────────────

const DEFAULT_FORM_DATA: Forfait = {
  name: '',
  tagline: '',
  price: undefined,
  priceYearly: '',
  priceSub: '',
  desc: '',
  experiences: '',
  nbExperiences: 0,
  apk: '',
  nbApk: 0,
  formation: {
    incluse: false,
    dureeHeures: 0,
    maxEtudiants: 0,
    detaillee: false,
  },
  simulationEsthetique: false,
  features: [],
};

@Component({
  selector: 'app-forfait-managment',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, SideBar], 
   templateUrl: './forfait-managment.html',
  styleUrl: './forfait-managment.css',
})
export class ForfaitManagment implements OnInit {

  constructor(
    private forfaitService: ForfaitService,
    private router: Router,
   private cdr: ChangeDetectorRef  
    
  ) {}

  // ─── Navigation 
  goToExperiences(forfaitId?: string): void {
    this.router.navigate(['/admin/experienceManagement'], {
      queryParams: forfaitId ? { forfait: forfaitId } : {}
    });
  }



  // ─── State 
  forfaits: Forfait[] = [];
  filteredForfaits: Forfait[] = [];
  searchQuery = '';
  viewMode: 'cards' | 'table' = 'cards';

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  errorMessage = '';

  // ─── Modals 
  showModal = false;
  showViewModal = false;
  showDeleteModal = false;
  isEditing = false;

  selectedForfait: Forfait | null = null;
  forfaitToDelete: Forfait | null = null;

  formData: Forfait = this.cloneDefault();

  // ─── Toast 
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;



  ngOnInit(): void {
    this.loadForfaits();
  }


  loadForfaits(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.forfaitService.getAllForfaits().subscribe({
      next: (data) => {
        this.forfaits = data;
        this.applySearch();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Impossible de charger les forfaits. Vérifiez votre connexion.';
        this.isLoading = false;
        console.error('Erreur chargement forfaits:', err);
      },
    });
  }



  saveForfait(): void {
    if (!this.formData.name.trim()) return;

    this.isSaving = true;

    const request$ = this.isEditing
      ? this.forfaitService.updateForfait(this.selectedForfait!._id!, this.formData)
      : this.forfaitService.createForfait(this.formData);

    request$.subscribe({
      next: (savedForfait) => {
        if (this.isEditing) {
          const idx = this.forfaits.findIndex(f => f._id === savedForfait._id);
          if (idx !== -1) this.forfaits[idx] = savedForfait;
        } else {
          this.forfaits.unshift(savedForfait);
        }

        this.applySearch();
        this.closeModal();
        this.isSaving = false;
        this.showToast(
          this.isEditing ? '✅ Forfait mis à jour avec succès !' : '✅ Forfait créé avec succès !',
          'success'
        );
      },
      error: (err) => {
        this.isSaving = false;
        this.showToast('❌ Erreur lors de l\'enregistrement. Réessayez.', 'error');
        console.error('Erreur sauvegarde forfait:', err);
      },
    });
  }

  deleteForfait(): void {
    if (!this.forfaitToDelete?._id) return;

    this.isDeleting = true;

    this.forfaitService.deleteForfait(this.forfaitToDelete._id!).subscribe({
      next: () => {
        this.forfaits = this.forfaits.filter(f => f._id !== this.forfaitToDelete!._id);
        this.applySearch();
        this.closeDeleteModal();
        this.isDeleting = false;
        this.showToast('🗑️ Forfait supprimé avec succès !', 'success');
      },
      error: (err) => {
        this.isDeleting = false;
        this.showToast('❌ Erreur lors de la suppression. Réessayez.', 'error');
        console.error('Erreur suppression forfait:', err);
      },
    });
  }


  onSearch(): void {
    this.applySearch();
  }

  private applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredForfaits = [...this.forfaits];
      return;
    }

    this.filteredForfaits = this.forfaits.filter(f =>
      f.name.toLowerCase().includes(q) ||
      (f.tagline || '').toLowerCase().includes(q) ||
      (f.desc || '').toLowerCase().includes(q)
    );
  }


  getForfaitsAvecFormation(): number {
    return this.forfaits.filter(f => f.formation?.incluse).length;
  }

  getTotalApk(): number {
    return this.forfaits.reduce((sum, f) => sum + (f.nbApk || 0), 0);
  }

  getForfaitsEsthetique(): number {
    return this.forfaits.filter(f => f.simulationEsthetique).length;
  }


  openModal(forfait?: Forfait): void {
    if (forfait) {
      this.isEditing = true;
      this.selectedForfait = forfait;
      this.formData = this.deepClone(forfait);
    } else {
      this.isEditing = false;
      this.selectedForfait = null;
      this.formData = this.cloneDefault();
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  closeModalOnOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }


  viewForfait(forfait: Forfait): void {
    this.selectedForfait = forfait;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedForfait = null;
  }


  confirmDelete(forfait: Forfait): void {
    this.forfaitToDelete = forfait;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.forfaitToDelete = null;
  }


  addFeature(): void {
    this.formData.features.push({ text: '', yes: true });
  }

  removeFeature(index: number): void {
    this.formData.features.splice(index, 1);
  }


  showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;

    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 3500);
  }

  private cloneDefault(): Forfait {
    return this.deepClone(DEFAULT_FORM_DATA);
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}