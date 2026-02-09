import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SocialAuthService, GoogleLoginProvider, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RoutePath } from '../../core/constant/api.constant';
import { AuthService } from '../../services/Auth-service/auth.service';
import { SessionService } from '../../services/Session-service/session.service';
import { ToastService } from '../../services/Toast-service/toast.service';
import { NotifierService } from '../../services/Notifier-service/notifier.service';
import { UserProfilesService } from '../../services/UserProfile-service/user-profile.service';
import { LoaderService } from '../../services/loader.service';
import { noSpaceAllowedValidator } from '../../validators/nospace-allowed-validators';
import { environment } from '../../../environments/environment';
import { CommonSpinner } from '../../shared/components/common-spinner/common-spinner';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, GoogleSigninButtonModule, CommonSpinner]
})
export class Login implements OnInit {
  // Dependency injection using modern inject()
  private readonly fb = inject(FormBuilder);
  private readonly loader = inject(LoaderService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly notifier = inject(NotifierService);
  private readonly session = inject(SessionService);
  private readonly userService = inject(UserProfilesService);
  private readonly socialAuth = inject(SocialAuthService);
  private readonly destroyRef = inject(DestroyRef);

  showPassword = false;
  isSubmitted = false;
  RoutePath = RoutePath;
  loginForm!: FormGroup;
  private currentGoogleUser: any = null;

  constructor() {
    this.initializeForm();
    this.setupGoogleAuth();
  }

  ngOnInit() {
    this.checkExistingAuth();
  }

  private initializeForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, noSpaceAllowedValidator()]],
      password: ['', [Validators.required, noSpaceAllowedValidator()]]
    });
  }

  private checkExistingAuth() {
    // Check if user is already authenticated but don't auto-navigate
    if (this.session.getToken()) {
      this.notifier.isAuthenticatedSubject.next(true);
    }
  }

  private setupGoogleAuth() {
    this.socialAuth.authState
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        if (user) {
          this.currentGoogleUser = user; // Store the current Google user
          this.handleGoogleLogin();
        }
      });
  }

  private handleGoogleLogin() {
    // Get Google user info from social auth service
    this.socialAuth.getAccessToken(GoogleLoginProvider.PROVIDER_ID).then(accessToken => {
      // Use the stored Google user info
      const googleUser = this.currentGoogleUser;
      console.log('👤 Google user info from social auth:', googleUser);
      
      const googleLoginPayload = {
        identifier: environment.applicationId,
        token: accessToken,
        attemptingFrom: "login"
      };
      
      this.loader.show();
      this.auth.loginWithGoogle(googleLoginPayload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
          console.log(' Google login API response:', res);
          const data = res;
          
          if (data.accessToken) {
            this.session.setToken(data.accessToken, 'google');
          }
          
          if (data.headers.statusCode == 200) {
            this.toast.showToast(res.headers.message || 'Google login successful!', 'success');
            
            const token = this.session.getToken();
            this.loader.hide();
            
            if (token) {
              this.notifier.isAuthenticatedSubject.next(true);
              
              // If we have Google user info, immediately notify with that data
              if (googleUser) {
                console.log('Sending Google user info to notifier:', googleUser);
                this.session.setUserData(googleUser); // Store in session for persistence
                this.notifier.notifyUserData(googleUser);
              }
              
              // Also load user profile from server (this might override with server data)
              this.loadUserProfile();
              this.navigateAfterLogin();
            }
          } else {
            this.toast.showToast(data.headers.message || 'Google login failed', "error");
            this.loader.hide();
          }
        },
        error: (err: any) => {
          const errorMsg = err !== null || err !== undefined ? err : 'Invalid login';
          this.toast.showToast(errorMsg, 'error');
          this.loader.hide();
        }
      });
    });
  }

  onSubmit() {
    this.isSubmitted = true;
    
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    const payload = {
      applicationId: environment.applicationId,
      email,
      password
    };

    this.loader.show();
    this.auth.loginUser(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.handleLoginSuccess(res),
        error: (err) => this.handleLoginError(err)
      });
  }

  private handleLoginSuccess(response: any) {
    this.loader.hide();
    // console.log('Response from login API:', response);
    if (response.headers.statusCode !== "200") {
      console.log('Response from login API:', response);
      this.toast.showToast(response.headers?.message || 'Login failed', 'error');
      return;
    }

    this.toast.showToast(response.headers.message, 'success');
    
    if (response.accessToken) {
      this.session.setToken(response.accessToken, 'email');
      this.notifier.isAuthenticatedSubject.next(true);
      this.loadUserProfile();
      this.navigateAfterLogin();
    }
  }

  private handleLoginError(error: any) {
    this.loader.hide();
    const message = error?.message || 'Login failed';
    this.toast.showToast(message, 'error');
  }

  private loadUserProfile() {
    this.userService.loadUserProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
        console.log(' User profile API response:', profile);
        if (profile?.[0]) {
          let profileData = profile[0];
          
          // For Google login, merge Google user info with server profile data
          if (this.session.getLoginMethod() === 'google') {
            const googleUser = this.currentGoogleUser;
            if (googleUser) {
              console.log('Merging Google user data with server profile data');
              profileData = {
                ...profileData,
                // Preserve Google user info if server doesn't have name data
                name: profileData.firstName ? undefined : googleUser.name,
                given_name: profileData.firstName ? undefined : googleUser.given_name,
                family_name: profileData.lastName ? undefined : googleUser.family_name,
                picture: profileData.profilePicUrl ? undefined : googleUser.photoUrl,
                email: profileData.email || googleUser.email
              };
            }
          }
          
          console.log(' Final profile data being sent to notifier:', profileData);
          this.session.setUserData(profileData); // Store in session for persistence
          this.notifier.notifyUserData(profileData);
        } else {
          console.warn(' No profile data found in API response');
          
          // For Google login, if no server profile, use Google user data
          if (this.session.getLoginMethod() === 'google') {
            const googleUser = this.currentGoogleUser;
            if (googleUser) {
              console.log(' Using Google user data as fallback:', googleUser);
              this.session.setUserData(googleUser); // Store in session for persistence
              this.notifier.notifyUserData(googleUser);
            }
          }
        }
      },
      error: (err) => {
        console.error(' Failed to load user profile:', err);
        
        // For Google login, if profile loading fails, use Google user data
        if (this.session.getLoginMethod() === 'google') {
          const googleUser = this.currentGoogleUser;
          if (googleUser) {
            console.log(' Using Google user data due to profile load error:', googleUser);
            this.session.setUserData(googleUser); // Store in session for persistence
            this.notifier.notifyUserData(googleUser);
          }
        }
      }
    });
  }

  private navigateAfterLogin() {
    const savedRoute = localStorage.getItem('routeUrl');
    if (savedRoute) {
      localStorage.removeItem('routeUrl');
      this.router.navigateByUrl(savedRoute);
    } else {
      this.router.navigateByUrl(RoutePath.HOME);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.isSubmitted));
  }
}