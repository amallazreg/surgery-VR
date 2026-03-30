import { Component, OnInit } from '@angular/core';
import { SideBar } from '../side-bar/side-bar';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  institution: string;
  sector: 'public' | 'private' | 'ngo';
  language: 'fr' | 'ar' | 'en';
  location: string;
  memberSince: string;
}
 
export interface SecurityInfo {
  passwordDaysAgo: number;
  twoFAEnabled: boolean;
  emailVerified: boolean;
  activeSessions: number;
  lastLogin: string;
}
 
export interface Notification {
  icon: string;
  label: string;
  sub: string;
  enabled: boolean;
}
 
export interface PlanUsage {
  icon: string;
  label: string;
  current: number | string;
  max: number | string;
  percent: number;
}
 
export interface Plan {
  name: string;
  expiryDate: string;
  price: number;
  usages: PlanUsage[];
}
 
export interface Invoice {
  date: string;
  description: string;
  amount: number;
  status: string;
  id: string;
}
 
export interface PaymentCard {
  last4: string;
  holder: string;
  expiry: string;
}


@Component({
  selector: 'app-mon-compte',
  standalone : true,
  imports: [SideBar,CommonModule,ReactiveFormsModule,FormsModule ],
  templateUrl: './mon-compte.html',
  styleUrl: './mon-compte.css',
})
export class MonCompte implements OnInit {
 
  editMode = false;
  profileForm!: FormGroup;
    userName: string = '';
 userEmail : string = ''
  userInitials: string = '';
  userPlan: string = '';

  user: UserProfile = {
    firstName: 'Anis',
    lastName: 'Boussaid',
    email: 'a.boussaid@inc.tn',
    phone: '+216 71 845 122',
    jobTitle: 'Responsable Études',
    institution: 'Institut National de la Consommation (INC)',
    sector: 'public',
    language: 'fr',
    location: 'Tunis, Tunisie',
    memberSince: 'Jan 2025'
  };
 
  get initials(): string {
    return `${this.user.firstName[0]}${this.user.lastName[0]}`.toUpperCase();
  }
 
  security: SecurityInfo = {
    passwordDaysAgo: 42,
    twoFAEnabled: true,
    emailVerified: true,
    activeSessions: 2,
    lastLogin: "aujourd'hui 09:14"
  };
 
  notifications: Notification[] = [
    { icon: '🥽', label: "Résultats d'enquête",    sub: 'Alertes en temps réel',         enabled: true  },
    { icon: '💳', label: 'Renouvellement forfait',  sub: '7 jours avant expiration',       enabled: true  },
    { icon: '📱', label: 'Nouvelles versions APK',  sub: 'Mises à jour disponibles',       enabled: false }
  ];
 
  plan: Plan = {
    name: 'Forfait Pro',
    expiryDate: '28 Mars 2026',
    price: 89,
    usages: [
      { icon: '🥽', label: 'Enquêtes VR actives',  current: 3,     max: 5,       percent: 60 },
      { icon: '👥', label: 'Répondants ce mois',    current: 342,   max: 500,     percent: 68 },
      { icon: '☁️', label: 'Stockage cloud',        current: '2.1', max: '5 Go',  percent: 42 },
      { icon: '📱', label: 'APK inclus',            current: 3,     max: 5,       percent: 60 }
    ]
  };
 
  invoices: Invoice[] = [
    { id: 'INV-026', date: '28 Fév 2026', description: 'Forfait Pro — Mars 2026',    amount: 89, status: 'Payée' },
    { id: 'INV-025', date: '28 Jan 2026', description: 'Forfait Pro — Fév 2026',     amount: 89, status: 'Payée' },
    { id: 'INV-024', date: '28 Déc 2025', description: 'Forfait Pro — Jan 2026',     amount: 89, status: 'Payée' },
    { id: 'INV-023', date: '28 Nov 2025', description: 'Forfait Starter — Déc 2025', amount: 49, status: 'Payée' },
    { id: 'INV-022', date: '28 Oct 2025', description: 'Forfait Starter — Nov 2025', amount: 49, status: 'Payée' }
  ];
 
