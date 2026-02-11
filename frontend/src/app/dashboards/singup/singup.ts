import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Navbar } from "../../layout/navbar/navbar";
import { HttpClient } from '@angular/common/http';
import { AuthServiceService } from '../../services/auth-services';

@Component({
  selector: 'app-singup',
  standalone : true ,
  imports: [CommonModule, FormsModule, Navbar, ReactiveFormsModule, RouterModule],
  templateUrl: './singup.html',
  styleUrl: './singup.css',
})
export class Singup implements OnInit {
  // Step management
  currentStep: number = 1;
  progressWidth: number = 0;

  // Account type selection
  selectedAccountType: 'etudiant' | 'professionnel' | null = null;
  professionalType: 'professionnel' | 'institution' | null = null;

  // Forms
  infoForm!: FormGroup;
  verificationForm!: FormGroup;

  // File uploads
  studentFileName: string = '';
  professionalFileName: string = '';
  studentFile: File | null = null;
  professionalFile: File | null = null;

  // Password visibility
  showPassword: boolean = false;
  passwordStrength: 'weak' | 'medium' | 'strong' | '' = '';

  // Modals
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  showValidationModal: boolean = false;
  errorMessage: string = '';
  validationMessage: string = '';
  isSubmitting: boolean = false;

  // Validation tracking
  formSubmitted: boolean = false;
  step2Submitted: boolean = false;
  step3Submitted: boolean = false;

