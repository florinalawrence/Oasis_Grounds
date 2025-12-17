import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { SocialAuthService, GoogleLoginProvider, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';

import { RoutePath } from '../../core/constant/api.constant';
import { AuthService } from '../../services/Auth-service/auth.service';
import { SessionService } from '../../services/Session-service/session.service';
import { ToastService } from '../../services/Toast-service/toast.service';
import { NotifierService } from '../../services/Notifier-service/notifier.service';
import { UserProfilesService } from '../../services/UserProfile-service/user-profile.service';
import { noSpaceAllowedValidator } from '../../validators/nospace-allowed-validators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule, RouterLink, GoogleSigninButtonModule]
})
export class Login implements OnInit {
  showPassword = false;
  isSubmitted = false;
  RoutePath = RoutePath;
  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private router: Router,
    private auth: AuthService,
    private toast: ToastService,
    private notifier: NotifierService,
    private session: SessionService,
    private userService: UserProfilesService,
    private socialAuth: SocialAuthService
  ) {
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
    this.socialAuth.authState.subscribe(user => {
      if (user) {
        this.handleGoogleLogin();
      }
    });
  }

  private handleGoogleLogin() {
    this.socialAuth.getAccessToken(GoogleLoginProvider.PROVIDER_ID).then(accessToken => {
      const googleLoginPayload = {
        identifier: environment.applicationId,
        token: accessToken,
        attemptingFrom: "login"
      };
      
      this.spinner.show();
      this.auth.loginWithGoogle(googleLoginPayload).subscribe({
        next: (res) => {
          console.log('📥 Google login API response:', res);
          const data = res;
          
          if (data.accessToken) {
            this.session.setToken(data.accessToken, 'google');
          }
          
          if (data.headers.statusCode == 200) {
            this.toast.showToast(res.headers.message || 'Google login successful!', 'success');
            
            const token = this.session.getToken();
            this.spinner.hide();
            
            if (token) {
              this.notifier.isAuthenticatedSubject.next(true);
              this.loadUserProfile();
              this.navigateAfterLogin();
            }
          } else {
            this.toast.showToast(data.headers.message || 'Google login failed', "error");
            this.spinner.hide();
          }
        },
        error: (err: any) => {
          const errorMsg = err !== null || err !== undefined ? err : 'Invalid login';
          this.toast.showToast(errorMsg, 'error');
          this.spinner.hide();
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

    this.spinner.show();
    this.auth.loginUser(payload).subscribe({
      next: (res) => this.handleLoginSuccess(res),
      error: (err) => this.handleLoginError(err)
    });
  }

  private handleLoginSuccess(response: any) {
    this.spinner.hide();
    
    if (response.headers?.statusCode !== 200) {
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
    this.spinner.hide();
    const message = error?.message || 'Login failed';
    this.toast.showToast(message, 'error');
  }

  private loadUserProfile() {
    this.userService.loadUserProfile().subscribe({
      next: (profile) => {
        console.log('📥 User profile API response:', profile);
        if (profile?.[0]) {
          console.log('📝 Profile data being sent to notifier:', profile[0]);
          this.notifier.notifyUserData(profile[0]);
        } else {
          console.warn('⚠️ No profile data found in API response');
        }
      },
      error: (err) => console.error('❌ Failed to load user profile:', err)
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