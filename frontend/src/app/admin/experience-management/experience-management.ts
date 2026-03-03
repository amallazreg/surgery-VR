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
  forfaits: any[];
  respondents: number;
  avgTime: string;
  rating: number | null;
  createdAt?: string;
}

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

const EMOJIS = ['🥽', '🫀', '🧠', '🦷', '🦴', '💉', '🩺', '🔬', '🩻', '⚕️', '🧬', '🏥'];
const THUMB_CLASSES = ['vrt-1', 'vrt-2', 'vrt-3', 'vrt-4', 'vrt-5', 'vrt-6'];

@Component({
  selector: 'app-experience-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SideBar],
  templateUrl: './experience-management.html',
  styleUrl: './experience-management.css',
})
export class ExperienceManagement implements OnInit {

  experiences: Experience[] = [];
  filteredExperiences: Experience[] = [];
  forfaits: any[] = [];

  searchQuery = '';
  selectedForfaitFilter = '';

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  errorMessage = '';

  showModal = false;
  showDeleteModal = false;
  showViewModal = false;

  selectedExperience: Experience | null = null;
  experienceToDelete: Experience | null = null;

  formData = { ...DEFAULT_FORM, forfaits: [] as string[] };
  selectedFile: File | null = null;
  filePreview = '';
  dragOver = false;

  readonly emojis = EMOJIS;
  readonly thumbClasses = THUMB_CLASSES;

  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  constructor(
    private experienceService: Experiences,
    private forfaitService: ForfaitService,
    private cdr: ChangeDetectorRef  

  ) {}

  ngOnInit(): void {
    this.loadExperiences();
    this.loadForfaits();
  }

  // ─── API ──────────────────────────────────────────────────────────────────

  loadExperiences(): void {
    this.isLoading = true;
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
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  loadForfaits(): void {
    this.forfaitService.getAllForfaits().subscribe({
      next: (data) => { this.forfaits = data;
                this.cdr.detectChanges();

       },
      error: (err) => console.error('Erreur chargement forfaits:', err),
    });
  }

  saveExperience(): void {
    if (!this.formData.title.trim() || !this.selectedFile) return;

    this.isSaving = true;
    const fd = new FormData();

    fd.append('apk', this.selectedFile);
    fd.append('title', this.formData.title);
    fd.append('description', this.formData.description || '');
    fd.append('emoji', this.formData.emoji);
    fd.append('thumbClass', this.formData.thumbClass);
    fd.append('compatibility', this.formData.compatibility);
    fd.append('apkVersion', this.formData.apkVersion);
    fd.append('apkAndroid', this.formData.apkAndroid);
    this.formData.forfaits.forEach(id => fd.append('forfaits', id));

    this.experienceService.createExperience(fd).subscribe({
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
        this.showToast('❌ Erreur lors de la création.', 'error');
        console.error(err);
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

  // ─── Filters ──────────────────────────────────────────────────────────────

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
        e.forfaits?.some((f: any) =>
          (f._id || f) === this.selectedForfaitFilter
        )
      );
    }

    this.filteredExperiences = result;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedForfaitFilter = '';
    this.applyFilters();
  }

  // ─── Stats Helpers ────────────────────────────────────────────────────────

  getTotalExperiences(): number { return this.experiences.length; }

  getExperiencesWithRating(): number {
    return this.experiences.filter(e => e.rating !== null).length;
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

  getStars(rating: number | null): string {
    if (!rating) return '—';
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  }

  getForfaitName(id: string): string {
    const f = this.forfaits.find(f => f._id === id);
    return f?.name || id;
  }

  // ─── File Upload ──────────────────────────────────────────────────────────

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.handleFile(input.files[0]);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(): void { this.dragOver = false; }

  private handleFile(file: File): void {
    this.selectedFile = file;
    this.filePreview = file.name;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ─── Forfait Multi-Select ─────────────────────────────────────────────────

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
    this.formData = { ...DEFAULT_FORM, forfaits: [] };
    this.selectedFile = null;
    this.filePreview = '';
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  viewExperience(exp: Experience): void {
    this.selectedExperience = exp;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedExperience = null;
  }

  confirmDelete(exp: Experience): void {
    this.experienceToDelete = exp;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.experienceToDelete = null;
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 3500);
  }
}