  // API URL - ajustez selon votre configuration
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private authService : AuthServiceService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.updateProgressWidth();
  }

  /**
   * Initialize all forms with validators
   */
  initializeForms(): void {
    // Information Form
    this.infoForm = this.fb.group({
      // Common fields
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      telephone: [''],
      
      // Professional/Institution fields
      fonctionResponsable: [''],
      nomEtablissement: [''],
      adresse: [''],
      
      // Student fields
      universite: [''],
      specialite: [''],
      niveauEtude: ['']
    });

    // Verification Form
    this.verificationForm = this.fb.group({
      // Professional fields
      numeroOrdreProfessionnel: [''],
      numeroImmatriculation: [''],
      
      // Student fields
      numeroInscription: ['']
    });

    // Watch password changes for strength indicator
    this.infoForm.get('motDePasse')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password);
      this.checkPasswordsMatch();
    });

    // Watch confirm password changes
    this.infoForm.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.checkPasswordsMatch();
    });
  }

  /**
   * Check if passwords match
   */
  checkPasswordsMatch(): void {
    const password = this.infoForm.get('motDePasse')?.value;
    const confirmPassword = this.infoForm.get('confirmPassword')?.value;
    
    if (confirmPassword && password !== confirmPassword) {
      this.infoForm.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else if (confirmPassword && password === confirmPassword) {
      this.infoForm.get('confirmPassword')?.setErrors(null);
    }
  }

  /**
   * Update password strength indicator
   */
  updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = '';
      return;
    }

    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      this.passwordStrength = 'weak';
    } else if (strength <= 4) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  /**
   * Toggle password visibility
   */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Select account type (student or professional)
   */
  selectAccountType(type: 'etudiant' | 'professionnel'): void {
    this.selectedAccountType = type;
    this.professionalType = null; // Reset professional type when changing account type
    this.updateFormValidators();
  }

  /**
   * Update form validators based on selected account type
   */
  updateFormValidators(): void {
    // Reset all optional validators
    this.infoForm.get('fonctionResponsable')?.clearValidators();
    this.infoForm.get('nomEtablissement')?.clearValidators();
    this.infoForm.get('telephone')?.clearValidators();
    this.infoForm.get('adresse')?.clearValidators();
    this.infoForm.get('universite')?.clearValidators();
    this.infoForm.get('specialite')?.clearValidators();
    this.infoForm.get('niveauEtude')?.clearValidators();

    if (this.selectedAccountType === 'professionnel') {
      this.infoForm.get('fonctionResponsable')?.setValidators([Validators.required]);
      this.infoForm.get('nomEtablissement')?.setValidators([Validators.required]);
      this.infoForm.get('telephone')?.setValidators([Validators.required]);
      this.infoForm.get('adresse')?.setValidators([Validators.required]);
    } else if (this.selectedAccountType === 'etudiant') {
      this.infoForm.get('universite')?.setValidators([Validators.required]);
      this.infoForm.get('specialite')?.setValidators([Validators.required]);
      this.infoForm.get('niveauEtude')?.setValidators([Validators.required]);
    }

    // Update validity
    Object.keys(this.infoForm.controls).forEach(key => {
      this.infoForm.get(key)?.updateValueAndValidity();
    });
  }

  /**
   * Update verification form validators
   */
  updateVerificationValidators(): void {
    this.verificationForm.get('numeroOrdreProfessionnel')?.clearValidators();
    this.verificationForm.get('numeroImmatriculation')?.clearValidators();
    this.verificationForm.get('numeroInscription')?.clearValidators();

    if (this.selectedAccountType === 'professionnel') {
      if (this.professionalType === 'professionnel') {
        this.verificationForm.get('numeroOrdreProfessionnel')?.setValidators([Validators.required]);
      } else if (this.professionalType === 'institution') {
        this.verificationForm.get('numeroImmatriculation')?.setValidators([Validators.required]);
      }
    } else if (this.selectedAccountType === 'etudiant') {
      this.verificationForm.get('numeroInscription')?.setValidators([Validators.required]);
    }

    // Update validity
    Object.keys(this.verificationForm.controls).forEach(key => {
      this.verificationForm.get(key)?.updateValueAndValidity();
    });
  }

  /**
   * Get missing fields for step 2
   */
  getMissingFieldsStep2(): string[] {
    const missingFields: string[] = [];
    
    const prenomControl = this.infoForm.get('prenom');
    const nomControl = this.infoForm.get('nom');
    const emailControl = this.infoForm.get('email');
    const passwordControl = this.infoForm.get('motDePasse');
    const confirmPasswordControl = this.infoForm.get('confirmPassword');
    
    if (!prenomControl?.value || prenomControl.invalid) {
      missingFields.push('Prénom');
    }
    if (!nomControl?.value || nomControl.invalid) {
      missingFields.push('Nom');
    }
    if (!emailControl?.value) {
      missingFields.push('Email');
    } else if (emailControl.hasError('email')) {
      missingFields.push('Email valide');
    }
    if (!passwordControl?.value) {
      missingFields.push('Mot de passe');
    } else if (passwordControl.hasError('minlength')) {
      missingFields.push('Mot de passe (minimum 8 caractères)');
    }
    if (!confirmPasswordControl?.value) {
      missingFields.push('Confirmation du mot de passe');
    } else if (confirmPasswordControl.hasError('passwordMismatch')) {
      missingFields.push('Les mots de passe doivent correspondre');
    }

    if (this.selectedAccountType === 'professionnel') {
      if (!this.professionalType) {
        missingFields.push('Type de compte professionnel');
      }
      if (!this.infoForm.get('fonctionResponsable')?.value) {
        missingFields.push('Fonction');
      }
      if (!this.infoForm.get('nomEtablissement')?.value) {
        missingFields.push('Nom de l\'établissement');
      }
      if (!this.infoForm.get('telephone')?.value) {
        missingFields.push('Téléphone');
      }
      if (!this.infoForm.get('adresse')?.value) {
        missingFields.push('Adresse');
      }
    } else if (this.selectedAccountType === 'etudiant') {
      if (!this.infoForm.get('universite')?.value) {
        missingFields.push('Établissement');
      }
      if (!this.infoForm.get('specialite')?.value) {
        missingFields.push('Spécialité');
      }
      if (!this.infoForm.get('niveauEtude')?.value) {
        missingFields.push('Niveau d\'étude');
      }
    }

    return missingFields;
  }

  /**
   * Get missing fields for step 3
   */
  getMissingFieldsStep3(): string[] {
    const missingFields: string[] = [];

    if (this.selectedAccountType === 'professionnel') {
      if (this.professionalType === 'professionnel') {
        if (!this.verificationForm.get('numeroOrdreProfessionnel')?.value) {
          missingFields.push('Numéro d\'ordre professionnel');
        }
      } else if (this.professionalType === 'institution') {
        if (!this.verificationForm.get('numeroImmatriculation')?.value) {
          missingFields.push('Numéro d\'immatriculation');
        }
      }
      if (!this.professionalFile) {
        missingFields.push('Document justificatif');
      }
    } else if (this.selectedAccountType === 'etudiant') {
      if (!this.verificationForm.get('numeroInscription')?.value) {
        missingFields.push('Numéro d\'inscription universitaire');
      }
      if (!this.studentFile) {
        missingFields.push('Carte étudiant');
      }
    }

    return missingFields;
  }

  /**
   * Show validation popup
   */
  showValidationError(missingFields: string[]): void {
    if (missingFields.length === 1) {
      this.validationMessage = `Veuillez remplir le champ manquant : ${missingFields[0]}`;
    } else {
      this.validationMessage = `Veuillez remplir les champs manquants :\n• ${missingFields.join('\n• ')}`;
    }
    this.showValidationModal = true;
  }

  /**
   * Close validation modal
   */
  closeValidationModal(): void {
    this.showValidationModal = false;
    this.validationMessage = '';
  }

  /**
   * Navigate to next step
   */
  nextStep(): void {
    if (this.currentStep === 1) {
      if (!this.selectedAccountType) {
        this.showValidationError(['Type de compte']);
        return;
      }
      this.currentStep++;
      this.updateProgressWidth();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (this.currentStep === 2) {
      this.step2Submitted = true;
      const missingFields = this.getMissingFieldsStep2();
      
      if (missingFields.length > 0) {
        this.markFormGroupTouched(this.infoForm);
        this.showValidationError(missingFields);
        return;
      }

      this.currentStep++;
      this.updateProgressWidth();
      this.updateVerificationValidators();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  }

  /**
   * Navigate to previous step
   */
  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgressWidth();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Update progress bar width
   */
  updateProgressWidth(): void {
    this.progressWidth = ((this.currentStep - 1) / 2) * 100;
  }

  /**
   * Mark all fields in a form group as touched
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      control?.markAsDirty();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if a field has error and should show error message
   */
  hasError(fieldName: string, formGroup: FormGroup = this.infoForm): boolean {
    const field = formGroup.get(fieldName);
    
    if (!field) {
      return false;
    }

    // For step 2
    if (formGroup === this.infoForm) {
      return field.invalid && (field.touched || field.dirty || this.step2Submitted);
    }
    
    // For step 3
    if (formGroup === this.verificationForm) {
      return field.invalid && (field.touched || field.dirty || this.step3Submitted);
    }

    return false;
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(fieldName: string, formGroup: FormGroup = this.infoForm): string {
    const field = formGroup.get(fieldName);
    
    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return 'Ce champ est requis';
    }
    if (field.errors['email']) {
      return 'Email invalide';
    }
    if (field.errors['minlength']) {
      const requiredLength = field.errors['minlength'].requiredLength;
      return `Minimum ${requiredLength} caractères`;
    }
    if (field.errors['passwordMismatch']) {
      return 'Les mots de passe ne correspondent pas';
    }

    return 'Champ invalide';
  }

  /**
   * Check if passwords match for display
   */
  get passwordsDoNotMatch(): boolean {
    const confirmPassword = this.infoForm.get('confirmPassword');
    return !!(confirmPassword && confirmPassword.hasError('passwordMismatch') && 
             (confirmPassword.touched || confirmPassword.dirty || this.step2Submitted));
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event, type: 'student' | 'professional'): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.showError('Le fichier est trop volumineux. Taille maximale : 5MB');
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.showError('Format de fichier non supporté. Utilisez PDF, JPG ou PNG');
        return;
      }

      if (type === 'student') {
        this.studentFile = file;
        this.studentFileName = file.name;
      } else {
        this.professionalFile = file;
        this.professionalFileName = file.name;
      }
    }
  }

  /**
   * Remove selected file
   */
  removeFile(type: 'student' | 'professional'): void {
    if (type === 'student') {
      this.studentFile = null;
      this.studentFileName = '';
    } else {
      this.professionalFile = null;
      this.professionalFileName = '';
    }
  }

  /**
   * Submit the complete form
   */
  submitForm(): void {
    this.step3Submitted = true;
    const missingFields = this.getMissingFieldsStep3();

    if (missingFields.length > 0) {
      this.markFormGroupTouched(this.verificationForm);
      this.showValidationError(missingFields);
      return;
    }

    this.isSubmitting = true;
    const formData = this.prepareFormData();

    this.authService.register(formData).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.showSuccessModal = true;
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Signup error:', error);
        this.showError(error.error?.message || 'Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }

  /**
   * Prepare form data for submission
   */
  prepareFormData(): FormData {
    const formData = new FormData();

    // Common fields
    formData.append('role', this.selectedAccountType || '');
    formData.append('prenom', this.infoForm.get('prenom')?.value);
    formData.append('nom', this.infoForm.get('nom')?.value);
    formData.append('email', this.infoForm.get('email')?.value);
    formData.append('motDePasse', this.infoForm.get('motDePasse')?.value);
    formData.append('confirmPassword', this.infoForm.get('confirmPassword')?.value);

    if (this.selectedAccountType === 'professionnel') {
      formData.append('typeProfessionnel', this.professionalType || '');
      formData.append('fonctionResponsable', this.infoForm.get('fonctionResponsable')?.value);
      formData.append('nomEtablissement', this.infoForm.get('nomEtablissement')?.value);
      formData.append('telephone', this.infoForm.get('telephone')?.value);
      formData.append('adresse', this.infoForm.get('adresse')?.value);

      if (this.professionalType === 'professionnel') {
        formData.append('numeroOrdreProfessionnel', 
          this.verificationForm.get('numeroOrdreProfessionnel')?.value);
      } else if (this.professionalType === 'institution') {
        formData.append('numeroImmatriculation', 
          this.verificationForm.get('numeroImmatriculation')?.value);
      }

      if (this.professionalFile) {
        formData.append('documentVerification', this.professionalFile);
      }
    } else if (this.selectedAccountType === 'etudiant') {
      const telephone = this.infoForm.get('telephone')?.value;
      if (telephone) {
        formData.append('telephone', telephone);
      }
      formData.append('universite', this.infoForm.get('universite')?.value);
      formData.append('specialite', this.infoForm.get('specialite')?.value);
      formData.append('niveauEtude', this.infoForm.get('niveauEtude')?.value);
      formData.append('numeroInscription', 
      this.verificationForm.get('numeroInscription')?.value);

      if (this.studentFile) {
        formData.append('documentVerification', this.studentFile);
      }
    }

    return formData;
  }

  /**
   * Show error message
   */
  showError(message: string): void {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  /**
   * Close error modal
   */
  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorMessage = '';
  }

  /**
   * Close success modal and redirect to login
   */
  closeModal(): void {
    this.showSuccessModal = false;
    setTimeout(() => {
      this.router.navigate(['/signin']);
    }, 500);
  }
}