import { Component, OnInit, OnDestroy, inject, DestroyRef } from '@angular/core';
import { LoaderService } from '../../services/loader.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  FormControl,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SocialAuthService, GoogleLoginProvider, SocialUser, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';

import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';




import { ToastService } from '../../services/Toast-service/toast.service';
import { UserService } from '../../services/User-service/user.service';
import { AuthService } from '../../services/Auth-service/auth.service';
import { SessionService } from '../../services/Session-service/session.service';
import { NotifierService } from '../../services/Notifier-service/notifier.service';



import { PasswordValidators } from '../../validators/password-validator';
import { noSpaceAllowedValidator } from '../../validators/nospace-allowed-validators';






import { environment } from '../../../environments/environment';



import { IUser } from '../../models/User_Model/IUser.model';
import { RoutePath } from '../../core/constant/api.constant';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink, 
    FormsModule, 
    GoogleSigninButtonModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class Register implements OnInit, OnDestroy {
 
  
  regForm: FormGroup;
  btnSubmitted = false;
  passwordMismatch = false;


  
  eyeSwitchPwd = false;
  eyeSwitchConfirmPwd = false;
  passVerifyOTPData: any = {};


  
  userProfileData: any;


  
  user: IUser = {
    applicationId: '',
    email: '',
    password: '',
    confirmPassword: '',
    registrationType: [],
    isActive: false,
  };


  
  private dataSubscription!: Subscription;
  private googleAuthSubscription!: Subscription;
  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: SocialAuthService,
    private auth: AuthService,
    private loader: LoaderService,
    private toastService: ToastService,
    private userService: UserService,
    private session: SessionService,
    private notifier: NotifierService
  ) {
    this.regForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$"),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          PasswordValidators.patternValidator(new RegExp("(?=.*[0-9])"), { requiresDigit: true }),
          PasswordValidators.patternValidator(new RegExp("(?=.*[A-Z])"), { requiresUppercase: true }),
          PasswordValidators.patternValidator(new RegExp("(?=.*[a-z])"), { requiresLowercase: true }),
          PasswordValidators.patternValidator(new RegExp("(?=.*[$@^!%*?&])"), { requiresSpecialChars: true }),
          noSpaceAllowedValidator(),
        ],
      ],
      confirmPwd: ['', [Validators.required, Validators.minLength(6), noSpaceAllowedValidator()]],
    });
  }

  ngOnInit(): void {
    this.loader.show();
    this.getNotifyData();

    setTimeout(() => {
      if (this.session.getToken() && this.userProfileData) {
        this.loader.hide();
        this.router.navigateByUrl(RoutePath.HOME);
      } else {
        this.loader.hide();
        this.router.navigateByUrl(RoutePath.REGISTER);
      }
    }, 500);

    this.onGoogleSignInButtonClicked();
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.googleAuthSubscription) {
      this.googleAuthSubscription.unsubscribe();
    }
  }

  get f(): { [key: string]: AbstractControl } {
    return this.regForm.controls;
  }

  get Email(): FormControl {
    return this.regForm.get('email') as FormControl;
  }

  get Password(): FormControl {
    return this.regForm.get('password') as FormControl;
  }

  get ConfirmPwd(): FormControl {
    return this.regForm.get('confirmPwd') as FormControl;
  }

  get passwordValid() {
    return this.regForm.controls["password"].errors === null;
  }

  get requiredValid() {
    return !this.regForm.controls["password"].hasError("required");
  }

  get minLengthValid() {
    return !this.regForm.controls["password"].hasError("minlength");
  }

  get requiresDigitValid() {
    return !this.regForm.controls["password"].hasError("requiresDigit");
  }

  get requiresUppercaseValid() {
    return !this.regForm.controls["password"].hasError("requiresUppercase");
  }

  get requiresLowercaseValid() {
    return !this.regForm.controls["password"].hasError("requiresLowercase");
  }

  get requiresSpecialCharsValid() {
    return !this.regForm.controls["password"].hasError("requiresSpecialChars");
  }

  getNotifyData() {
    this.dataSubscription = this.notifier.userProfileData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.userProfileData = res;
      });
  }



  toggleEyeIconPwd() {
    this.eyeSwitchPwd = !this.eyeSwitchPwd;
  }

  toggleEyeIconConfirmPwd() {
    this.eyeSwitchConfirmPwd = !this.eyeSwitchConfirmPwd;
  }

  onCheckConfirmPasswordMatch(): boolean {
    if ((this.Password.value !== null && this.Password.value !== undefined) && 
        (this.ConfirmPwd.value !== null && this.ConfirmPwd.value !== undefined) && 
        (this.Password.value !== this.ConfirmPwd.value)) {
      this.passwordMismatch = true;
      return true;
    } else {
      this.passwordMismatch = false;
      return false;
    }
  }

  mapFormData() {
    this.user.applicationId = environment.applicationId;
    this.user.email = this.Email.value;
    this.user.password = this.Password.value;
    this.user.confirmPassword = this.ConfirmPwd.value;
    this.user.registrationType = [];
    this.user.isActive = false;
  }

 onSubmit() {
    this.btnSubmitted = true;
    
    if (this.btnSubmitted && this.onCheckConfirmPasswordMatch()) {
      this.toastService.showToast('Confirm Password does not match with Password', 'error');
      return;
    }
    
    if (this.regForm.invalid) {
      return;
    }

    this.mapFormData();

    this.loader.show();
    this.userService
      .registerUser(this.user)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.loader.hide();
          
          
          const responseBody = res.body;
          const statusCode = res.status;
          
        
          

          const apiStatusCode = responseBody?.headers?.statusCode;
          const isSuccess = statusCode === 200 && (apiStatusCode === 200 || apiStatusCode === "200");
          
       
          
          
          if (isSuccess) {
            
            
            const successMessage = responseBody.headers.message || 'Registration successful';
            this.toastService.showToast(successMessage, 'success');

            this.passVerifyOTPData = {
              userEmailToDisplay: this.user.email,
              otpVerificationKey: responseBody.otpVerificationKey,
              isVerificationRequired: responseBody.isVerificationRequired,
              userId: responseBody.userId
            };

            
            
            this.notifier.sendData(this.passVerifyOTPData);

           
            
            this.router.navigate(['/otp-verification']);

          } else {
            
            
            const errorMessage = responseBody?.headers?.message || responseBody?.message || 'Registration failed';
            this.toastService.showToast(errorMessage, 'error');
          }
        },
        error: (err: any) => {
          this.loader.hide();
         
          
          
          let errorMessage = 'Registration failed';
          
          
          
          if (err.details) {
            errorMessage = err.details;
          } else if (err.error?.headers?.message) {
            errorMessage = err.error.headers.message;
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          } else if (err.status === 409) {
            errorMessage = 'Email already exists';
          } else if (err.status === 400) {
            errorMessage = 'Invalid registration data';
          }
          
          this.toastService.showToast(errorMessage, 'error');
        }
      });
}


  resetFormData() {
    this.regForm.reset();
    this.btnSubmitted = false;
    this.passwordMismatch = false;
  }

  onGoogleSignInButtonClicked() {
    try {
      this.googleAuthSubscription = this.authService.authState.subscribe(user => {
    
        
        const googleUser = user;
       
        
        
        this.authService.getAccessToken(GoogleLoginProvider.PROVIDER_ID).then(accessToken => {
          const googleLoginPayload = {
            identifier: environment.applicationId,
            token: accessToken,
            attemptingFrom: "login"
          };
          
          this.loader.show();
          this.auth.loginWithGoogle(googleLoginPayload).subscribe({
            next: (res) => {
          
              
              const data = res;
              
              if (data.accessToken) {
                this.session.setToken(data.accessToken, 'google');
              }
              
              if (data.headers.statusCode == 200) {
             
                
                this.toastService.showToast(res.headers.message || 'Google registration successful!', 'success');
                
                const token = this.session.getToken();
                this.loader.hide();
                
                if (token) {
                  this.notifier.notifyToHeader(token);
                  this.notifier.isAuthenticatedSubject.next(true);
                  
                 
                  
                  this.notifier.notifyUserData({ isNewRegistration: true, ...googleUser });
                }
                
                
                
                setTimeout(() => {
                  const routerUrl = localStorage.getItem('routeUrl');
                  if (routerUrl) {
                    localStorage.removeItem('routeUrl');
                    
                    this.router.navigateByUrl(routerUrl);
                  } else {
                    this.getNotifyData();
                    this.router.navigateByUrl(RoutePath.USER_DASHBOARD);
                  }
                }, 500);
              } else {
               
                
                this.toastService.showToast(data.headers.message || 'Google registration failed', "error");
                this.loader.hide();
              }
            },
            error: (err: any) => {
              const errorMsg = err !== null || err !== undefined ? err : 'Invalid login';
              this.toastService.showToast(errorMsg, 'error');
              this.loader.hide();
            }
          });
        });
      });
    } catch (err: any) {
      this.toastService.showToast(err, 'error');
      this.loader.hide();
    }
  }

  openModal() {}


}