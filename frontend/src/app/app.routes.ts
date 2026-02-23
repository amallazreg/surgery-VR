import { Routes } from '@angular/router';
import { LandingPage } from './dashboards/landing-page/landing-page';
import { Test } from './dashboards/test/test';
import { Signin } from './dashboards/signin/signin';
import { Demo } from './Demande/demo/demo';
import { AdminDashboard } from './admin/admin-dashboard/admin-dashboard';
import { Devis } from './Demande/devis/devis';
import { Singup } from './dashboards/singup/singup';
import { CompteClients } from './admin/compte-clients/compte-clients';
import { DemandeDemo } from './admin/demande-demo/demande-demo';
import { DemandeDevis } from './admin/demande-devis/demande-devis';
import { Dashboard } from './clients/institution/dashboard/dashboard';
import { Forfaits } from './clients/institution/forfaits/forfaits';
import { Abonnements } from './clients/institution/abonnements/abonnements';
import { MesExperiences } from './clients/institution/mes-experiences/mes-experiences';

export const routes: Routes = [
      { path: 'landingPage', component: LandingPage },
      { path: '', redirectTo: 'landingPage', pathMatch: 'full' },
      { path: 'signin', component: Signin },
      { path: 'signup', component: Singup },
      { path: 'test', component : Test },
      { path: 'demanderDemo', component : Demo },
      {path: 'admin/dashboard', component: AdminDashboard},
      { path: 'demanderDevis', component : Devis },

      { path: 'admin/clients', component : CompteClients },
      {path : 'admin/demande-demo' , component : DemandeDemo} ,
      {path : 'admin/demande-devis' , component : DemandeDevis},


      {path : 'client/dashborad' , component : Dashboard},
      { path: 'client/forfaits', component: Forfaits },
      {path : 'client/abonnements', component : Abonnements},
      {path : 'client/mesExperiences', component : MesExperiences}, 

       { path: '**', redirectTo: '' }






];
