import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // La app no usa zone.js: el CD es zoneless. Se declara de forma explicita
    // porque en este modo la vista solo se refresca al escribir una signal que
    // el template lee, al disparar un evento o al llamar markForCheck().
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(),
    provideTranslateService({
      fallbackLang: 'es',
      lang: 'es',
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json',
      }),
    }),
  ],
};
