import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from "../../layout/navbar/navbar";
import { Router } from '@angular/router';
import { DemandesService } from '../../services/demandes-service';

interface WizardStep {
  id: number;
  title: string;
  subtitle: string;
  isValid: boolean;
  isCompleted: boolean;
}

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [Navbar, FormsModule, CommonModule],
  templateUrl: './demo.html',
  styleUrls: ['./demo.css'],
})
export class Demo implements OnInit {
  
  // Variables pour le wizard
  currentStepIndex: number = 0;
  showSuccessMessage: boolean = false;
  errorMsg: string = '';
  messageCharCount: number = 0;
  maxMessageLength: number = 500;

  // Configuration des étapes
  steps: WizardStep[] = [
    {
      id: 1,
      title: 'Profil de votre Établissement',
      subtitle: 'Aidez-nous à mieux comprendre votre institution',
      isValid: false,
      isCompleted: false
    },
    {
      id: 2,
      title: 'Domaine Principal d\'Intérêt',
      subtitle: 'Sélectionnez le domaine qui vous intéresse le plus',
      isValid: false,
      isCompleted: false
    },
        {
      id: 3,
      title: 'Parlez-nous de vos Besoins',
      subtitle: 'Décrivez brièvement vos attentes et besoins spécifiques',
      isValid: false,
      isCompleted: false
    },

    {
      id: 4,
      title: 'Informations de Contact',
      subtitle: 'Comment pouvons-nous vous joindre ?',
      isValid: false,
      isCompleted: false
    },

  ];

  // Données du formulaire
  formData = {
    // Step 1
    establishmentType: '',
    country: '',
    city: '',
    
    // Step 2
    interest: '',
    
 // Step 3
    message: '',
    consent: false,
    
    // Step 4
    institutionName: '',
    email: '',
    phone: '',
    
   
  };

    isSubmitting: boolean = false;


  ngOnInit(): void {
    console.log('✅ Demo component initialized');
  }

  constructor(private router : Router,private demandeDemoService: DemandesService) {}

  // Obtenir l'étape actuelle
  get currentStep(): WizardStep {
    return this.steps[this.currentStepIndex];
  }

  // Obtenir le numéro de l'étape actuelle (1-based)
  get currentStepNumber(): number {
    return this.currentStepIndex + 1;
  }

  // Obtenir le nombre total d'étapes
  get totalSteps(): number {
    return this.steps.length;
  }

  // Calculer le pourcentage de progression
  get progressPercentage(): number {
    return ((this.currentStepIndex + 1) / this.totalSteps) * 100;
  }

  // Vérifier si c'est la première étape
  get isFirstStep(): boolean {
    return this.currentStepIndex === 0;
  }

  // Vérifier si c'est la dernière étape
  get isLastStep(): boolean {
    return this.currentStepIndex === this.totalSteps - 1;
  }

  // Aller à l'étape suivante
  goToNextStep(): void {
    console.log('🔄 Attempting to go to next step from:', this.currentStepNumber);
    
    if (this.validateCurrentStep()) {
      console.log('✅ Current step validated');
      
      this.steps[this.currentStepIndex].isCompleted = true;
      
      if (!this.isLastStep) {
        this.currentStepIndex++;
        console.log('➡️ Moved to step:', this.currentStepNumber);
        this.scrollToWizard();
      }
    } else {
      console.log('❌ Current step validation failed');
    }
  }

  // Aller à l'étape précédente
  goToPreviousStep(): void {
    console.log('🔄 Going to previous step from:', this.currentStepNumber);
    
    if (!this.isFirstStep) {
      this.currentStepIndex--;
      console.log('⬅️ Moved back to step:', this.currentStepNumber);
      this.scrollToWizard();
    }
  }

