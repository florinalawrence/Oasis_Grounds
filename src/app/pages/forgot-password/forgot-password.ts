import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, AbstractControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PasswordManagementService } from '../../services/PasswordManagement-service/password-management.service';
import { ToastService } from '../../services/Toast-service/toast.service';
import { noSpaceAllowedValidator } from '../../validators/nospace-allowed-validators';
import { RoutePath } from '../../core/constant/api.constant';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink
  ]
})
export class ForgotPassword implements OnInit {
  RoutePath = RoutePath;
  btnSubmitted: boolean = false;
  forgotPwdForm!: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private service: PasswordManagementService,
    private swalToast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.forgotPwdForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$"),
        noSpaceAllowedValidator()
      ]],
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.forgotPwdForm.controls;
  }

  public get Email(): FormControl {
    return this.forgotPwdForm.get('email') as FormControl;
  }

  resetFormData() {
    this.forgotPwdForm.reset();
    this.btnSubmitted = false;
  }

  onSubmit() {
    this.btnSubmitted = true;
    
    if (this.forgotPwdForm.invalid) {
      return;
    }

    try {
      this.isLoading = true;
      
      const confirmPwdRequest = {
        "applicationId": environment.applicationId,
        "email": this.Email.value
      };

      this.service.InitiateForgotPassword(confirmPwdRequest).subscribe({
        next: (res) => {
          this.isLoading = false;
          
          if (res.headers.statusCode == 200) {
            this.swalToast.showToast(res.headers.message || 'Verification email sent successfully!', 'success');
            
            // Navigate to reset password screen after successful verification
            setTimeout(() => {
              this.resetFormData();
              
              // Check if response contains a password reset key/token
              if (res.data?.passwordResetKey || res.passwordResetKey || res.data?.resetKey || res.resetKey) {
                const resetKey = res.data?.passwordResetKey || res.passwordResetKey || res.data?.resetKey || res.resetKey;
                console.log('Navigating to reset password with key:', resetKey);
                this.router.navigate(['/resetPassword', resetKey]);
              } else if (res.data?.token || res.token) {
                // Handle case where token is provided instead of resetKey
                const token = res.data?.token || res.token;
                console.log('Navigating to reset password with token:', token);
                this.router.navigate(['/resetPassword', token]);
              } else {
                // If no reset key in response, navigate to generic reset password page
                console.log('No reset key found in response, navigating to generic reset page');
                this.swalToast.showToast('Please check your email for the reset link or continue with password reset', 'info');
                this.router.navigate(['/resetPassword']);
              }
            }, 2000);
          } else {
            this.swalToast.showToast(res.headers.message || 'Failed to send verification email', 'error');
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Forgot password error:', err);
          
          let errorMessage = 'Failed to send verification email';
          if (err.error?.headers?.message) {
            errorMessage = err.error.headers.message;
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          this.swalToast.showToast(errorMessage, 'error');
        },
      });
    } catch (err: any) {
      this.isLoading = false;
      this.swalToast.showToast(err, 'error');
    }
  }
}