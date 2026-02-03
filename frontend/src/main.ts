import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([]),   // ou tes routes existantes
    provideAnimations()  // ✅ AJOUT IMPORTANT
  ]
};
