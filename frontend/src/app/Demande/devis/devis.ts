import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Navbar } from "../../layout/navbar/navbar";
import { DemandesService } from '../../services/demandes-service';

@Component({
  selector: 'app-devis',
  standalone : true , 
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './devis.html',
  styleUrl: './devis.css',
})
export class Devis implements OnInit {
  currentStep: number = 1;
  totalSteps: number = 5;
  showSuccessMessage: boolean = false;

  // Form data
formData = {
  institutionName: '',
  establishmentType: '',
  country: '',
  city: '',

  besoins: [] as string[],

  userCount: '',
  vrHeadsets: '',
  deploymentType: '',
  timeline: '',

  firstName: '',
  lastName: '',
  position: '',
  email: '',
  phone: '',

  budget: '',
  message: '',
  consent: false
};


  messageCharCount: number = 0;
  maxMessageLength: number = 1000;
  errorMsg: any;

  constructor(private demandeDevisService :  DemandesService) { }

  ngOnInit(): void {
    this.updateProgressBar();
  }

  // Navigation methods
  nextStep(): void {
    if (this.validateStep(this.currentStep)) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.updateProgressBar();
        this.scrollToTop();
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgressBar();
      this.scrollToTop();
    }
  }

  goToStep(step: number): void {
    // Validate all steps before the target step
    let canNavigate = true;
    for (let i = 1; i < step; i++) {
      if (!this.validateStep(i)) {
        canNavigate = false;
        break;
      }
    }
    
    if (canNavigate) {
      this.currentStep = step;
      this.updateProgressBar();
      this.scrollToTop();
    }
  }

  // Progress bar
  getProgressWidth(): string {
    return `${(this.currentStep / this.totalSteps) * 100}%`;
  }

  updateProgressBar(): void {
    // This will be handled by Angular binding
  }

  isStepActive(step: number): boolean {
    return this.currentStep === step;
  }

  isStepCompleted(step: number): boolean {
    return this.currentStep > step;
  }

  // Form validation
  validateStep(step: number): boolean {
    switch(step) {
      case 1:
        if (!this.formData.institutionName.trim()) {
          this.showError('Veuillez entrer le nom de votre établissement');
          return false;
        }
        if (!this.formData.establishmentType) {
          this.showError('Veuillez sélectionner un type d\'établissement');
          return false;
        }
        if (!this.formData.country.trim()) {
          this.showError('Veuillez entrer votre pays');
          return false;
        }
        if (!this.formData.city.trim()) {
          this.showError('Veuillez entrer votre ville');
          return false;
        }
        break;
        
      case 2:
        if (this.formData.besoins.length === 0) {
          this.showError('Veuillez sélectionner au moins un domaine de formation');
          return false;
        }
        break;
        
      case 3:
        if (!this.formData.userCount) {
          this.showError('Veuillez indiquer le nombre d\'utilisateurs prévus');
          return false;
        }
        if (!this.formData.vrHeadsets) {
          this.showError('Veuillez indiquer le nombre de casques VR souhaités');
          return false;
        }
        if (!this.formData.deploymentType) {
          this.showError('Veuillez sélectionner un type de déploiement');
          return false;
        }
        if (!this.formData.timeline) {
          this.showError('Veuillez indiquer le délai de mise en œuvre');
          return false;
        }
        break;
        
      case 4:
        if (!this.formData.firstName.trim()) {
          this.showError('Veuillez entrer votre prénom');
          return false;
        }
        if (!this.formData.lastName.trim()) {
          this.showError('Veuillez entrer votre nom');
          return false;
        }
        if (!this.formData.position.trim()) {
          this.showError('Veuillez entrer votre fonction');
          return false;
        }
        if (!this.formData.email.trim()) {
          this.showError('Veuillez entrer votre email');
          return false;
        }
        if (!this.isValidEmail(this.formData.email)) {
          this.showError('Veuillez entrer un email valide');
          return false;
        }
        if (!this.formData.phone.trim()) {
          this.showError('Veuillez entrer votre téléphone');
          return false;
        }
        break;
        
      case 5:
        if (!this.formData.consent) {
          this.showError('Veuillez accepter d\'être contacté pour recevoir votre devis');
          return false;
        }
        break;
    }
    
    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Solution checkbox handling
  toggleSolution(value: string, event: any): void {
    if (event.target.checked) {
      if (!this.formData.besoins.includes(value)) {
        this.formData.besoins.push(value);
      }
    } else {
      const index = this.formData.besoins.indexOf(value);
      if (index > -1) {
        this.formData.besoins.splice(index, 1);
      }
    }
  }

  isSolutionSelected(value: string): boolean {
    return this.formData.besoins.includes(value);
  }

  // Message character count
  onMessageInput(event: any): void {
    const text = event.target.value;
    this.messageCharCount = text.length;
    
    if (this.messageCharCount > this.maxMessageLength) {
      this.formData.message = text.substring(0, this.maxMessageLength);
      this.messageCharCount = this.maxMessageLength;
    }
  }

  // Form submission
submitForm() {
  const payload = {
    // Étape 1
    nomEtablissement: this.formData.institutionName,
    typeEtablissement: this.formData.establishmentType,
    pays: this.formData.country,
    ville: this.formData.city,

    // Étape 2
    besoins: this.formData.besoins,

    // Étape 3
    nombreUtilisateurs: this.formData.userCount,
    nombreCasquesVR: this.formData.vrHeadsets,
    typeDeploiement: this.formData.deploymentType,
    delaiMiseEnOeuvre: this.formData.timeline,

    // Étape 4
    prenom: this.formData.firstName,
    nom: this.formData.lastName,
    fonction: this.formData.position,
    emailProfessionnel: this.formData.email,
    telephone: this.formData.phone,

    // Étape 5
    budgetEstime: this.formData.budget,
    message: this.formData.message,
    consentement: this.formData.consent
  };

  this.demandeDevisService.envoyerDemandeDevis(payload).subscribe({
    next: (res) => {
      console.log('Demande de devis envoyée:', res);
      this.showSuccessMessage = true;
    },
    error: (err) => {
      console.error(err);
      this.errorMsg = "Erreur lors de l'envoi de la demande de devis.";
    }
  });
}


  // Error handling
  showError(message: string): void {
    // Create and show error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">${message}</span>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }

  // Utility methods
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Button visibility
  showPrevButton(): boolean {
    return this.currentStep > 1;
  }

  showNextButton(): boolean {
    return this.currentStep < this.totalSteps;
  }

  showSubmitButton(): boolean {
    return this.currentStep === this.totalSteps;
  }
}