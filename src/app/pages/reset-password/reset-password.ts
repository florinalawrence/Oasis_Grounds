import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { RoutePath } from '../../core/constant/api.constant';
import { PasswordManagementService } from '../../services/PasswordManagement-service/password-management.service';
import { SessionService } from '../../services/Session-service/session.service';
import { ToastService } from '../../services/Toast-service/toast.service';
import { noSpaceAllowedValidator } from '../../validators/nospace-allowed-validators';
import { PasswordValidators } from '../../validators/password-validator';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { NotifierService } from '../../services/Notifier-service/notifier.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule]
})
export class ResetPassword implements OnInit {
  
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifier = inject(NotifierService);
  private readonly swalToast = inject(ToastService);
  private readonly service = inject(PasswordManagementService);
  private readonly session = inject(SessionService);
  private readonly spinner = inject(NgxSpinnerService);

  // Reactive signals for state management
  readonly passwordResetKey = signal<string>('');
  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly isSubmitted = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isValidRequest = signal<boolean>(false);

  // Form group
  readonly createPwdForm: FormGroup;

  // Computed signals for password validation
  readonly passwordStrength = computed(() => {
    const password = this.createPwdForm?.get('password')?.value || '';
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[$@^!%*?&]/.test(password)) strength++;
    
    return strength;
  });

  readonly passwordStrengthText = computed(() => {
    const strength = this.passwordStrength();
    if (strength <= 1) return 'Very Weak';
    if (strength === 2) return 'Weak';
    if (strength === 3) return 'Fair';
    if (strength === 4) return 'Good';
    return 'Strong';
  });

  readonly passwordStrengthColor = computed(() => {
    const strength = this.passwordStrength();
    if (strength <= 1) return 'danger';
    if (strength === 2) return 'warning';
    if (strength === 3) return 'info';
    if (strength === 4) return 'primary';
    return 'success';
  });

  constructor() {
    // Initialize form with enhanced validation
    this.createPwdForm = this.fb.group({
      resetKey: ['', [Validators.required, noSpaceAllowedValidator()]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        PasswordValidators.patternValidator(new RegExp("(?=.*[0-9])"), { requiresDigit: true }),
        PasswordValidators.patternValidator(new RegExp("(?=.*[A-Z])"), { requiresUppercase: true }),
        PasswordValidators.patternValidator(new RegExp("(?=.*[a-z])"), { requiresLowercase: true }),
        PasswordValidators.patternValidator(new RegExp("(?=.*[$@^!%*?&])"), { requiresSpecialChars: true }),
        noSpaceAllowedValidator()
      ]],
      confirmPwd: ['', [
        Validators.required,
        Validators.minLength(6),
        noSpaceAllowedValidator()
      ]]
    });
  }
  ngOnInit() {
    // Get password reset key from route params
    this.route.params.subscribe(params => {
      const resetKey = params['id'];
      if (resetKey) {
        console.log('Reset key found in URL:', resetKey);
        this.passwordResetKey.set(resetKey);
        // Pre-fill the reset key field and disable it
        this.createPwdForm.patchValue({ resetKey: resetKey });
        this.createPwdForm.get('resetKey')?.disable();
        this.verifyValidRequest();
      } else {
        console.log('No reset key in URL, showing generic reset page');
        // Allow user to access reset page without key
        // They need to enter the reset key manually
        this.isValidRequest.set(true);
        this.swalToast.showToast('Please enter your reset key from the email and your new password', 'info');
      }
    });
  }
  /**
   * Check if passwords match
   */
  checkPasswordMatch(): boolean {
    const password = this.createPwdForm.get('password')?.value;
    const confirmPassword = this.createPwdForm.get('confirmPwd')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return false;
    }
    return true;
  }

  /**
   * Get form controls
   */
  get f(): { [key: string]: AbstractControl } {
    return this.createPwdForm.controls;
  }

  /**
   * Get password control
   */
  get passwordControl(): FormControl {
    return this.createPwdForm.get('password') as FormControl;
  }

  /**
   * Get confirm password control
   */
  get confirmPasswordControl(): FormControl {
    return this.createPwdForm.get('confirmPwd') as FormControl;
  }

  /**
   * Get reset key control
   */
  get resetKeyControl(): FormControl {
    return this.createPwdForm.get('resetKey') as FormControl;
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(show => !show);
  }

  /**
   * Get password validation errors
   */
  getPasswordErrors(): string[] {
    const errors: string[] = [];
    const control = this.passwordControl;
    
    if (control.hasError('required')) {
      errors.push('Password is required');
    }
    if (control.hasError('minlength')) {
      errors.push('Password must be at least 6 characters long');
    }
    if (control.hasError('requiresUppercase')) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (control.hasError('requiresLowercase')) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (control.hasError('requiresDigit')) {
      errors.push('Password must contain at least one number');
    }
    if (control.hasError('requiresSpecialChars')) {
      errors.push('Password must contain at least one special character ($@^!%*?&)');
    }
    if (control.hasError('noSpaceAllowed')) {
      errors.push('Password cannot contain spaces');
    }
    
    return errors;
  }
  /**
   * Submit the password reset form
   */
  async onSubmit(): Promise<void> {
    this.isSubmitted.set(true);
    
    // Get reset key from form (either from URL or manually entered)
    const resetKey = this.createPwdForm.get('resetKey')?.value || this.passwordResetKey();
    
    // Check if password reset key is available
    if (!resetKey || resetKey.trim() === '') {
      this.swalToast.showToast('Password reset key is required. Please enter the key from your email.', 'error');
      return;
    }
    
    // Validate form
    if (this.createPwdForm.invalid) {
      this.swalToast.showToast('Please fix the form errors', 'error');
      return;
    }
    
    // Check password match
    if (!this.checkPasswordMatch()) {
      this.swalToast.showToast('Passwords do not match', 'error');
      return;
    }
    
    const updatePwdReq = {
      applicationId: environment.applicationId,
      passwordResetKey: resetKey,
      newPassword: this.passwordControl.value,
      confirmNewPassword: this.confirmPasswordControl.value
    };
    
    try {
      this.isLoading.set(true);
      this.spinner.show();
      
      this.service.updateForgotPassword(updatePwdReq).subscribe({
        next: (res) => {
          if (res.headers.statusCode === 200) {
            this.swalToast.showToast(res.headers.message || 'Password reset successfully!', 'success');
            this.resetForm();
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.swalToast.showToast(res.headers.message || 'Failed to reset password', 'error');
          }
          this.isLoading.set(false);
          this.spinner.hide();
        },
        error: (err) => {
          console.error('Password reset error:', err);
          const errorMessage = err.error?.message || err.message || 'Failed to reset password';
          this.swalToast.showToast(errorMessage, 'error');
          this.isLoading.set(false);
          this.spinner.hide();
        }
      });
    } catch (err: any) {
      console.error('Password reset exception:', err);
      this.swalToast.showToast('An unexpected error occurred', 'error');
      this.isLoading.set(false);
      this.spinner.hide();
    }
  }

  /**
   * Verify if the reset request is valid
   */
  private verifyValidRequest(): void {
    const verifyReq = {
      applicationId: environment.applicationId,
      passwordResetKey: this.passwordResetKey()
    };
    
    this.isLoading.set(true);
    this.spinner.show();
    
    this.service.verifyForgotPassword(verifyReq).subscribe({
      next: (res) => {
        if (res.headers.statusCode === 200) {
          this.isValidRequest.set(true);
          this.swalToast.showToast('Reset link verified successfully', 'success');
        } else {
          this.isValidRequest.set(false);
          this.swalToast.showToast(res.headers.message || 'Invalid reset link', 'error');
          setTimeout(() => {
            this.router.navigate(['/forgot-password']);
          }, 3000);
        }
        this.isLoading.set(false);
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Verification error:', err);
        this.isValidRequest.set(false);
        const errorMessage = err.error?.message || err.message || 'Invalid or expired reset link';
        this.swalToast.showToast(errorMessage, 'error');
        this.isLoading.set(false);
        this.spinner.hide();
        
        setTimeout(() => {
          this.router.navigate(['/forgot-password']);
        }, 3000);
      }
    });
  }

  /**
   * Reset form data
   */
  private resetForm(): void {
    this.createPwdForm.reset();
    this.isSubmitted.set(false);
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navigate to forgot password page
   */
  navigateToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  /**
   * Check if password has uppercase letter
   */
  hasUppercase(): boolean {
    const password = this.passwordControl.value || '';
    return /[A-Z]/.test(password);
  }

  /**
   * Check if password has lowercase letter
   */
  hasLowercase(): boolean {
    const password = this.passwordControl.value || '';
    return /[a-z]/.test(password);
  }

  /**
   * Check if password has number
   */
  hasNumber(): boolean {
    const password = this.passwordControl.value || '';
    return /[0-9]/.test(password);
  }

  /**
   * Check if password has special character
   */
  hasSpecialChar(): boolean {
    const password = this.passwordControl.value || '';
    return /[$@^!%*?&]/.test(password);
  }

  /**
   * Check if password has minimum length
   */
  hasMinLength(): boolean {
    const password = this.passwordControl.value || '';
    return password.length >= 6;
  }
}