  // Valider l'étape actuelle
  validateCurrentStep(): boolean {
    const stepNumber = this.currentStepNumber;
    let isValid = true;
    let errorMessage = '';

    console.log('🔍 Validating step:', stepNumber);
    console.log('📋 Form data:', this.formData);

    switch (stepNumber) {
      case 1:
        // Validation Step 1: Profil
        if (!this.formData.establishmentType) {
          isValid = false;
          errorMessage = '⚠️ Veuillez sélectionner un type d\'établissement';
        } else if (!this.formData.country?.trim()) {
          isValid = false;
          errorMessage = '⚠️ Veuillez entrer votre pays';
        } else if (!this.formData.city?.trim()) {
          isValid = false;
          errorMessage = '⚠️ Veuillez entrer votre ville';
        }
        break;

      case 2:
        // Validation Step 2: Intérêt
        if (!this.formData.interest) {
          isValid = false;
          errorMessage = '⚠️ Veuillez sélectionner un domaine d\'intérêt';
        }
        break;

     case 3:
        // Validation Step 3: Message et consentement
        if (!this.formData.consent) {
          isValid = false;
          errorMessage = '⚠️ Veuillez accepter d\'être contacté pour continuer';
        }
        break;

      case 4:
        // Validation Step 4: Contact
        if (!this.formData.institutionName?.trim()) {
          isValid = false;
          errorMessage = '⚠️ Veuillez entrer le nom de votre institution';
        } else if (!this.formData.email?.trim()) {
          isValid = false;
          errorMessage = '⚠️ Veuillez entrer votre email';
        } else if (!this.isValidEmail(this.formData.email)) {
          isValid = false;
          errorMessage = '⚠️ Veuillez entrer un email valide';
        } else if (!this.formData.phone?.trim()) {
          isValid = false;
          errorMessage = '⚠️ Veuillez entrer votre numéro de téléphone';
        }
        break;

 
    }

    // Afficher l'erreur si la validation échoue
    if (!isValid) {
      this.displayError(errorMessage);
    }

    // Mettre à jour le statut de validation de l'étape
    this.steps[this.currentStepIndex].isValid = isValid;

    return isValid;
  }

  // Valider le format email
  isValidEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  // Afficher un message d'erreur
  displayError(message: string): void {
    this.errorMsg = message;
    
    // Masquer l'erreur après 5 secondes
    setTimeout(() => {
      this.errorMsg = '';
    }, 5000);

    console.log('❌ Error:', message);
  }




  // Mettre à jour le compteur de caractères du message
  onMessageInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.messageCharCount = textarea.value.length;
  }

  // Scroller vers la section wizard
  scrollToWizard(): void {
    setTimeout(() => {
      const wizardSection = document.querySelector('.wizard-section');
      if (wizardSection) {
        const offsetTop = (wizardSection as HTMLElement).offsetTop - 100;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }, 150);
  }

  // Soumettre le formulaire
onSubmitForm() {
  const payload = {
    typeEtablissement: this.formData.establishmentType,
    pays: this.formData.country,
    ville: this.formData.city,

    domaineInteret: this.formData.interest,


    nomInstitution: this.formData.institutionName,
    emailProfessionnel: this.formData.email,
    telephone: this.formData.phone,

    message: this.formData.message,
    consentement: this.formData.consent
  };

    this.isSubmitting = true;


  this.demandeDemoService.envoyerDemandeDemo(payload).subscribe({
    next: (res) => {
          this.isSubmitting = false;

      console.log('Demande envoyée:', res);
      this.showSuccessMessage = true;
    },
    error: (err) => {
          this.isSubmitting = false;

      console.error('Erreur envoi:', err);
      this.errorMsg = "Erreur lors de l'envoi de la demande.";
    }
  });
}



  // Vérifier si une étape est active
  isStepActive(stepIndex: number): boolean {
    return this.currentStepIndex === stepIndex;
  }

  // Vérifier si une étape est complétée
  isStepCompleted(stepIndex: number): boolean {
    return this.steps[stepIndex].isCompleted;
  }

    goToDemo() {
    console.log('click OK');

    this.router.navigate(['/demanderDemo']);
  }

  goToDevis(){
    this.router.navigate(['/demanderDevis'])
  }
}