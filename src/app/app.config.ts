import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { GoogleLoginProvider, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';
import { environment } from '../environments/environment';

registerLocaleData(en);

export const appConfig: ApplicationConfig = {
  providers: [                  
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideStore(), 
    provideNzI18n(en_US), 
    provideAnimationsAsync(), 
    provideHttpClient(),
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              environment.clientIdForGoogleLogin,
              {
                oneTapEnabled: false,
                prompt: 'select_account',
                scopes: 'profile email',
                plugin_name: 'jmr-properties'
              }
            )
          }
        ],
        onError: (err) => {
          console.error('Social auth error:', err);
        }
      } as SocialAuthServiceConfig,
    }
  ]
};
