import { Routes } from '@angular/router';
import { LandingPage } from './dashboards/landing-page/landing-page';
import { Test } from './dashboards/test/test';
import { Signin } from './dashboards/signin/signin';
import { Demo } from './Demande/demo/demo';
import { AdminDashboard } from './admin/admin-dashboard/admin-dashboard';
import { Devis } from './Demande/devis/devis';
import { ExperienceSurMesure } from './Demande/experience-sur-mesure/experience-sur-mesure';
import { Singup } from './dashboards/singup/singup';
import { CompteClients } from './admin/compte-clients/compte-clients';

export const routes: Routes = [
      { path: 'landingPage', component: LandingPage },
      { path: '', redirectTo: 'landingPage', pathMatch: 'full' },
      { path: 'signin', component: Signin },
      { path: 'signup', component: Singup },
      { path: 'test', component : Test },
      { path: 'demanderDemo', component : Demo },
      {path: 'admin/dashboard', component: AdminDashboard},
      { path: 'demanderDevis', component : Devis },
      { path: 'demanderExperience', component : ExperienceSurMesure },

      { path: 'admin/clients', component : CompteClients },





];
