import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from "../../layout/navbar/navbar";

@Component({
  selector: 'app-signin',
  standalone : true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './signin.html',
  styleUrl: './signin.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' }))
      ])
    ])
  ]
})
export class Signin  {
  
   activeTab: 'login' | 'register' = 'login';
  showPasswordLogin = false;
  showPasswordRegister = false;

  passwordStrength: 'weak' | 'medium' | 'strong' | '' = '';

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
  }

  togglePassword(type: 'login' | 'register') {
    if (type === 'login') {
      this.showPasswordLogin = !this.showPasswordLogin;
    } else {
      this.showPasswordRegister = !this.showPasswordRegister;
    }
  }

  updatePasswordStrength(password: string) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) this.passwordStrength = 'weak';
    else if (strength <= 4) this.passwordStrength = 'medium';
    else this.passwordStrength = 'strong';
  }

  handleLogin(form: any) {
    if (form.invalid) return;

    console.log('Login:', form.value);
    alert('Connexion réussie !');
  }

  handleRegister(form: any) {
    const { password, confirmPassword } = form.value;

    if (password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    alert('Inscription réussie !');
    this.switchTab('login');
  }

  loginWithGoogle() {
    alert('Connexion Google bientôt disponible');
  }

  loginWithMicrosoft() {
    alert('Connexion Microsoft bientôt disponible');
  }

  registerWithGoogle() {
    alert('Inscription Google bientôt disponible');
  }

  registerWithMicrosoft() {
    alert('Inscription Microsoft bientôt disponible');
  }
}
