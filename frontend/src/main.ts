import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // provideRouter([]),   // ou tes routes existantes
    provideRouter(routes),   // ou tes routes existantes
    provideAnimations()  // ✅ AJOUT IMPORTANT
  ]

  
};


