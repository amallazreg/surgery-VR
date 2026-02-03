import { Routes } from '@angular/router';
import { LandingPage } from './dashboards/landing-page/landing-page';
import { Test } from './dashboards/test/test';

export const routes: Routes = [
      { path: 'landingPage', component: LandingPage },
      { path: 'test', component: Test },
      { path: '', redirectTo: 'landingPage', pathMatch: 'full' },

];
