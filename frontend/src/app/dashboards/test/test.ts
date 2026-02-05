import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormsModule, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from "../../layout/navbar/navbar";

interface FormData {
  establishment: {
    type: string;
    country: string;
    city: string;
  };
  domain: string;
  objectives: string[];
  contact: {
    institutionName: string;
    email: string;
    phone: string;
    contactName?: string;
    position?: string;
  };
  message?: string;
  newsletter: boolean;
  privacy: boolean;
}
@Component({
  selector: 'app-test',
  standalone : true,
  imports: [FormsModule, CommonModule, Navbar,ReactiveFormsModule],
  templateUrl: './test.html',
  styleUrl: './test.css',
})


export class Test implements OnInit {
  currentStep: number = 1;
  totalSteps: number = 5;
  demoForm!: FormGroup;
  showSuccessMessage: boolean = false;
  validationMessage: string = '';

  // Options pour les sélections
  establishmentTypes = [
    { value: '', label: 'Sélectionnez un type' },
    { value: 'hopital', label: 'Hôpital' },
    { value: 'clinique', label: 'Clinique' },
    { value: 'faculte', label: 'Faculté de Médecine' },
    { value: 'centre-formation', label: 'Centre de Formation' },
    { value: 'centre-simulation', label: 'Centre de Simulation' },
    { value: 'autre', label: 'Autre' }
  ];

  domains = [
    {
      value: 'chirurgie',
      icon: '🔪',
      title: 'Chirurgie',
      description: 'Formation aux procédures chirurgicales'
    },
    {
      value: 'urgences',
      icon: '🚑',
      title: 'Urgences',
      description: 'Gestion des situations critiques'
    },
    {
      value: 'formation-medicale',
      icon: '🎓',
      title: 'Formation Médicale',
      description: 'Enseignement et pédagogie'
    },
    {
      value: 'mixte',
      icon: '🔄',
      title: 'Mixte',
      description: 'Plusieurs domaines combinés'
    }
  ];

  objectives = [
    {
      value: 'reduire-erreurs',
      icon: '⚠️',
      title: 'Réduire les Erreurs Médicales',
      description: 'Minimiser les risques pour les patients'
    },
    {
      value: 'ameliorer-formation',
      icon: '📚',
      title: 'Améliorer la Formation Pratique',
      description: 'Renforcer les compétences techniques'
    },
    {
      value: 'gerer-stress',
      icon: '💪',
      title: 'Gérer le Stress et les Situations Critiques',
      description: 'Préparer aux urgences et cas complexes'
    },
    {
      value: 'standardiser-formation',
      icon: '📊',
      title: 'Standardiser la Formation',
      description: 'Uniformiser les pratiques et protocoles'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.demoForm = this.fb.group({
      // Step 1: Profil de l'établissement
      establishmentType: ['', Validators.required],
      country: ['', Validators.required],
      city: ['', Validators.required],

      // Step 2: Domaine d'intérêt
      domain: ['', Validators.required],

      // Step 3: Objectifs (FormArray pour checkboxes multiples)
      objectives: this.fb.array([], this.minSelectedCheckboxes(1)),

      // Step 4: Contact
      institutionName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      contactName: [''],
      position: [''],

      // Step 5: Message et consentements
      message: [''],
      newsletter: [false],
      privacy: [false, Validators.requiredTrue]
    });
  }

  // Validator personnalisé pour les checkboxes
// Validator personnalisé pour les checkboxes (corrigé)
minSelectedCheckboxes(min: number) {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const formArray = control as FormArray; // <-- cast vers FormArray
    const totalSelected = formArray.controls
      .map(ctrl => ctrl.value)
      .reduce((prev, next) => (next ? prev + 1 : prev), 0);

    return totalSelected >= min ? null : { required: true };
  };
}


  // Gestion des checkboxes pour les objectifs
  onObjectiveChange(objective: string, isChecked: boolean): void {
    const objectivesArray = this.demoForm.get('objectives') as FormArray;

    if (isChecked) {
      objectivesArray.push(this.fb.control(objective));
    } else {
      const index = objectivesArray.controls.findIndex(
        x => x.value === objective
      );
      objectivesArray.removeAt(index);
    }
  }

  isObjectiveSelected(objective: string): boolean {
    const objectivesArray = this.demoForm.get('objectives') as FormArray;
    return objectivesArray.controls.some(control => control.value === objective);
  }

  // Navigation entre les étapes
  nextStep(): void {
    if (!this.validateCurrentStep()) {
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.scrollToTop();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.validationMessage = '';
      this.scrollToTop();
    }
  }

