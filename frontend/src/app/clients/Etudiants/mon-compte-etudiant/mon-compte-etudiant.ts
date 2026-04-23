// mon-compte-etudiant.ts
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import { SideBarEtudiant } from '../side-bar-etudiant/side-bar-etudiant';
 
// ─── Validator : les deux nouveaux mots de passe doivent correspondre ───────
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const nouveau = group.get('nouveauMotDePasse')?.value;
  const confirm = group.get('confirmNouveauMotDePasse')?.value;
  return nouveau && confirm && nouveau !== confirm ? { mismatch: true } : null;
}
@Component({
  selector: 'app-mon-compte-etudiant',
  standalone: true,
  imports: [SideBarEtudiant,CommonModule, ReactiveFormsModule, FormsModule],  templateUrl: './mon-compte-etudiant.html',
  styleUrl: './mon-compte-etudiant.css',
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('280ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class MonCompteEtudiant implements OnInit {
 
  private readonly API = 'http://localhost:3000'; // ← adapter selon votre URL
 
  // ── Navigation ─────────────────────────────────
  activeTab: 'profile' | 'password' = 'profile';
 
  // ── État du profil ──────────────────────────────
  editMode    = false;
  saveLoading = false;
  saveSuccess = false;
  saveError   = '';
 
  profileForm!: FormGroup;
  profileData: any = null;
 
  // ── Infos affichées dans le hero ────────────────
  userName     = '';
  userEmail    = '';
  userInitials = '';
  memberSince  = '';
  niveauBadge  = '—';
 
  // ── Complétion du profil ────────────────────────
  get profileCompletion(): number {
    if (!this.profileData) return 0;
    const fields = ['prenom', 'nom', 'telephone', 'universite', 'specialite', 'niveauEtude', 'documentEtudiant'];
    const filled = fields.filter(f => !!this.profileData[f]).length;
    return Math.round((filled / fields.length) * 100);
  }
 
  // ── État du mot de passe ────────────────────────
  pwLoading = false;
  pwSuccess = false;
  pwError   = '';
 
  passwordForm!: FormGroup;
 
  showOld     = false;
  showNew     = false;
  showConfirm = false;
 
  // ── Force du mot de passe ───────────────────────
  get pwStrength(): number {
    const val: string = this.passwordForm?.get('nouveauMotDePasse')?.value || '';
    if (!val) return 0;
    let score = 0;
    if (val.length >= 6)  score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score = Math.min(score + 1, 3);
    return Math.max(1, Math.min(score, 3));
  }
 
  get pwStrengthLabel(): string {
    return ['', 'Faible', 'Moyen', 'Fort'][this.pwStrength];
  }
 
  constructor(private fb: FormBuilder, private http: HttpClient) {}
 
  // ══════════════════════════════════════════════
  //  Cycle de vie
  // ══════════════════════════════════════════════
  ngOnInit(): void {
    this.buildHeroFromStorage();
    this.initProfileForm();
    this.initPasswordForm();
    this.loadProfile();
  }
 
  // ── Hero depuis localStorage ─────────────────
  private buildHeroFromStorage(): void {
    const nom    = localStorage.getItem('nom')    || '';
    const prenom = localStorage.getItem('prenom') || '';
    const email  = localStorage.getItem('email')  || '';
 
    this.userName    = `${prenom} ${nom}`.trim() || email || 'Étudiant';
    this.userEmail   = email;
    this.memberSince = localStorage.getItem('memberSince') || '—';
 
    const parts = this.userName.split(' ').filter(p => p.length > 0);
    this.userInitials = parts.map((p: string) => p[0].toUpperCase()).slice(0, 2).join('');
  }
 
  // ── Formulaire profil ────────────────────────
  private initProfileForm(): void {
    const nom    = localStorage.getItem('nom')    || '';
    const prenom = localStorage.getItem('prenom') || '';
    const email  = localStorage.getItem('email')  || '';
 
    this.profileForm = this.fb.group({
      prenom:     [{ value: prenom, disabled: true }, Validators.required],
      nom:        [{ value: nom,    disabled: true }, Validators.required],
      telephone:  [{ value: '',     disabled: true }],
      email:      [{ value: email,  disabled: true }],
      universite: [{ value: '',     disabled: true }],
      specialite: [{ value: '',     disabled: true }],
      niveauEtude:[{ value: '',     disabled: true }]
    });
  }
 
  // ── Formulaire mot de passe ─────────────────
  private initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      ancienMotDePasse:          ['', Validators.required],
      nouveauMotDePasse:         ['', [Validators.required, Validators.minLength(6)]],
      confirmNouveauMotDePasse:  ['', Validators.required]
    }, { validators: passwordsMatch });
  }
 
  // ══════════════════════════════════════════════
  //  Chargement du profil
  // ══════════════════════════════════════════════
  loadProfile(): void {
    const headers = this.authHeaders();
    this.http.get<any>(`${this.API}/auth/profile`, { headers }).subscribe({
      next: (data) => {
        this.profileData = data;
        this.patchProfileForm(data);
        this.updateHeroFromData(data);
      },
      error: (err) => console.error('Erreur chargement profil:', err)
    });
  }
 
  private patchProfileForm(data: any): void {
    const fields: Record<string, string> = {
      prenom:     data.prenom     || '',
      nom:        data.nom        || '',
      telephone:  data.telephone  || '',
      email:      data.email      || '',
      universite: data.universite || '',
      specialite: data.specialite || '',
      niveauEtude:data.niveauEtude|| ''
    };
    Object.entries(fields).forEach(([key, val]) => {
      this.profileForm.get(key)?.setValue(val, { emitEvent: false });
    });
  }
 
  private updateHeroFromData(data: any): void {
    const prenom = data.prenom || '';
    const nom    = data.nom    || '';
    this.userName    = `${prenom} ${nom}`.trim() || data.email || 'Étudiant';
    this.userEmail   = data.email || '';
    this.niveauBadge = data.niveauEtude || '—';
 
    if (data.createdAt) {
      const date = new Date(data.createdAt);
      this.memberSince = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    }
 
    const parts = this.userName.split(' ').filter(p => p.length > 0);
    this.userInitials = parts.map((p: string) => p[0].toUpperCase()).slice(0, 2).join('');
  }
 
  // ══════════════════════════════════════════════
  //  Edition du profil
  // ══════════════════════════════════════════════
  toggleEdit(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.profileForm.enable();
      this.profileForm.get('email')?.disable();
    } else {
      this.cancelEdit();
    }
  }
 
  cancelEdit(): void {
    this.editMode = false;
    if (this.profileData) this.patchProfileForm(this.profileData);
    this.profileForm.disable();
    this.saveError   = '';
    this.saveSuccess = false;
  }
 
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
 
    this.saveLoading = true;
    this.saveError   = '';
    this.saveSuccess = false;
 
    const payload: any = {
      prenom:     this.profileForm.get('prenom')?.value,
      nom:        this.profileForm.get('nom')?.value,
      telephone:  this.profileForm.get('telephone')?.value,
      universite: this.profileForm.get('universite')?.value,
      specialite: this.profileForm.get('specialite')?.value,
      niveauEtude:this.profileForm.get('niveauEtude')?.value
    };
 
    // Supprimer les champs vides
    Object.keys(payload).forEach(k => {
      if (payload[k] === '' || payload[k] === null) delete payload[k];
    });
 
    const headers = this.authHeaders();
    this.http.put<any>(`${this.API}/auth/profile`, payload, { headers }).subscribe({
      next: (res) => {
        this.saveLoading = false;
        this.saveSuccess = true;
        this.editMode    = false;
        this.profileForm.disable();
 
        this.profileData = res.user || res;
        this.updateHeroFromData(this.profileData);
 
        if (res.user) {
          localStorage.setItem('nom',    res.user.nom    || '');
          localStorage.setItem('prenom', res.user.prenom || '');
        }
 
        setTimeout(() => this.saveSuccess = false, 4000);
      },
      error: (err) => {
        this.saveLoading = false;
        this.saveError = err.error?.message || 'Erreur lors de la mise à jour.';
        setTimeout(() => this.saveError = '', 5000);
      }
    });
  }
 
  // ══════════════════════════════════════════════
  //  Changement de mot de passe
  // ══════════════════════════════════════════════
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
 
    this.pwLoading = true;
    this.pwError   = '';
    this.pwSuccess = false;
 
    const payload = {
      ancienMotDePasse:         this.passwordForm.get('ancienMotDePasse')?.value,
      nouveauMotDePasse:        this.passwordForm.get('nouveauMotDePasse')?.value,
      confirmNouveauMotDePasse: this.passwordForm.get('confirmNouveauMotDePasse')?.value
    };
 
    const headers = this.authHeaders();
    this.http.put<any>(`${this.API}/auth/password`, payload, { headers }).subscribe({
      next: () => {
        this.pwLoading = false;
        this.pwSuccess = true;
        this.passwordForm.reset();
        this.showOld = this.showNew = this.showConfirm = false;
        setTimeout(() => this.pwSuccess = false, 5000);
      },
      error: (err) => {
        this.pwLoading = false;
        this.pwError = err.error?.message || 'Erreur lors du changement de mot de passe.';
        setTimeout(() => this.pwError = '', 6000);
      }
    });
  }
 
  // ══════════════════════════════════════════════
  //  Helpers
  // ══════════════════════════════════════════════
  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
 
  getStatutLabel(statut: string | undefined): string {
    const map: Record<string, string> = {
      approuve:   'Compte approuvé',
      en_attente: 'En attente de validation',
      rejete:     'Compte rejeté'
    };
    return map[statut || ''] || statut || '—';
  }
}