import { Routes } from '@angular/router';
import { LandingPage } from './dashboards/landing-page/landing-page';
import { Test } from './dashboards/test/test';
import { Signin } from './dashboards/signin/signin';
import { Demo } from './Demande/demo/demo';
import { AdminDashboard } from './admin/admin-dashboard/admin-dashboard';
import { Devis } from './Demande/devis/devis';

export const routes: Routes = [
      { path: 'landingPage', component: LandingPage },
      { path: '', redirectTo: 'landingPage', pathMatch: 'full' },
      { path: 'signin', component: Signin },
      { path: 'test', component : Test },
      { path: 'demanderDemo', component : Demo },
      {path: 'admin/dashboard', component: AdminDashboard},
      { path: 'demanderDevi', component : Devis },





];