  navigateToStep(step: number): void {
    // Permettre la navigation seulement vers les étapes précédentes ou l'étape actuelle
    if (step <= this.currentStep) {
      this.currentStep = step;
      this.validationMessage = '';
      this.scrollToTop();
    }
  }

  // Validation de l'étape actuelle
  validateCurrentStep(): boolean {
    this.validationMessage = '';
    let isValid = true;

    switch (this.currentStep) {
      case 1:
        const step1Fields = ['establishmentType', 'country', 'city'];
        step1Fields.forEach(field => {
          const control = this.demoForm.get(field);
          if (control) {
            control.markAsTouched();
            if (control.invalid) {
              isValid = false;
            }
          }
        });
        if (!isValid) {
          this.validationMessage = 'Veuillez remplir tous les champs obligatoires';
        }
        break;

      case 2:
        const domainControl = this.demoForm.get('domain');
        if (domainControl) {
          domainControl.markAsTouched();
          if (domainControl.invalid) {
            this.validationMessage = 'Veuillez sélectionner un domaine d\'intérêt';
            isValid = false;
          }
        }
        break;

      case 3:
        const objectivesControl = this.demoForm.get('objectives');
        if (objectivesControl) {
          objectivesControl.markAsTouched();
          if (objectivesControl.invalid) {
            this.validationMessage = 'Veuillez sélectionner au moins un objectif';
            isValid = false;
          }
        }
        break;

      case 4:
        const step4Fields = ['institutionName', 'email', 'phone'];
        step4Fields.forEach(field => {
          const control = this.demoForm.get(field);
          if (control) {
            control.markAsTouched();
            if (control.invalid) {
              isValid = false;
            }
          }
        });
        if (!isValid) {
          this.validationMessage = 'Veuillez remplir tous les champs obligatoires et vérifier le format de l\'email';
        }
        break;

      case 5:
        const privacyControl = this.demoForm.get('privacy');
        if (privacyControl) {
          privacyControl.markAsTouched();
          if (privacyControl.invalid) {
            this.validationMessage = 'Vous devez accepter la politique de confidentialité';
            isValid = false;
          }
        }
        break;
    }

    return isValid;
  }

  // Soumission du formulaire
  onSubmit(): void {
    if (!this.validateCurrentStep() || this.demoForm.invalid) {
      this.validationMessage = 'Veuillez corriger les erreurs avant de soumettre';
      return;
    }

    const formData: FormData = this.collectFormData();
    
    // Ici, vous pouvez envoyer les données à votre API
    console.log('Données du formulaire:', formData);
    
    // Simuler un appel API
    this.submitToAPI(formData);
  }

  collectFormData(): FormData {
    const formValue = this.demoForm.value;
    
    return {
      establishment: {
        type: formValue.establishmentType,
        country: formValue.country,
        city: formValue.city
      },
      domain: formValue.domain,
      objectives: formValue.objectives,
      contact: {
        institutionName: formValue.institutionName,
        email: formValue.email,
        phone: formValue.phone,
        contactName: formValue.contactName || undefined,
        position: formValue.position || undefined
      },
      message: formValue.message || undefined,
      newsletter: formValue.newsletter,
      privacy: formValue.privacy
    };
  }

  submitToAPI(data: FormData): void {
    // Simuler un délai d'API
    setTimeout(() => {
      this.showSuccessMessage = true;
      this.scrollToTop();
      
      // Optionnel: Réinitialiser le formulaire après succès
      // this.demoForm.reset();
      // this.currentStep = 1;
    }, 500);

    // Dans une vraie application:
    // this.demoService.submitDemoRequest(data).subscribe(
    //   response => {
    //     this.showSuccessMessage = true;
    //     this.scrollToTop();
    //   },
    //   error => {
    //     console.error('Erreur lors de la soumission:', error);
    //     this.validationMessage = 'Une erreur est survenue. Veuillez réessayer.';
    //   }
    // );
  }

  // Utilitaires
  get progressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  isStepCompleted(step: number): boolean {
    return step < this.currentStep;
  }

  isStepActive(step: number): boolean {
    return step === this.currentStep;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Vérifier si un champ a une erreur et a été touché
  hasError(fieldName: string): boolean {
    const field = this.demoForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Obtenir le message d'erreur pour un champ
  getErrorMessage(fieldName: string): string {
    const field = this.demoForm.get(fieldName);
    
    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return 'Ce champ est obligatoire';
    }

    if (field.errors['email']) {
      return 'Veuillez entrer une adresse email valide';
    }

    return '';
  }

  // Retour à l'accueil
  goHome(): void {
    this.router.navigate(['/']);
  }
}