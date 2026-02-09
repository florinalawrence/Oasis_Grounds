import { Component, HostListener, OnInit, inject, DestroyRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PasswordManagementService } from '../../../services/PasswordManagement-service/password-management.service';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { noSpaceAllowedValidator } from '../../../validators/nospace-allowed-validators';
import { PasswordValidators } from '../../../validators/password-validator';
import { RoutePath } from '../../../core/constant/api.constant';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxSpinnerModule
  ]
})
export class ChangePassword implements OnInit {
  changePasswordForm: FormGroup;
  routePath = RoutePath;
  
  // Password visibility toggles
  showCurrentPassword: boolean = false;
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  
  // Form submission state
  isSubmitting: boolean = false;
  btnSubmitted: boolean = false;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly service = inject(PasswordManagementService);
  private readonly swalToast = inject(ToastService);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        PasswordValidators.patternValidator(new RegExp("(?=.*[0-9])"), { requiresDigit: true }),
        PasswordValidators.patternValidator(new RegExp("(?=.*[A-Z])"), { requiresUppercase: true }),
        PasswordValidators.patternValidator(new RegExp("(?=.*[a-z])"), { requiresLowercase: true }),
        PasswordValidators.patternValidator(new RegExp("(?=.*[$@^!%*?&])"), { requiresSpecialChars: true }),
        noSpaceAllowedValidator()
      ]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        PasswordValidators.patternValidator(new RegExp("(?=.*[0-9])"), { requiresDigit: true }),
        PasswordValidators.patternValidator(new RegExp("(?=.*[A-Z])"), { requiresUppercase: true }),
        PasswordValidators.patternValidator(new RegExp("(?=.*[a-z])"), { requiresLowercase: true }),
        PasswordValidators.patternValidator(new RegExp("(?=.*[$@^!%*?&])"), { requiresSpecialChars: true }),
        noSpaceAllowedValidator()
      ]],
      confirmPassword: ['', [
        Validators.required,
        Validators.minLength(6),
        noSpaceAllowedValidator()
      ]]
    });
  }

  @HostListener('window:beforeunload', [])
  onWindowScroll() {
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }

  ngOnInit(): void {
    // Component initialization
  }

  // Form control getters
  get f(): { [key: string]: AbstractControl } {
    return this.changePasswordForm.controls;
  }

  get currentPassword(): FormControl {
    return this.changePasswordForm.get('currentPassword') as FormControl;
  }

  get newPassword(): FormControl {
    return this.changePasswordForm.get('newPassword') as FormControl;
  }

  get confirmPassword(): FormControl {
    return this.changePasswordForm.get('confirmPassword') as FormControl;
  }

  // Current password validation getters
  get currentPasswordValid(): boolean {
    return this.changePasswordForm.controls['currentPassword'].errors === null;
  }

  get requiredCurrentPasswordValid(): boolean {
    return !this.changePasswordForm.controls['currentPassword'].hasError('required');
  }

  get minLengthCurrentPasswordValid(): boolean {
    return !this.changePasswordForm.controls['currentPassword'].hasError('minlength');
  }

  get requiresDigitCurrentPasswordValid(): boolean {
    return !this.changePasswordForm.controls['currentPassword'].hasError('requiresDigit');
  }

  get requiresUppercaseCurrentPasswordValid(): boolean {
    return !this.changePasswordForm.controls['currentPassword'].hasError('requiresUppercase');
  }

  get requiresLowercaseCurrentPasswordValid(): boolean {
    return !this.changePasswordForm.controls['currentPassword'].hasError('requiresLowercase');
  }

  get requiresCurrentPasswordSpecialCharsValid(): boolean {
    return !this.changePasswordForm.controls['currentPassword'].hasError('requiresSpecialChars');
  }

  // New password validation getters
  get newPasswordValid(): boolean {
    return this.changePasswordForm.controls['newPassword'].errors === null;
  }

  get requiredValid(): boolean {
    return !this.changePasswordForm.controls['newPassword'].hasError('required');
  }

  get minLengthValid(): boolean {
    return !this.changePasswordForm.controls['newPassword'].hasError('minlength');
  }

  get requiresDigitValid(): boolean {
    return !this.changePasswordForm.controls['newPassword'].hasError('requiresDigit');
  }

  get requiresUppercaseValid(): boolean {
    return !this.changePasswordForm.controls['newPassword'].hasError('requiresUppercase');
  }

  get requiresLowercaseValid(): boolean {
    return !this.changePasswordForm.controls['newPassword'].hasError('requiresLowercase');
  }

  get requiresSpecialCharsValid(): boolean {
    return !this.changePasswordForm.controls['newPassword'].hasError('requiresSpecialChars');
  }

  // Password visibility toggles
  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Check if passwords match
  onCheckConfirmPasswordMatch(): boolean {
    const newPwd = this.newPassword.value;
    const confirmPwd = this.confirmPassword.value;
    
    if ((newPwd !== null && newPwd !== undefined) && 
        (confirmPwd !== null && confirmPwd !== undefined) && 
        (newPwd !== confirmPwd)) {
      this.swalToast.showToast('Confirm Password does not match with Password', 'error');
      return true;
    }
    return false;
  }

  // Form submission
  onSubmit(): void {
    this.btnSubmitted = true;

    // Check form validity
    if (this.changePasswordForm.invalid) {
      return;
    }

    // Check password match
    if (this.onCheckConfirmPasswordMatch()) {
      return;
    }

    // Prepare request payload
    const changePwdRequest = {
      password: this.currentPassword.value,
      newPassword: this.newPassword.value,
      confirmPassword: this.confirmPassword.value
    };

    this.isSubmitting = true;
    this.spinner.show();

    // Call API
    this.service.changePassword(changePwdRequest).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: any) => {
        if (res.headers.statusCode === "200") {
          setTimeout(() => {
            this.swalToast.showToast(res.headers.message, 'success');
            this.resetFormData();
            this.spinner.hide();
            this.isSubmitting = false;
          }, 200);
        } else {
          this.swalToast.showToast(res.headers.message, 'error');
          this.spinner.hide();
          this.isSubmitting = false;
        }
      },
      error: (err: any) => {
        this.swalToast.showToast(err, 'error');
        this.spinner.hide();
        this.isSubmitting = false;
      }
    });
  }

  // Reset form
  resetFormData(): void {
    this.changePasswordForm.reset();
    this.btnSubmitted = false;
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  // Navigate to home
  gotoHomePage(): void {
    this.router.navigateByUrl('home');
  }
}
