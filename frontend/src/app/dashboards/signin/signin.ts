import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from "../../layout/navbar/navbar";
import { AuthServiceService } from '../../services/auth-services';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-signin',
  standalone : true,
  imports: [CommonModule, FormsModule, Navbar,ReactiveFormsModule,RouterModule],
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
  
   loginForm!: FormGroup;
  errorMessage = '';
  loading = false;
  showErrorModal: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthServiceService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', Validators.required]
    });
  }
  showPassword = false;

togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
  const pwdInput = document.getElementById('login-password') as HTMLInputElement;
  pwdInput.type = this.showPassword ? 'text' : 'motDePasse';
}


  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.signinUser(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('Login success:', res);

        const role = res.user.role;


        // Sauvegarde token + role
        this.authService.saveToken(res.token);
        const userId = res.user?.id || res.id;
        localStorage.setItem('userId', userId);
        console.log(userId);
        this.authService.saveRole(role);

        // REDIRECTION SELON ROLE
        if (role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else if (role === 'professionnel') {
          this.router.navigate(['client/dashborad']);
        }

        this.loading = false;
      },
        error: (err) => {
      console.error(err);
      this.loading = false;

      if (err.error?.message === 'Compte non approuvé') {
        this.showError('Votre compte n\'est pas encore approuvé par l\'administrateur.');
      } else {
        this.showError(err.error?.message || 'Erreur de connexion');
      }
    }

    });
  }

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


}