  paymentCard: PaymentCard = {
    last4: '4821',
    holder: 'ANIS BOUSSAID',
    expiry: '08 / 28'
  };
 
  constructor(private fb: FormBuilder) {}
 
  ngOnInit(): void {
      const userId = localStorage.getItem('userId');
  const nom = localStorage.getItem('nom') || '';
  const prenom = localStorage.getItem('prenom') || '';
  const email = localStorage.getItem('email') || '';



  this.userName = `${prenom} ${nom}`.trim() || email || 'Utilisateur';
  this.userEmail = email
  const parts = this.userName.split(' ').filter(p => p.length > 0);
  this.userInitials = parts.map((p: string) => p[0].toUpperCase()).slice(0, 2).join('');
    this.initForm();
  }
 
  private initForm(): void {
    this.profileForm = this.fb.group({
      firstName:   [this.user.firstName,   Validators.required],
      lastName:    [this.user.lastName,    Validators.required],
      email:       [this.user.email,       [Validators.required, Validators.email]],
      phone:       [this.user.phone],
      jobTitle:    [this.user.jobTitle],
      institution: [{ value: this.user.institution, disabled: true }],
      sector:      [this.user.sector],
      language:    [this.user.language]
    });
 
    // Start with form disabled
    this.profileForm.disable();
  }
 
  toggleEdit(): void {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.profileForm.enable();
      this.profileForm.get('institution')?.disable();
    } else {
      this.cancelEdit();
    }
  }
 
  saveProfile(): void {
    if (this.profileForm.invalid) return;
 
    const values = this.profileForm.getRawValue();
    this.user = { ...this.user, ...values };
    this.editMode = false;
    this.profileForm.disable();
 
    // TODO: call AccountService.updateProfile(this.user)
    console.log('Profil mis à jour :', this.user);
  }
 
  cancelEdit(): void {
    this.editMode = false;
    this.profileForm.patchValue(this.user);
    this.profileForm.disable();
  }
 
  toggleNotification(notif: Notification): void {
    notif.enabled = !notif.enabled;
    // TODO: call NotificationService.update(notif)
  }
 
  changePassword(): void {
    // TODO: open password change modal / navigate to route
    console.log('Changer le mot de passe');
  }
 
  manageSessions(): void {
    // TODO: open sessions management modal
    console.log('Gérer les sessions');
  }
 
  viewActivityLog(): void {
    // TODO: navigate to activity log page
    console.log('Voir le journal');
  }
 
  upgradeToEnterprise(): void {
    // TODO: navigate to upgrade page / open upgrade modal
    console.log('Passer à Enterprise');
  }
 
  downloadInvoice(invoice: Invoice): void {
    // TODO: call InvoiceService.download(invoice.id)
    console.log('Télécharger facture :', invoice.id);
  }
 
  addPaymentMethod(): void {
    // TODO: open payment method modal
    console.log('Ajouter une méthode de paiement');
  }
 
  replaceCard(): void {
    // TODO: open replace card modal
    console.log('Remplacer la carte');
  }
 
  removeCard(): void {
    // TODO: confirm then call PaymentService.removeCard()
    console.log('Supprimer la carte');
  }
 
  exportData(): void {
    // TODO: call AccountService.exportData() → trigger download
    console.log('Exporter les données');
  }
 
  cancelSubscription(): void {
    // TODO: open confirmation dialog, then call SubscriptionService.cancel()
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir résilier votre abonnement ? Il restera actif jusqu'au ${this.plan.expiryDate}.`
    );
    if (confirmed) {
      console.log('Abonnement résilié');
    }
  }
 
  deleteAccount(): void {
    // TODO: open a strongly-worded confirmation dialog, then call AccountService.delete()
    const confirmed = window.confirm(
      'ATTENTION : Cette action est irréversible. Toutes vos données seront supprimées définitivement. Confirmez-vous ?'
    );
    if (confirmed) {
      console.log('Compte supprimé');
    }
  }
}