import {
  Component,
  Input,
  OnInit,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  AfterViewInit,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { LoaderService } from '../../services/loader.service';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { RoutePath } from '../../core/constant/api.constant';
import { NotifierService } from '../../services/Notifier-service/notifier.service';
import { SessionService } from '../../services/Session-service/session.service';
import { ToastService } from '../../services/Toast-service/toast.service';
import { UserService } from '../../services/User-service/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-opt-verification-screen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './opt-verification-screen.html',
  styleUrl: './opt-verification-screen.scss',
})
export class OptVerificationScreen implements AfterViewInit, OnInit {
  @Input() canShowOtpModal: boolean = false;
  @Input() getVerifyOTPData: any = {};
  @Output() canShowOtpModalChange = new EventEmitter<boolean>();

  @ViewChild('verifyButton') verifyButton!: ElementRef;
  btnSubmitted: boolean = false;
  displayOTPModal: string = 'none';
  canShowVerifyOtp: boolean = false;
  RoutePath = RoutePath;
  otpVerifyForm: FormGroup = new FormGroup({
    value1: new FormControl(''),
    value2: new FormControl(''),
    value3: new FormControl(''),
    value4: new FormControl(''),
  });
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private swalToast: ToastService,
    private notifier: NotifierService,
    private session: SessionService,
    private service: UserService,
    private loader: LoaderService,
  ) {}

  ngOnInit(): void {
    this.otpVerifyForm = this.fb.group({
      value1: [
        '',
        [
          Validators.required,
          Validators.maxLength(1),
          Validators.minLength(1),
          Validators.pattern('[0-9]{1}'),
        ],
      ],
      value2: [
        '',
        [
          Validators.required,
          Validators.maxLength(1),
          Validators.minLength(1),
          Validators.pattern('[0-9]{1}'),
        ],
      ],
      value3: [
        '',
        [
          Validators.required,
          Validators.maxLength(1),
          Validators.minLength(1),
          Validators.pattern('[0-9]{1}'),
        ],
      ],
      value4: [
        '',
        [
          Validators.required,
          Validators.maxLength(1),
          Validators.minLength(1),
          Validators.pattern('[0-9]{1}'),
        ],
      ],
    });
    this.canShowOtpModal = true;
    this.displayOTPModal = 'block';

    this.otpVerifyForm.valueChanges.subscribe(() => {
      this.canShowVerifyOtp = this.otpVerifyForm.valid;
    });

    this.notifier.dataSubject.subscribe((data: any) => {
      if (data) {
        this.getVerifyOTPData = data;
      }
    });
  }
  ngAfterViewInit(): void {
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

    this.otpVerifyForm.get(`value${index + 1}`)?.setValue(value);

    if (value.length === 1 && index < 3) {
      const nextId = `otp-${index + 2}`;
      const nextInput = document.getElementById(nextId) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    } else if (index === 3 && value.length === 1) {
      if (this.verifyButton?.nativeElement) {
        this.verifyButton.nativeElement.focus();
      }
    }
  }

  handleKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const target = event.target as HTMLInputElement;
      if (target.value === '' && index > 0) {
        const prevId = `otp-${index}`;
        const prevInput = document.getElementById(prevId) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      }
    }
  }

  verifyOTP() {
    this.btnSubmitted = true;
    try {
      const fullOtp: string =
        this.Value1.value.toString() +
        this.Value2.value.toString() +
        this.Value3.value.toString() +
        this.Value4.value.toString();
      const passVerifyOTPData = {
        otp: fullOtp,
        otpVerificationKey: this.getVerifyOTPData.otpVerificationKey,
      };
      if (
        passVerifyOTPData.otp !== null &&
        passVerifyOTPData.otpVerificationKey !== null &&
        passVerifyOTPData.otpVerificationKey !== undefined
      ) {
        this.loader.show();
        this.service.verifyUserWithOTP(passVerifyOTPData).subscribe({
          next: (res) => {
            this.loader.hide();

            const responseBody = res.body;
            const statusCode = res.status;

            const apiStatusCode = responseBody?.headers?.statusCode;
            const isSuccess =
              statusCode === 200 && (apiStatusCode === 200 || apiStatusCode === '200');

            const hasAccessToken = responseBody?.accessToken;

            if (isSuccess || (statusCode === 200 && hasAccessToken)) {
              if (responseBody.accessToken) {
                this.session.setToken(responseBody.accessToken, 'email');
              }

              const token = this.session.getToken();
              if (token) {
                this.notifier.notifyToHeader(token);
                this.notifier.isAuthenticatedSubject.next(true);
              }

              const successMessage =
                responseBody.headers.message || 'Registration successful! Welcome!';
              this.swalToast.showToast(successMessage, 'success');

              this.notifier.notifyUserData({ isNewRegistration: true });

              setTimeout(() => {
                this.router.navigateByUrl(RoutePath.USER_DASHBOARD);
              }, 1500);
              this.resetFormData();
              this.canShowOtpModal = false;
            } else {
              const errorMessage = responseBody?.headers?.message || 'OTP verification failed';
              this.swalToast.showToast(errorMessage, 'error');
            }
          },
          error: (err: any) => {
            this.loader.hide();

            let errorMessage = 'OTP verification failed';

            if (err.message) {
              errorMessage = err.message;
            } else if (err.error?.headers?.message) {
              errorMessage = err.error.headers.message;
            } else if (err.error?.message) {
              errorMessage = err.error.message;
            }

            this.swalToast.showToast(errorMessage, 'error');
          },
        });
      }
    } catch (err: any) {
      this.swalToast.showToast('error on verify user' + err, 'error');
      this.loader.hide();
    }
  }
  resetFormData() {
    this.otpVerifyForm.reset();
    this.btnSubmitted = false;
  }
  resendOTP() {
    try {
      (document.getElementById('otp-1') as HTMLInputElement)?.focus();
      if (
        this.getVerifyOTPData !== null &&
        this.getVerifyOTPData.otpVerificationKey !== null &&
        this.getVerifyOTPData.otpVerificationKey !== undefined
      ) {
        const otpVerificationKey = {
          otpVerificationKey: this.getVerifyOTPData.otpVerificationKey,
        };
        this.service.resendOtp(otpVerificationKey).subscribe({
          next: (res) => {
            if (res.headers.statusCode == 200) {
              this.swalToast.showToast(res.headers.message, 'success');
              this.loader.show();
              setTimeout(() => {
                this.loader.hide();
                this.resetFormData();
              }, 3000);
              this.canShowOtpModal = true;
            } else {
              this.swalToast.showToast(res.headers.message, 'error');
            }
          },
          error: (err) => {
            let errorMessage = 'Failed to resend OTP';

            if (err.message) {
              errorMessage = err.message;
            } else if (err.error?.headers?.message) {
              errorMessage = err.error.headers.message;
            } else if (err.error?.message) {
              errorMessage = err.error.message;
            }

            this.swalToast.showToast(errorMessage, 'error');
          },
        });
      }
    } catch (err: any) {
      this.swalToast.showToast('error on verify user' + err, 'error');
    }
  }
}
