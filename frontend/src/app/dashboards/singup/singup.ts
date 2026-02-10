import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Navbar } from "../../layout/navbar/navbar";

@Component({
  selector: 'app-singup',
  standalone : true ,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Navbar],
  templateUrl: './singup.html',
  styleUrl: './singup.css',
})
export class Singup implements OnInit {
  // Step management
  currentStep: number = 1;
  progressWidth: number = 0;

  // Account type selection
  selectedAccountType: 'student' | 'professional' | null = null;
  professionalType: 'health_professional' | 'institution' | null = null;

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

  // Modal
  showSuccessModal: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.updateProgressWidth();
  }

  /**
   * Initialize all forms with validators
   */
  initializeForms(): void {
    // Information Form - Dynamic validators based on account type
    this.infoForm = this.fb.group({
      // Common fields
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      
      // Professional/Institution fields
      position: [''],
      establishment: [''],
      phone: [''],
      address: [''],
      
      // Student fields
      university: [''],
      specialty: [''],
      studyLevel: ['']
    }, { validators: this.passwordMatchValidator });

    // Verification Form
    this.verificationForm = this.fb.group({
      // Professional fields
      professionalOrderNumber: [''],
      registrationNumber: [''],
      
      // Student fields
      studentNumber: ['']
    });

    // Watch password changes for strength indicator
    this.infoForm.get('password')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password);
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
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
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety checks
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
  selectAccountType(type: 'student' | 'professional'): void {
    this.selectedAccountType = type;
    this.updateFormValidators();
  }

  /**
   * Update form validators based on selected account type
   */
  updateFormValidators(): void {
    // Reset all optional validators
    this.infoForm.get('position')?.clearValidators();
    this.infoForm.get('establishment')?.clearValidators();
    this.infoForm.get('phone')?.clearValidators();
    this.infoForm.get('address')?.clearValidators();
    this.infoForm.get('university')?.clearValidators();
    this.infoForm.get('specialty')?.clearValidators();
    this.infoForm.get('studyLevel')?.clearValidators();

    this.verificationForm.get('professionalOrderNumber')?.clearValidators();
    this.verificationForm.get('registrationNumber')?.clearValidators();
    this.verificationForm.get('studentNumber')?.clearValidators();

    if (this.selectedAccountType === 'professional') {
      // Professional/Institution required fields
      this.infoForm.get('position')?.setValidators([Validators.required]);
      this.infoForm.get('establishment')?.setValidators([Validators.required]);
      this.infoForm.get('phone')?.setValidators([Validators.required]);
      this.infoForm.get('address')?.setValidators([Validators.required]);
    } else if (this.selectedAccountType === 'student') {
      // Student required fields
      this.infoForm.get('university')?.setValidators([Validators.required]);
      this.infoForm.get('specialty')?.setValidators([Validators.required]);
      this.infoForm.get('studyLevel')?.setValidators([Validators.required]);
    }

    // Update form validity
    this.infoForm.updateValueAndValidity();
    this.verificationForm.updateValueAndValidity();
  }

  /**
   * Update verification form validators based on professional type
   */
  updateVerificationValidators(): void {
    this.verificationForm.get('professionalOrderNumber')?.clearValidators();
    this.verificationForm.get('registrationNumber')?.clearValidators();
    this.verificationForm.get('studentNumber')?.clearValidators();

    if (this.selectedAccountType === 'professional') {
      if (this.professionalType === 'health_professional') {
        this.verificationForm.get('professionalOrderNumber')?.setValidators([Validators.required]);
      } else if (this.professionalType === 'institution') {
        this.verificationForm.get('registrationNumber')?.setValidators([Validators.required]);
      }
    } else if (this.selectedAccountType === 'student') {
      this.verificationForm.get('studentNumber')?.setValidators([Validators.required]);
    }

    this.verificationForm.updateValueAndValidity();
  }

  /**
   * Navigate to next step
   */
  nextStep(): void {
    if (this.currentStep < 3) {
      // Validate current step before proceeding
      if (this.currentStep === 1 && !this.selectedAccountType) {
        return;
      }
      
      if (this.currentStep === 2 && this.infoForm.invalid) {
        this.markFormGroupTouched(this.infoForm);
        return;
      }

      this.currentStep++;
      this.updateProgressWidth();
      
      // Update verification validators when entering step 3
      if (this.currentStep === 3) {
        this.updateVerificationValidators();
      }

      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
   * Mark all fields in a form group as touched (for validation display)
   */
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event, type: 'student' | 'professional'): void {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('Le fichier est trop volumineux. Taille maximale : 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Format de fichier non supporté. Utilisez PDF, JPG ou PNG');
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
    // Validate verification form
    if (this.verificationForm.invalid) {
      this.markFormGroupTouched(this.verificationForm);
      return;
    }

    // Validate file upload
    if (this.selectedAccountType === 'student' && !this.studentFile) {
      alert('Veuillez télécharger votre carte étudiant');
      return;
    }
    
    if (this.selectedAccountType === 'professional' && !this.professionalFile) {
      alert('Veuillez télécharger votre document justificatif');
      return;
    }

    // Prepare form data
    const formData = this.prepareFormData();

    // Show loading state (optional)
    console.log('Submitting form data:', formData);

    // TODO: Send data to backend API
    // this.authService.signup(formData).subscribe(
    //   response => {
    //     this.showSuccessModal = true;
    //   },
    //   error => {
    //     console.error('Signup error:', error);
    //     alert('Une erreur est survenue. Veuillez réessayer.');
    //   }
    // );

    // For now, just show success modal
    this.showSuccessModal = true;
  }

  /**
   * Prepare form data for submission
   */
  prepareFormData(): FormData {
    const formData = new FormData();

    // Common fields
    formData.append('accountType', this.selectedAccountType || '');
    formData.append('firstName', this.infoForm.get('firstName')?.value);
    formData.append('lastName', this.infoForm.get('lastName')?.value);
    formData.append('email', this.infoForm.get('email')?.value);
    formData.append('password', this.infoForm.get('password')?.value);

    if (this.selectedAccountType === 'professional') {
      formData.append('professionalType', this.professionalType || '');
      formData.append('position', this.infoForm.get('position')?.value);
      formData.append('establishment', this.infoForm.get('establishment')?.value);
      formData.append('phone', this.infoForm.get('phone')?.value);
      formData.append('address', this.infoForm.get('address')?.value);

      if (this.professionalType === 'health_professional') {
        formData.append('professionalOrderNumber', 
          this.verificationForm.get('professionalOrderNumber')?.value);
      } else if (this.professionalType === 'institution') {
        formData.append('registrationNumber', 
          this.verificationForm.get('registrationNumber')?.value);
      }

      if (this.professionalFile) {
        formData.append('document', this.professionalFile);
      }
    } else if (this.selectedAccountType === 'student') {
      formData.append('phone', this.infoForm.get('phone')?.value || '');
      formData.append('university', this.infoForm.get('university')?.value);
      formData.append('specialty', this.infoForm.get('specialty')?.value);
      formData.append('studyLevel', this.infoForm.get('studyLevel')?.value);
      formData.append('studentNumber', 
        this.verificationForm.get('studentNumber')?.value);

      if (this.studentFile) {
        formData.append('studentCard', this.studentFile);
      }
    }

    return formData;
  }

  /**
   * Close success modal and redirect to login
   */
  closeModal(): void {
    this.showSuccessModal = false;
    // Redirect to login page after a short delay
    setTimeout(() => {
      this.router.navigate(['/signin']);
    }, 500);
  }

  /**
   * Get form control for template access
   */
  getControl(formGroup: FormGroup, controlName: string) {
    return formGroup.get(controlName);
  }

  /**
   * Check if field has error and is touched
   */
  hasError(formGroup: FormGroup, controlName: string, errorType?: string): boolean {
    const control = formGroup.get(controlName);
    if (!control) return false;

    if (errorType) {
      return control.hasError(errorType) && (control.dirty || control.touched);
    }
    return control.invalid && (control.dirty || control.touched);
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(formGroup: FormGroup, controlName: string): string {
    const control = formGroup.get(controlName);
    if (!control || !control.errors) return '';

    if (control.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (control.hasError('email')) {
      return 'Email invalide';
    }
    if (control.hasError('minlength')) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Minimum ${minLength} caractères requis`;
    }
    if (control.hasError('passwordMismatch')) {
      return 'Les mots de passe ne correspondent pas';
    }

    return 'Champ invalide';
  }
}
