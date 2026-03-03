import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Experiences } from '../../services/experiences';
import { ForfaitService } from '../../services/forfait-service';
import { SideBar } from "../side-bar/side-bar";


export interface Experience {
  _id?: string;
  title: string;
  description?: string;
  emoji: string;
  thumbClass: string;
  compatibility: string;
  apkUrl: string;
  apkPublicId?: string;
  apkOriginalName?: string;
  apkSize?: string;
  apkVersion: string;
  apkAndroid: string;
  forfaits?: any[];
  respondents: number;
  avgTime: string;
  rating: number | null;
  createdAt?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  title: '',
  description: '',
  emoji: '🥽',
  thumbClass: 'vrt-1',
  compatibility: 'Quest 2 & 3',
  apkVersion: 'v1.0.0',
  apkAndroid: 'Android 10+',
  forfaits: [] as string[],
};

const EMOJIS        = ['🥽', '🫀', '🧠', '🦷', '🦴', '💉', '🩺', '🔬', '🩻', '⚕️', '🧬', '🏥'];
const THUMB_CLASSES = ['vrt-1', 'vrt-2', 'vrt-3', 'vrt-4', 'vrt-5', 'vrt-6'];


@Component({
  selector: 'app-experience-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBar],
  templateUrl: './experience-management.html',
  styleUrl: './experience-management.css',
})
export class ExperienceManagement implements OnInit {

  // ─── Data ─────────────────────────────────────────────────────────────────
  experiences: Experience[]         = [];
  filteredExperiences: Experience[] = [];
  forfaits: any[]                   = [];

  // ─── Filters ──────────────────────────────────────────────────────────────
  searchQuery           = '';
  selectedForfaitFilter = '';

  // ─── State ────────────────────────────────────────────────────────────────
  isLoading  = false;
  isSaving   = false;
  isDeleting = false;
  errorMessage = '';

  // ─── Modals ───────────────────────────────────────────────────────────────
  showModal       = false;
  showDeleteModal = false;
  showViewModal   = false;

  selectedExperience:  Experience | null = null;
  experienceToDelete:  Experience | null = null;

  // ─── Formulaire ───────────────────────────────────────────────────────────
  formData = { ...DEFAULT_FORM, forfaits: [] as string[] };

  // Champs APK Meta App Lab (remplace selectedFile)
  apkUrl          = '';
  apkPublicId     = '';
  apkOriginalName = '';
  apkSize         = '';

  // ─── Constantes template ──────────────────────────────────────────────────
  readonly emojis       = EMOJIS;
  readonly thumbClasses = THUMB_CLASSES;

