import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cible, Experiences } from '../../services/experiences';
import { ForfaitService } from '../../services/forfait-service';
import { SideBar } from "../side-bar/side-bar";


export interface Experience {
  _id?: string;
  title: string;
  description?: string;
  emoji: string;
  thumbClass: string;
  compatibility: string;
  apkUrl?: string;
  appLabUrl: string;
  forfaits?: any[];
  respondents: number;
  avgTime: string;
  rating: number | null;
  cible: Cible;
  createdAt?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  title: '',
  description: '',
  emoji: '🥽',
  thumbClass: 'vrt-1',
  compatibility: 'Quest 2 & 3',
  cible: 'les deux' as Cible,
  forfaits: [] as string[],
};

const EMOJIS        = ['🥽', '🫀', '🧠', '🦷', '🦴', '💉', '🩺', '🔬', '🩻', '⚕️', '🧬', '🏥'];
const THUMB_CLASSES = ['vrt-1', 'vrt-2', 'vrt-3', 'vrt-4', 'vrt-5', 'vrt-6'];
const CIBLES: { value: Cible; label: string; icon: string }[] = [
  { value: 'etudiant',      label: 'Étudiant',      icon: '🎓' },
  { value: 'professionnel', label: 'Professionnel', icon: '💼' },
  { value: 'les deux',      label: 'Les deux',       icon: '👥' },
];


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
  selectedCibleFilter   = '';

  // ─── State ────────────────────────────────────────────────────────────────
  isLoading    = false;
  isSaving     = false;
  isDeleting   = false;
  errorMessage = '';

  // ─── Edit mode ────────────────────────────────────────────────────────────
  isEditMode    = false;
  editingId: string | null = null;

  // ─── Modals ───────────────────────────────────────────────────────────────
  showModal       = false;
  showDeleteModal = false;
  showViewModal   = false;

  selectedExperience: Experience | null = null;
  experienceToDelete: Experience | null = null;

  // ─── Formulaire ───────────────────────────────────────────────────────────
  formData   = { ...DEFAULT_FORM, forfaits: [] as string[] };
  appLabUrl  = '';
  apkUrl     = '';

  // ─── Constantes template ──────────────────────────────────────────────────
  readonly emojis       = EMOJIS;
  readonly thumbClasses = THUMB_CLASSES;
  readonly cibles       = CIBLES;

  // ─── Toast ────────────────────────────────────────────────────────────────
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  linkCopied = false;

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
    this.isLoading    = true;
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

  // ─── Forfaits filtrés selon la cible du formulaire ────────────────────────

  /**
   * Retourne uniquement les forfaits compatibles avec la cible sélectionnée.
   * - cible 'etudiant'      → forfaits où f.cible === 'etudiant' OU 'les deux'
   * - cible 'professionnel' → forfaits où f.cible === 'professionnel' OU 'les deux'
   * - cible 'les deux'      → tous les forfaits
   */
  get forfaitsFiltres(): any[] {
    const cible = this.formData.cible;
    if (!cible || cible === 'les deux') return this.forfaits;
    return this.forfaits.filter(f =>
      f.cible === cible || f.cible === 'les deux'
    );
  }

  /**
   * Change la cible et désélectionne automatiquement les forfaits
   * qui ne sont plus compatibles avec la nouvelle cible.
   */
  selectCible(cible: Cible): void {
    this.formData.cible = cible;

    // Recalcule les IDs valides après changement de cible
    const idsValides = this.forfaitsFiltres.map(f => f._id);
    this.formData.forfaits = this.formData.forfaits.filter(id =>
      idsValides.includes(id)
    );
  }

  // ─── Save (create ou update) ──────────────────────────────────────────────

  saveExperience(): void {
    if (!this.formData.title.trim()) {
      this.showToast('❌ Le titre est obligatoire.', 'error'); return;
    }
    if (!this.appLabUrl.trim()) {
      this.showToast('❌ Le lien Meta App Lab est obligatoire.', 'error'); return;
    }

    this.isSaving = true;

    const payload = {
      title:         this.formData.title,
      description:   this.formData.description,
      emoji:         this.formData.emoji,
      thumbClass:    this.formData.thumbClass,
      compatibility: this.formData.compatibility,
      forfaits:      this.formData.forfaits,
      appLabUrl:     this.appLabUrl,
      apkUrl:        this.apkUrl.trim() || this.appLabUrl,
      cible:         this.formData.cible,
    };

    if (this.isEditMode && this.editingId) {
      this.experienceService.updateExperience(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.experiences.findIndex(e => e._id === this.editingId);
          if (idx !== -1) this.experiences[idx] = updated;
          this.applyFilters();
          this.closeModal();
          this.isSaving = false;
          this.cdr.detectChanges();
          this.showToast('✅ Expérience mise à jour avec succès !', 'success');
        },
        error: (err) => {
          this.isSaving = false;
          this.showToast('❌ Erreur lors de la mise à jour.', 'error');
          console.error(err);
        },
      });
    } else {
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
          console.error(err);
        },
      });
    }
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

  // ─── Filtres liste principale ─────────────────────────────────────────────

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

    if (this.selectedCibleFilter) {
      result = result.filter(e => e.cible === this.selectedCibleFilter);
    }

    this.filteredExperiences = result;
  }

  clearFilters(): void {
    this.searchQuery           = '';
    this.selectedForfaitFilter = '';
    this.selectedCibleFilter   = '';
    this.applyFilters();
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  getTotalExperiences(): number {
    return this.experiences.length;
  }

  getAvgRating(): string {
    const rated = this.experiences.filter(e => e.rating !== null);
    if (!rated.length) return '—';
    return (rated.reduce((s, e) => s + (e.rating || 0), 0) / rated.length).toFixed(1);
  }

  getTotalRespondents(): number {
    return this.experiences.reduce((s, e) => s + (e.respondents || 0), 0);
  }

  // ─── Helpers cible ────────────────────────────────────────────────────────

  getCibleLabel(cible: Cible): string {
    return this.cibles.find(c => c.value === cible)?.label ?? cible;
  }

  getCibleIcon(cible: Cible): string {
    return this.cibles.find(c => c.value === cible)?.icon ?? '👥';
  }

  getForfaitName(id: string): string {
    return this.forfaits.find(f => f._id === id)?.name || id;
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
    this.isEditMode = false;
    this.editingId  = null;
    this.formData   = { ...DEFAULT_FORM, forfaits: [] };
    this.appLabUrl  = '';
    this.apkUrl     = '';
    this.showModal  = true;
  }

  editExperience(exp: Experience): void {
    this.isEditMode = true;
    this.editingId  = exp._id || null;
    this.formData   = {
      title:         exp.title,
      description:   exp.description || '',
      emoji:         exp.emoji,
      thumbClass:    exp.thumbClass,
      compatibility: exp.compatibility,
      cible:         exp.cible || 'les deux',
      forfaits:      (exp.forfaits || []).map((f: any) => f._id || f),
    };
    this.appLabUrl  = exp.appLabUrl || '';
    this.apkUrl     = exp.apkUrl    || '';
    this.showModal  = true;
  }

  closeModal(): void {
    this.showModal  = false;
    this.isEditMode = false;
    this.editingId  = null;
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

  copyAppLabLink(): void {
    if (!this.selectedExperience?.appLabUrl) return;
    navigator.clipboard.writeText(this.selectedExperience.appLabUrl).then(() => {
      this.linkCopied = true;
      setTimeout(() => { this.linkCopied = false; }, 2500);
    });
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