import { Routes } from '@angular/router';
import { LandingPage } from './dashboards/landing-page/landing-page';

export const routes: Routes = [
      { path: 'landingPage', component: LandingPage },
      { path: '', redirectTo: 'landingPage', pathMatch: 'full' },

];
