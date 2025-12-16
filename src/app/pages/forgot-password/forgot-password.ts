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
            this.swalToast.showToast(res.headers.message, 'success');
            setTimeout(() => {
              this.resetFormData();
            }, 2000);
          } else {
            this.swalToast.showToast(res.headers.message, 'error');
          }
        },
        error: (err) => {
          this.isLoading = false;
          const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
          this.swalToast.showToast(errList, 'error');
        },
      });
    } catch (err: any) {
      this.isLoading = false;
      this.swalToast.showToast(err, 'error');
    }
  }
}