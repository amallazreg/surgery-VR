import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from "../../layout/navbar/navbar";

@Component({
  selector: 'app-experience-sur-mesure',
  standalone: true,
  imports: [Navbar, CommonModule, FormsModule],
  templateUrl: './experience-sur-mesure.html',
  styleUrl: './experience-sur-mesure.css',
})
export class ExperienceSurMesure implements OnInit {

  currentStep = 1;
  totalSteps = 6;

  charCount1 = 0;
  charCount2 = 0;

  // Form data model
  formData = {
    projectType: '',
    projectTitle: '',
    clinicalScenarios: '',
    learningObjectives: '',
    targetAudience: '',
    medicalFeatures: [] as string[],
    interactionLevel: '',
    realism: '',
    technicalFeatures: [] as string[],
    institutionName: '',
    firstName: '',
    lastName: '',
    position: '',
    email: '',
    phone: '',
    inspiration: '',
    constraints: '',
    timeline: '',
    additionalInfo: '',
    consent: false
  };

  showSuccessMessage = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.updateStepIndicators();
      this.updateProgressBar();
      this.updateNavigationButtons();
    }
  }

  // =====================
  // Navigation
  // =====================

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateUI();
      this.scrollToTop();
    }
  }

  nextStep() {
    if (this.validateStep(this.currentStep)) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.updateUI();
        this.scrollToTop();
      }
    } else {
      this.showValidationErrors();
    }
  }

  goToStep(step: number) {
    if (step <= this.currentStep || this.isStepCompleted(step - 1)) {
      this.currentStep = step;
      this.updateUI();
      this.scrollToTop();
    }
  }

  // =====================
  // UI Updates
  // =====================

  updateUI() {
    if (isPlatformBrowser(this.platformId)) {
      this.updateStepIndicators();
      this.updateProgressBar();
      this.updateNavigationButtons();
      this.updateStepVisibility();
    }
  }

  updateStepIndicators() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    setTimeout(() => {
      const indicators = document.querySelectorAll('.step-indicator');
      indicators.forEach((indicator, index) => {
        const stepNum = index + 1;
        indicator.classList.remove('active', 'completed');
        
        if (stepNum === this.currentStep) {
          indicator.classList.add('active');
        } else if (stepNum < this.currentStep) {
          indicator.classList.add('completed');
        }
      });
    });
  }

  updateProgressBar() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    setTimeout(() => {
      const progressFill = document.getElementById('progressFill');
      if (progressFill) {
        progressFill.style.width = this.progressPercent() + '%';
      }
    });
  }

  updateNavigationButtons() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    setTimeout(() => {
      const prevBtn = document.getElementById('prevBtn') as HTMLButtonElement;
      const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement;
      const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;

      if (prevBtn) {
        prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
      }

      if (nextBtn) {
        nextBtn.style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
      }

      if (submitBtn) {
        submitBtn.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';
      }
    });
  }

  updateStepVisibility() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    setTimeout(() => {
      const steps = document.querySelectorAll('.wizard-step');
      steps.forEach((step, index) => {
        const stepElement = step as HTMLElement;
        if (index + 1 === this.currentStep) {
          stepElement.classList.add('active');
          stepElement.style.display = 'block';
        } else {
          stepElement.classList.remove('active');
          stepElement.style.display = 'none';
        }
      });
    });
  }

  scrollToTop() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const wizardSection = document.querySelector('.wizard-section');
    if (wizardSection) {
      wizardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // =====================
  // Character counters
  // =====================

  onClinicalInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const value = target.value;
    this.charCount1 = Math.min(value.length, 2000);
    this.formData.clinicalScenarios = value.substring(0, 2000);
    
    if (isPlatformBrowser(this.platformId)) {
      const charCountElement = document.getElementById('charCount1');
      if (charCountElement) {
        charCountElement.textContent = this.charCount1.toString();
      }
    }
  }

  onAdditionalInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const value = target.value;
    this.charCount2 = Math.min(value.length, 1500);
    this.formData.additionalInfo = value.substring(0, 1500);
    
    if (isPlatformBrowser(this.platformId)) {
      const charCountElement = document.getElementById('charCount2');
      if (charCountElement) {
        charCountElement.textContent = this.charCount2.toString();
      }
    }
  }

  // =====================
  // Checkbox handling
  // =====================

  onMedicalFeatureChange(event: Event, value: string) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.formData.medicalFeatures.includes(value)) {
        this.formData.medicalFeatures.push(value);
      }
    } else {
      this.formData.medicalFeatures = this.formData.medicalFeatures.filter(f => f !== value);
    }
  }

  onTechnicalFeatureChange(event: Event, value: string) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.formData.technicalFeatures.includes(value)) {
        this.formData.technicalFeatures.push(value);
      }
    } else {
      this.formData.technicalFeatures = this.formData.technicalFeatures.filter(f => f !== value);
    }
  }

  // =====================
  // Validation
  // =====================

  validateStep(step: number): boolean {
    switch (step) {
      case 1:
        return this.formData.projectType !== '' && this.formData.projectTitle.trim() !== '';
      
      case 2:
        return this.formData.clinicalScenarios.trim() !== '' &&
               this.formData.learningObjectives.trim() !== '' &&
               this.formData.targetAudience !== '';
      
      case 3:
        return true; // Les checkboxes sont optionnelles
      
      case 4:
        return this.formData.interactionLevel !== '' && this.formData.realism !== '';
      
      case 5:
        return this.formData.institutionName.trim() !== '' &&
               this.formData.firstName.trim() !== '' &&
               this.formData.lastName.trim() !== '' &&
               this.formData.position.trim() !== '' &&
               this.formData.email.trim() !== '' &&
               this.validateEmail(this.formData.email) &&
               this.formData.phone.trim() !== '';
      
      case 6:
        return this.formData.timeline !== '' && this.formData.consent === true;
      
      default:
        return true;
    }
  }

  validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  showValidationErrors() {
    if (isPlatformBrowser(this.platformId)) {
      alert('Veuillez remplir tous les champs obligatoires avant de continuer.');
    }
  }

  // =====================
  // Submit
  // =====================

  onSubmit(event: Event) {
    event.preventDefault();
    
    if (this.validateStep(this.currentStep)) {
      console.log('Form submitted!', this.formData);
      
      // Envoyer les données au backend ici
      this.submitToBackend();
      
      // Afficher le message de succès
      this.showSuccessMessage = true;
      
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          const successMessage = document.getElementById('successMessage');
          const wizardForm = document.getElementById('customForm');
          
          if (successMessage && wizardForm) {
            wizardForm.style.display = 'none';
            successMessage.style.display = 'block';
            this.scrollToTop();
          }
        });
      }
    } else {
      this.showValidationErrors();
    }
  }

  submitToBackend() {
    // Implémente l'envoi au backend ici
    console.log('Données à envoyer:', this.formData);
  }

  // =====================
  // Helpers template
  // =====================

  isStepActive(step: number): boolean {
    return this.currentStep === step;
  }

  isStepCompleted(step: number): boolean {
    return this.currentStep > step;
  }

  progressPercent(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }
}