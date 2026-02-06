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
  // Stepper
  currentStep: number = 1;
  progressWidth: number = 33.33;
  
  // Account type
  selectedAccountType: string | null = null;
  
  // Forms
  infoForm!: FormGroup;
  verificationForm!: FormGroup;
  
  // File uploads
  doctorFileName: string = '';
  studentFileName: string = '';
  doctorFile: File | null = null;
  studentFile: File | null = null;
  
  // Modal
  showSuccessModal: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForms();
  }

  /**
   * Initialize reactive forms
   */
  initializeForms(): void {
    // Info Form (Step 2) - will be dynamically validated based on account type
    this.infoForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      // Doctor specific fields
      specialty: [''],
      hospital: [''],
      city: [''],
      // Student specific fields
      university: [''],
      year: [''],
      supervisor: ['']
    });

    // Verification Form (Step 3)
    this.verificationForm = this.fb.group({
      orderNumber: [''], // For doctors
      objective: ['', Validators.required]
    });
  }

  /**
   * Select account type (Doctor or Student)
   */
  selectAccountType(type: string): void {
    this.selectedAccountType = type;
    this.updateFormValidators();
  }

  /**
   * Update form validators based on selected account type
   */
  updateFormValidators(): void {
    // Reset all validators first
    this.infoForm.get('specialty')?.clearValidators();
    this.infoForm.get('hospital')?.clearValidators();
    this.infoForm.get('city')?.clearValidators();
    this.infoForm.get('university')?.clearValidators();
    this.infoForm.get('year')?.clearValidators();
    this.verificationForm.get('orderNumber')?.clearValidators();

    if (this.selectedAccountType === 'doctor') {
      // Doctor validators
      this.infoForm.get('specialty')?.setValidators([Validators.required]);
      this.infoForm.get('hospital')?.setValidators([Validators.required]);
      this.infoForm.get('city')?.setValidators([Validators.required]);
      this.verificationForm.get('orderNumber')?.setValidators([Validators.required]);
    } else if (this.selectedAccountType === 'student') {
      // Student validators
      this.infoForm.get('university')?.setValidators([Validators.required]);
      this.infoForm.get('year')?.setValidators([Validators.required]);
    }

    // Update validity
    this.infoForm.updateValueAndValidity();
    this.verificationForm.updateValueAndValidity();
  }

  /**
   * Navigate to next step
   */
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
      this.updateProgress();
    }
  }

  /**
   * Navigate to previous step
   */
  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgress();
    }
  }

  /**
   * Update progress bar width
   */
  updateProgress(): void {
    this.progressWidth = (this.currentStep / 3) * 100;
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event, type: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (type === 'doctor') {
        this.doctorFile = file;
        this.doctorFileName = file.name;
      } else {
        this.studentFile = file;
        this.studentFileName = file.name;
      }
    }
  }

  /**
   * Submit the complete form
   */
  submitForm(): void {
    if (this.infoForm.invalid || this.verificationForm.invalid) {
      console.error('Form is invalid');
      return;
    }

    // Check file upload
    const selectedFile = this.selectedAccountType === 'doctor' ? this.doctorFile : this.studentFile;
    if (!selectedFile) {
      console.error('Document is required');
      return;
    }

    // Prepare form data
    const formData = this.prepareFormData();

    // TODO: Send data to backend API
    console.log('Form Data:', formData);
    console.log('File:', selectedFile);

    // Show success modal
    this.showSuccessModal = true;

    // Optionally: Call your service here
    // this.authService.signup(formData).subscribe(...)
  }

  /**
   * Prepare complete form data
   */
  prepareFormData(): any {
    const infoData = this.infoForm.value;
    const verificationData = this.verificationForm.value;

    const formData: any = {
      accountType: this.selectedAccountType,
      firstName: infoData.firstName,
      lastName: infoData.lastName,
      email: infoData.email,
      password: infoData.password,
      objective: verificationData.objective
    };

    if (this.selectedAccountType === 'doctor') {
      formData.specialty = infoData.specialty;
      formData.hospital = infoData.hospital;
      formData.city = infoData.city;
      formData.orderNumber = verificationData.orderNumber;
    } else {
      formData.university = infoData.university;
      formData.year = infoData.year;
      formData.supervisor = infoData.supervisor;
    }

    return formData;
  }

  /**
   * Close success modal
   */
  closeModal(): void {
    this.showSuccessModal = false;
    // Optionally redirect to login page
    // this.router.navigate(['/login']);
  }
}