  // ─── Toast ────────────────────────────────────────────────────────────────
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private experienceService: Experiences,
    private forfaitService: ForfaitService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadExperiences();
    this.loadForfaits();
  }

  // ─── API ──────────────────────────────────────────────────────────────────

  loadExperiences(): void {
    this.isLoading   = true;
    this.errorMessage = '';

    this.experienceService.getAllExperiences().subscribe({
      next: (data) => {
        this.experiences = data;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Impossible de charger les expériences.';
        this.isLoading    = false;
        console.error(err);
      },
    });
  }

  loadForfaits(): void {
    this.forfaitService.getAllForfaits().subscribe({
      next: (data) => {
        this.forfaits = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement forfaits:', err),
    });
  }

  saveExperience(): void {
    // ── Validations manuelles ──
    if (!this.formData.title.trim()) {
      this.showToast('❌ Le titre est obligatoire.', 'error');
      return;
    }
    if (!this.apkUrl.trim()) {
      this.showToast('❌ Veuillez renseigner le lien APK Meta App Lab.', 'error');
      return;
    }

    this.isSaving = true;

    // ── Payload JSON avec l'URL Meta App Lab ──
    const payload = {
      title:           this.formData.title,
      description:     this.formData.description,
      emoji:           this.formData.emoji,
      thumbClass:      this.formData.thumbClass,
      compatibility:   this.formData.compatibility,
      apkVersion:      this.formData.apkVersion,
      apkAndroid:      this.formData.apkAndroid,
      forfaits:        this.formData.forfaits,
      apkUrl:          this.apkUrl,
      apkPublicId:     this.apkPublicId,
      apkOriginalName: this.apkOriginalName,
      apkSize:         this.apkSize,
    };

    this.experienceService.createExperience(payload).subscribe({
      next: (created) => {
        this.experiences.unshift(created);
        this.applyFilters();
        this.closeModal();
        this.isSaving = false;
        this.cdr.detectChanges();
        this.showToast('✅ Expérience créée avec succès !', 'success');
      },
      error: (err) => {
        this.isSaving = false;
        this.showToast('❌ Erreur lors de la création. Vérifiez les données.', 'error');
        console.error('Erreur création expérience:', err);
      },
    });
  }

  deleteExperience(): void {
    if (!this.experienceToDelete?._id) return;
    this.isDeleting = true;

    this.experienceService.deleteExperience(this.experienceToDelete._id).subscribe({
      next: () => {
        this.experiences = this.experiences.filter(e => e._id !== this.experienceToDelete!._id);
        this.applyFilters();
        this.closeDeleteModal();
        this.isDeleting = false;
        this.cdr.detectChanges();
        this.showToast('🗑️ Expérience supprimée.', 'success');
      },
      error: (err) => {
        this.isDeleting = false;
        this.showToast('❌ Erreur lors de la suppression.', 'error');
        console.error(err);
      },
    });
  }

  // ─── Filtres ──────────────────────────────────────────────────────────────

  applyFilters(): void {
    let result = [...this.experiences];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        e.compatibility.toLowerCase().includes(q)
      );
    }

    if (this.selectedForfaitFilter) {
      result = result.filter(e =>
        e.forfaits?.some((f: any) => (f._id || f) === this.selectedForfaitFilter)
      );
    }

    this.filteredExperiences = result;
  }

  clearFilters(): void {
    this.searchQuery           = '';
    this.selectedForfaitFilter = '';
    this.applyFilters();
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  getTotalExperiences(): number {
    return this.experiences.length;
  }

  getAvgRating(): string {
    const rated = this.experiences.filter(e => e.rating !== null);
    if (!rated.length) return '—';
    const avg = rated.reduce((s, e) => s + (e.rating || 0), 0) / rated.length;
    return avg.toFixed(1);
  }

  getTotalRespondents(): number {
    return this.experiences.reduce((s, e) => s + (e.respondents || 0), 0);
  }

  getForfaitName(id: string): string {
    const f = this.forfaits.find(f => f._id === id);
    return f?.name || id;
  }

  // ─── Forfait multi-select ─────────────────────────────────────────────────

  toggleForfait(id: string): void {
    const idx = this.formData.forfaits.indexOf(id);
    if (idx === -1) this.formData.forfaits.push(id);
    else this.formData.forfaits.splice(idx, 1);
  }

  isForfaitSelected(id: string): boolean {
    return this.formData.forfaits.includes(id);
  }

  // ─── Modals ───────────────────────────────────────────────────────────────

  openModal(): void {
    this.formData        = { ...DEFAULT_FORM, forfaits: [] };
    this.apkUrl          = '';
    this.apkPublicId     = '';
    this.apkOriginalName = '';
    this.apkSize         = '';
    this.showModal       = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  viewExperience(exp: Experience): void {
    this.selectedExperience = exp;
    this.showViewModal      = true;
  }

  closeViewModal(): void {
    this.showViewModal      = false;
    this.selectedExperience = null;
  }

  confirmDelete(exp: Experience): void {
    this.experienceToDelete = exp;
    this.showDeleteModal    = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal    = false;
    this.experienceToDelete = null;
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType    = type;
    this.toastVisible = true;
    this.toastTimer   = setTimeout(() => { this.toastVisible = false; }, 3500);
  }
}
