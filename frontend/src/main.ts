import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';



export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),   // ou tes routes existantes
    provideAnimations() ,
    provideHttpClient() 
  ]

  
};

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
