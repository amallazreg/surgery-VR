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
import { Chatbot } from './clients/institution/chatbot/chatbot';
import { ForfaitManagment } from './admin/forfait-managment/forfait-managment';
import { ExperienceManagement } from './admin/experience-management/experience-management';
import { DashboardEtudiant } from './clients/Etudiants/dashboard-etudiant/dashboard-etudiant';
import { MesExperiencesVR } from './clients/Etudiants/mes-experiences-vr/mes-experiences-vr';
import { FormationManagement } from './clients/institution/formation-management/formation-management';
import { ForfaitEtudiant } from './clients/Etudiants/forfait-etudiant/forfait-etudiant';
import { MonCompte } from './clients/institution/mon-compte/mon-compte';

import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { MonCompteEtudiant } from './clients/Etudiants/mon-compte-etudiant/mon-compte-etudiant';
import { Statistiques } from './admin/statistiques/statistiques';

export const routes: Routes = [
      { path: 'landingPage', component: LandingPage },
      { path: '', redirectTo: 'landingPage', pathMatch: 'full' },
      { path: 'signin', component: Signin },
      { path: 'signup', component: Singup },
      { path: 'test', component : Test },
      { path: 'demanderDemo', component : Demo },
      { path: 'demanderDevis', component : Devis },


      {
      path: 'admin',
      canActivate: [authGuard, roleGuard],
      data: { roles: ['admin'] },
      children: [
      { path: 'dashboard',             component: AdminDashboard },
      { path: 'clients',               component: CompteClients },
      { path: 'demande-demo',          component: DemandeDemo },
      { path: 'demande-devis',         component: DemandeDevis },
      { path: 'forfaitManagement',     component: ForfaitManagment },
      { path: 'experienceManagement',  component: ExperienceManagement },
      { path: 'statistiques',  component: Statistiques },

      ]
      },


      {
      path: 'client',
      canActivate: [authGuard],
      children: [
      { path: 'dashborad',           component: Dashboard },
      { path: 'forfaits',            component: Forfaits },
      { path: 'abonnements',         component: Abonnements },
      { path: 'mesExperiences',      component: MesExperiences },
      { path: 'chatbot',             component: Chatbot },
      { path: 'formationManagement', component: FormationManagement },
      { path: 'monCompte',           component: MonCompte },
      ]
      },

      {
      path: 'etudiant',
      canActivate: [authGuard],
      children: [
      { path: 'dashborad',        component: DashboardEtudiant },
      { path: 'mesExperiencesVR', component: MesExperiencesVR },
      { path: 'forfaits',         component: ForfaitEtudiant },
      { path: 'monCompte',         component: MonCompteEtudiant },

      ]
      },


       { path: '**', redirectTo: '' }


];
