import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { routes } from './app/app.routes';
import { AuthService } from './app/services/Auth-service/auth.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './app/core/interceptors/auth.interceptor';
import { DatePipe } from '@angular/common';
import { environment } from './environments/environment';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatOptionModule } from '@angular/material/core';
import { GoogleMapsModule } from '@angular/google-maps';

import { RECAPTCHA_V3_SITE_KEY } from 'ng-recaptcha';
import { 
  SocialAuthServiceConfig, 
  GoogleLoginProvider, 
  SocialLoginModule,
  SOCIAL_AUTH_CONFIG
} from '@abacritt/angularx-social-login';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { RecaptchaV3Module } from 'ng-recaptcha';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContactService } from './app/services/Contact-service/contact.service';
import { ManagePropertyService } from './app/services/ManageProperty-service/manage-property.service';
import { NotifierService } from './app/services/Notifier-service/notifier.service';
import { PasswordManagementService } from './app/services/PasswordManagement-service/password-management.service';
import { SessionService } from './app/services/Session-service/session.service';
import { ToastService } from './app/services/Toast-service/toast.service';
import { UserProfilesService } from './app/services/UserProfile-service/user-profile.service';
import { UserService } from './app/services/User-service/user.service';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    importProvidersFrom(
      FormsModule,
      ReactiveFormsModule,
      MatChipsModule,
      MatFormFieldModule,
      MatIconModule,
      MatAutocompleteModule,
      MatTableModule,
      MatTooltipModule,
      MatOptionModule,
      GoogleMapsModule,
      SocialLoginModule,
      GoogleSigninButtonModule,
      RecaptchaV3Module,
      AuthService,
      ContactService,
      ManagePropertyService,
      NotifierService,
      PasswordManagementService,
      SessionService,
      ToastService,
      UserProfilesService,
      UserService
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.RECAPTCHA_V3_SITE_KEY
    },
    {
      provide: SOCIAL_AUTH_CONFIG,
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
        onError: (err: any) => {
          console.error('Social Auth Configuration Error:', err);
        }
      } as SocialAuthServiceConfig
    },
    AuthService
  ]
}).catch(err => console.error(err));
