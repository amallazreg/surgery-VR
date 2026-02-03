import { Routes } from '@angular/router';
import { LandingPage } from './dashboards/landing-page/landing-page';
import { Test } from './dashboards/test/test';
import { Signin } from './dashboards/signin/signin';

export const routes: Routes = [
      { path: 'landingPage', component: LandingPage },
      { path: '', redirectTo: 'landingPage', pathMatch: 'full' },
      { path: 'signin', component: Signin },
      { path: 'test', component : Test },



];
