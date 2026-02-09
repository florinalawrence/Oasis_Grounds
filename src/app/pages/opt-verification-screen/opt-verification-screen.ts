import { Component, Input, OnInit, ElementRef, ViewChild, Output, EventEmitter, AfterViewInit, ViewChildren, QueryList, inject, DestroyRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutePath } from '../../core/constant/api.constant';
import { NotifierService } from '../../services/Notifier-service/notifier.service';
import { SessionService } from '../../services/Session-service/session.service';
import { ToastService } from '../../services/Toast-service/toast.service';
import { UserService } from '../../services/User-service/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-opt-verification-screen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgxSpinnerModule],
  templateUrl: './opt-verification-screen.html',
  styleUrl: './opt-verification-screen.scss',
})
export class OptVerificationScreen implements AfterViewInit,OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly swalToast = inject(ToastService);
  private readonly notifier = inject(NotifierService);
  private readonly session = inject(SessionService);
  private readonly service = inject(UserService);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() canShowOtpModal: boolean = false;
  @Input() getVerifyOTPData: any={};
  @Output() canShowOtpModalChange = new EventEmitter<boolean>();


  @ViewChild('verifyButton') verifyButton!: ElementRef;
  btnSubmitted: boolean = false;
  displayOTPModal: string = 'none';
  canShowVerifyOtp: boolean = false;
  RoutePath =RoutePath;
  otpVerifyForm: FormGroup = new FormGroup({
    value1: new FormControl(''),
    value2: new FormControl(''),
    value3: new FormControl(''),
    value4: new FormControl('')
  });

  ngOnInit(): void {
    this.otpVerifyForm = this.fb.group({
      value1: ['', [Validators.required,
      Validators.maxLength(1),
      Validators.minLength(1),
      Validators.pattern('[0-9]{1}')],],
      value2: ['', [Validators.required,
      Validators.maxLength(1),
      Validators.minLength(1),
      Validators.pattern('[0-9]{1}')],],
      value3: ['', [Validators.required,
      Validators.maxLength(1),
      Validators.minLength(1),
      Validators.pattern('[0-9]{1}')],],
      value4: ['', [Validators.required,
      Validators.maxLength(1),
      Validators.minLength(1),
      Validators.pattern('[0-9]{1}')],],
    });
    this.canShowOtpModal = true;
    this.displayOTPModal = 'block';

    this.otpVerifyForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.canShowVerifyOtp = this.otpVerifyForm.valid;
    });

    // Subscribe to data from notifier service (when used as standalone page)
    this.notifier.dataSubject.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: any) => {
      if (data) {
        this.getVerifyOTPData = data;
      }
    });
  }
  ngAfterViewInit(): void {
    // Focus on first OTP input after view initialization
    setTimeout(() => {
      const firstInput = document.getElementById('otp-1') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
    
    if (this.getVerifyOTPData !== null && this.getVerifyOTPData !== undefined) {
      this.notifier.sendData(this.getVerifyOTPData);
    }
  }

  get f(): { [key: string]: AbstractControl } {
    return this.otpVerifyForm.controls;
  }
  public get Value1(): FormControl {
    return this.otpVerifyForm.get('value1') as FormControl;
  }
  public get Value2(): FormControl {
    return this.otpVerifyForm.get('value2') as FormControl;
  }
  public get Value3(): FormControl {
    return this.otpVerifyForm.get('value3') as FormControl;
  }
  public get Value4(): FormControl {
    return this.otpVerifyForm.get('value4') as FormControl;
  }

  handleInput(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value.replace(/[^0-9]/g, '');
    target.value = value;
    
    // Update form control
    this.otpVerifyForm.get(`value${index + 1}`)?.setValue(value);
    
    // Auto-focus to next input
    if (value.length === 1 && index < 3) {
      const nextId = `otp-${index + 2}`;
      const nextInput = document.getElementById(nextId) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    } else if (index === 3 && value.length === 1) {
      // Focus on verify button when last digit is entered
      if (this.verifyButton?.nativeElement) {
        this.verifyButton.nativeElement.focus();
      }
    }
  }

  // Handle backspace navigation
  handleKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const target = event.target as HTMLInputElement;
      if (target.value === '' && index > 0) {
        // Move to previous input if current is empty
        const prevId = `otp-${index}`;
        const prevInput = document.getElementById(prevId) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      }
    }
  }

  verifyOTP() {
    console.log("Button clicked"),
    this.btnSubmitted = true;
    try {
      const fullOtp: string = this.Value1.value.toString() + this.Value2.value.toString() + this.Value3.value.toString() + this.Value4.value.toString();
      const passVerifyOTPData = {
        otp: fullOtp,
        otpVerificationKey: this.getVerifyOTPData.otpVerificationKey
      }
      if (passVerifyOTPData.otp !== null && passVerifyOTPData.otpVerificationKey !== null && passVerifyOTPData.otpVerificationKey !== undefined) {
        this.spinner.show();
        this.service.verifyUserWithOTP(passVerifyOTPData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: res => {
            this.spinner.hide();
            
            // Since UserService uses observe: 'response', the actual data is in res.body
            const responseBody = res.body;
            const statusCode = res.status;
            
            console.log('OTP verification response:', res);
            console.log('Response body:', responseBody);
            console.log('Status code:', statusCode);
            console.log('Response body headers:', responseBody?.headers);
            console.log('Response body statusCode:', responseBody?.headers?.statusCode);
            console.log('Response body statusCode type:', typeof responseBody?.headers?.statusCode);
            
            // Check if the HTTP status is 200 (successful) - handle both string and number
            const apiStatusCode = responseBody?.headers?.statusCode;
            const isSuccess = statusCode === 200 && (apiStatusCode === 200 || apiStatusCode === "200");
            
            // Also check if we have an access token as an indicator of success
            const hasAccessToken = responseBody?.accessToken;
            
            console.log('Is OTP verification success?', isSuccess);
            console.log('Has access token?', hasAccessToken);
            
            if (isSuccess || (statusCode === 200 && hasAccessToken)) {
              if (responseBody.accessToken) {
                this.session.setToken(responseBody.accessToken, 'email');
              }
              
              const token = this.session.getToken();
              if (token) {
                this.notifier.notifyToHeader(token);
                this.notifier.isAuthenticatedSubject.next(true);
              }
              
              const successMessage = responseBody.headers.message || 'Registration successful! Welcome!';
              this.swalToast.showToast(successMessage, 'success');
              
              // Set a flag to indicate this is a new registration (header should show "Welcome")
              this.notifier.notifyUserData({ isNewRegistration: true });
              
              // Add a small delay before navigation to ensure toast is shown
              setTimeout(() => {
                this.router.navigateByUrl(RoutePath.USER_DASHBOARD);
              }, 1500);
              this.resetFormData();
              this.canShowOtpModal = false;
            }
            else {
              const errorMessage = responseBody?.headers?.message || 'OTP verification failed';
              this.swalToast.showToast(errorMessage, 'error');
            }
          },
          error: (err: any) => {
            this.spinner.hide();
            console.error('OTP verification error:', err);
            
            let errorMessage = 'OTP verification failed';
            
            if (err.message) {
              errorMessage = err.message;
            } else if (err.error?.headers?.message) {
              errorMessage = err.error.headers.message;
            } else if (err.error?.message) {
              errorMessage = err.error.message;
            }
            
            this.swalToast.showToast(errorMessage, 'error');
          }
        });
      }
    }
    catch (err: any) {
      this.swalToast.showToast('error on verify user' + err, 'error');
      this.spinner.hide();
    }
  }
  resetFormData() {
    this.otpVerifyForm.reset();
    this.btnSubmitted = false;
  }
  resendOTP() {
    try {
      (document.getElementById('otp-1') as HTMLInputElement)?.focus();
      if (this.getVerifyOTPData !== null && this.getVerifyOTPData.otpVerificationKey !== null && this.getVerifyOTPData.otpVerificationKey !== undefined) {
        const otpVerificationKey = {
          "otpVerificationKey": this.getVerifyOTPData.otpVerificationKey
        };
        this.service.resendOtp(otpVerificationKey).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: res => {
            if (res.headers.statusCode == 200) {
              this.swalToast.showToast(res.headers.message, 'success');
              this.spinner.show();
              setTimeout(() => {
                /** spinner ends after 3 seconds */
                this.spinner.hide();
                this.resetFormData();
              }, 3000);
              this.canShowOtpModal = true;
            }
            else {
              this.swalToast.showToast(res.headers.message, 'error');
            }
          },
          error: (err) => {
            console.error('Resend OTP error:', err);
            let errorMessage = 'Failed to resend OTP';
            
            if (err.message) {
              errorMessage = err.message;
            } else if (err.error?.headers?.message) {
              errorMessage = err.error.headers.message;
            } else if (err.error?.message) {
              errorMessage = err.error.message;
            }
            
            this.swalToast.showToast(errorMessage, 'error');
          }
        });
      }
    }
    catch (err: any) {
      this.swalToast.showToast('error on verify user' + err, 'error');
    }
  }



}
