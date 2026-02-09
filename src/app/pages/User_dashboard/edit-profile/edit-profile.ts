import { Component, OnInit, AfterViewInit, HostListener, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, FormBuilder, AbstractControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { UserProfilesService } from '../../../services/UserProfile-service/user-profile.service';
import { NotifierService } from '../../../services/Notifier-service/notifier.service';
import { SessionService } from '../../../services/Session-service/session.service';
import { RoutePath } from '../../../core/constant/api.constant';
import Swal from 'sweetalert2';
import { IUserProfile } from '../../../models/User_Model/IUserProfile.model';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule
  ],
  templateUrl: './edit-profile.html',
  styleUrls: ['./edit-profile.scss']
})
export class EditProfile implements OnInit, AfterViewInit {
  url: any;
  countryCodes: any[] = [];
  btnSubmitted: boolean = false;
  userId: string = '';
  userProfiles: IUserProfile = {
    id: '',
    firstName: '',
    lastName: '',
    phoneNo: '',
    countryCode: '',
    email: '',
    userType: '',
    companyDetail: {}
  };

  userProfileForm: FormGroup = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
    mobCode: new FormControl(''),
    mobileNo: new FormControl(''),
    userType: new FormControl(''),
    companyName: new FormControl(''),
    companyType: new FormControl(''),
    companyAddr: new FormControl(''),
    websiteUrl: new FormControl('')
  });

  routePath = RoutePath;

  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly swalToast = inject(ToastService);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly service = inject(UserProfilesService);
  private readonly notifier = inject(NotifierService);
  private readonly session = inject(SessionService);
  private readonly destroyRef = inject(DestroyRef);

  @HostListener('window:scroll')
  onWindowScroll() {
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCountryCodes();
    this.setupFormListeners();
  }

  ngAfterViewInit(): void {
    this.getUserProfiles();
  }

  initializeForm(): void {
    this.userProfileForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$")
      ]],
      mobCode: ['', [Validators.required]],
      mobileNo: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{3,15}$')
      ]],
      firstName: [''],
      lastName: [''],
      userType: ['', [Validators.required]],
      companyName: [''],
      companyType: [''],
      companyAddr: [''],
      websiteUrl: ['']
    });
  }

  loadCountryCodes(): void {
    const countryCodes = this.service.getCountryCodes();
    this.countryCodes = countryCodes.sort((a: any, b: any) => 
      a.code.localeCompare(b.code)
    );
  }

  setupFormListeners(): void {
    // Only listen for userType changes to update form validators (not sidenav)
    this.userProfileForm.get('userType')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.updateDynamicValidators(value);
      // Don't update sidenav in real-time - only on save
    });

    // Remove real-time listeners for firstName and lastName
    // Sidenav will only update when save button is clicked
  }

  updateUserRoleInSession(userType: string): void {
    console.log(' updateUserRoleInSession called with userType:', userType);
    
    if (userType) {
      // Map the user type to display role
      let displayRole = '';
      switch (userType) {
        case 'Owner':
          displayRole = 'Individual';
          break;
        case 'Broker':
          displayRole = 'Broker';
          break;
        case 'Company':
          displayRole = 'Company';
          break;
        default:
          displayRole = 'Home Buyer';
      }
      
      console.log('Mapped displayRole:', displayRole);
      
      // Notify other components about the role change
      this.notifier.notifyUserRoleChange(displayRole);
      console.log(' Role change sent to NotifierService:', displayRole);
    } else {
      console.warn(' No userType provided to updateUserRoleInSession');
    }
  }

  updateUserNameInSession(): void {
    const firstName = this.FirstName.value || '';
    const lastName = this.LastName.value || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    console.log(' updateUserNameInSession called');
    console.log(' firstName:', firstName);
    console.log(' lastName:', lastName);
    console.log(' fullName:', fullName);
    
    if (fullName) {
      // Notify other components about the name change
      this.notifier.notifyUserNameChange(fullName);
      console.log(' Name change sent to NotifierService:', fullName);
    } else {
      console.warn(' No fullName to send to NotifierService');
    }
  }

  updateDynamicValidators(value: string): void {
    if (value === 'Company') {
      // Clear individual validators
      this.FirstName.clearValidators();
      this.LastName.clearValidators();
      this.FirstName.setValue(null);
      this.LastName.setValue(null);

      // Set company validators
      this.CompanyName.setValidators([
        Validators.required,
        Validators.maxLength(100)
      ]);
      this.CompanyAddr.setValidators([
        Validators.required,
        Validators.pattern("^[a-zA-Z0-9 !@#$&()\\-`.+,/\"]*$"),
        Validators.maxLength(200)
      ]);
      this.CompanyType.setValidators([
        Validators.required,
        Validators.pattern("^[a-zA-Z0-9 !@#$&()\\-`.+,/\"]*$"),
        Validators.maxLength(100)
      ]);
      this.WebsiteUrl.setValidators([
        Validators.pattern(/^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.(com|om|sa|qa|ae|in|[a-zA-Z]{2,})(\/.*)?$/)
      ]);
    } else {
      // Clear company validators
      this.CompanyName.clearValidators();
      this.CompanyType.clearValidators();
      this.CompanyAddr.clearValidators();
      this.WebsiteUrl.clearValidators();
      this.CompanyName.setValue(null);
      this.CompanyAddr.setValue(null);
      this.CompanyType.setValue(null);
      this.WebsiteUrl.setValue(null);

      // Set individual validators
      this.FirstName.setValidators([
        Validators.required,
        Validators.pattern("^[a-zA-Z ]*$"),
        Validators.maxLength(50),
        Validators.minLength(3)
      ]);
      this.LastName.setValidators([
        Validators.required,
        Validators.pattern("^[a-zA-Z ]*$"),
        Validators.maxLength(50),
        Validators.minLength(1)
      ]);
    }

    // Update validity
    this.CompanyName.updateValueAndValidity();
    this.CompanyAddr.updateValueAndValidity();
    this.CompanyType.updateValueAndValidity();
    this.WebsiteUrl.updateValueAndValidity();
    this.FirstName.updateValueAndValidity();
    this.LastName.updateValueAndValidity();
  }

  getUserProfiles(): void {
    this.spinner.show();
    setTimeout(() => {
      this.service.loadUserProfile().pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (res: any) => {
          this.userProfiles = res.recordInfo;
          this.userId = this.userProfiles.id;
          this.url = this.userProfiles.profilePicUrl;
          this.notifier.notifyUserData(this.userProfiles);
          this.spinner.hide();
          this.MapDataIntoForm();
          
          // Don't update sidenav when loading profile data - only on save
          
          if (this.userProfiles?.userType === 'Developer' || 
              this.userProfiles?.userType === 'Owner' || 
              this.userProfiles?.userType === 'Broker') {
            this.UserType.disable();
            this.CompanyName.disable();
          }
        },
        error: (err: any) => {
          this.swalToast.showToast(err, 'error');
          this.spinner.hide();
        }
      });
    }, 500);
  }

  MapDataIntoForm(): void {
    this.FirstName.setValue(this.userProfiles.firstName);
    this.LastName.setValue(this.userProfiles.lastName);
    this.Email.setValue(this.userProfiles.email);
    this.MobCode.setValue(this.userProfiles.countryCode);
    this.MobileNo.setValue(this.userProfiles.phoneNo);
    
    const userType = this.userProfiles.userType;
    if (userType && userType.toLowerCase() === 'user') {
      this.UserType.setValue(null);
    } else {
      this.UserType.setValue(userType);
      // Don't update sidenav when mapping form data - only on save
    }

    if (this.userProfiles?.userType === 'Developer') {
      this.CompanyName.setValue(this.userProfiles?.companyDetail?.companyName);
      this.CompanyAddr.setValue(this.userProfiles?.companyDetail?.companyAddress);
      this.CompanyType.setValue(this.userProfiles?.companyDetail?.companyType);
      this.WebsiteUrl.setValue(this.userProfiles?.companyDetail?.websiteUrl);
    }
  }

  mapFormData(): void {
    this.userProfiles.firstName = this.FirstName.value;
    this.userProfiles.lastName = this.LastName.value;
    this.userProfiles.countryCode = this.MobCode.value;
    this.userProfiles.phoneNo = this.MobileNo.value;
    this.userProfiles.email = this.Email.value;
    this.userProfiles.userType = this.UserType.value;

    if (this.UserType.value === 'Company') {
      this.userProfiles.companyDetail = {
        companyType: this.CompanyType?.value || null,
        companyName: this.CompanyName.value || null,
        companyAddress: this.CompanyAddr.value || null,
        websiteUrl: this.WebsiteUrl.value || null
      };
    } else {
      this.userProfiles.companyDetail = {};
    }
  }

  onSubmitUserProfileData(): void {
    this.btnSubmitted = true;
    
    if (this.userProfileForm.invalid) {
      return;
    }

    this.mapFormData();

    const { companyDetail, ...userProfile } = this.userProfiles;
    const mergedUserProfile = {
      ...userProfile,
      ...companyDetail
    };

    this.spinner.show();
    this.service.updateUserProfile(mergedUserProfile).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        if (res.headers.statusCode == 200) {
          this.swalToast.showToast(res.headers.message, 'success');
          
          // NOW update sidenav - only after successful save
          console.log('🔄 Updating sidenav after successful profile save...');
          console.log('📋 UserType value:', this.UserType.value);
          
          // Update role first
          this.updateUserRoleInSession(this.UserType.value);
          
          // Then update name
          this.updateUserNameInSession();
          
          console.log('✅ Sidenav updates sent to NotifierService');
          
          // Add a small delay to ensure sidenav updates are processed before navigation
          setTimeout(() => {
            // Load fresh profile data and send to header for "Hi [userName]" display
            this.loadProfileDataForHeader();
          }, 200);
          
          this.spinner.hide();
          this.resetFormData();
        } else {
          const error = res?.error?.errorList;
          if (error !== undefined && error !== null && Object.keys(error)) {
            Object.keys(error).map(key => {
              this.userProfileForm.get(key)?.setErrors({ error: error[key] });
            });
          } else {
            this.swalToast.showToast(res?.error?.headers?.message, 'info');
          }
          this.spinner.hide();
        }
      },
      error: (err) => {
        const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
        this.swalToast.showToast(errList, 'error');
        this.spinner.hide();
      },
      complete: () => {
        this.getUserProfiles();
      }
    });
  }

  resetFormData(): void {
    this.btnSubmitted = false;
    this.userProfileForm.reset();
  }

  /**
   * Load profile data and send to header for "Hi [userName]" display
   * Then navigate to home page
   */
  private loadProfileDataForHeader(): void {
    console.log('🔄 Loading profile data for header after profile save...');

    this.service.loadUserProfile().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (profile) => {
        console.log('✅ Profile data loaded for header:', profile);
        
        if (profile && profile.recordInfo) {
          // Send actual user profile data to header (not the new registration flag)
          this.notifier.notifyUserData(profile.recordInfo);
          console.log('📤 User profile data sent to header for "Hi [userName]" display');
        }
        
        // Navigate to home page after profile data is sent
        setTimeout(() => {
          this.router.navigateByUrl(RoutePath.HOME);
        }, 500);
      },
      error: (err) => {
        console.error('Failed to load profile data for header:', err);
        // Still navigate to home even if profile loading fails
        setTimeout(() => {
          this.router.navigateByUrl(RoutePath.HOME);
        }, 500);
      }
    });
  }

  onSelectFile(event: any): void {
    if (event.target.files[0]) {
      const file = event.target.files[0];
      const fileSize = file.size / 1024 / 1024;

      console.log('📤 Edit Profile: Preparing to upload file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeInMB: fileSize
      });

      if (['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        if (fileSize < 2) {
          const formData: FormData = new FormData();
          formData.append('profilePicture', file);
          
          // Ensure userId is available
          if (this.userId) {
            formData.append('userId', this.userId);
          } else {
            console.warn('Edit Profile: No userId available for upload');
          }
          
          console.log('Edit Profile: FormData prepared with fields:', Array.from(formData.keys()));

          this.spinner.show();
          this.service.updateProfilePicture(formData).pipe(
            takeUntilDestroyed(this.destroyRef)
          ).subscribe({
            next: res => {
              if (res.headers.statusCode == 200) {
                this.swalToast.showToast('Profile Picture Successfully Updated', 'success');
                this.spinner.hide();
                this.getUserProfiles();
              } else {
                this.swalToast.showToast(res.headers.message, 'error');
                this.spinner.hide();
              }
            },
            error: (err) => {
              console.error('Edit Profile: Upload failed:', err);
              
              let errorMessage = 'Failed to upload profile picture';
              
              if (err.message) {
                errorMessage = err.message;
              } else if (err.error?.headers?.message) {
                errorMessage = err.error.headers.message;
              } else if (err.error?.message) {
                errorMessage = err.error.message;
              }
              
              this.swalToast.showToast(errorMessage, 'error');
              this.spinner.hide();
            }
          });
        } else {
          this.swalToast.showToast('Image File Size Limit is 2 MB', 'info');
        }
      } else {
        this.swalToast.showToast('Invalid File Format! Valid: jpeg, jpg, png and gif', 'warning');
      }
    }
    event.target.value = "";
  }

  deleteImage(url: any): void {
    Swal.fire({
      title: 'Are you sure want to remove this picture?',
      text: 'You will not be able to recover this image!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      showCloseButton: false
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteReq = {
          userId: this.userId,
          filePath: url
        };


        this.service.deleteProfilePicture(deleteReq).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: res => {
            this.swalToast.showToast('Your image has been deleted.', 'success');
            this.getUserProfiles();
          },
          error: err => {
            const error = String(err).replace(/[{}]/g, '');
            this.swalToast.showToast(error, 'error');
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        this.swalToast.showToast('Your image is safe.', 'info');
      }
    });
  }

  showReason(): void {
    Swal.fire({
      title: '<span style="font-size: 15px; text-align:left;padding:0px;margin:0px;">Make sure when update your role and company name. Once Save we can\'t change.</span>',
      html: '<div style="font-size: 14px;padding:0;margin:0;">' + '</div>',
      icon: 'info',
      position: 'center',
      confirmButtonText: 'OK'
    });
  }

  // Form Control Getters
  get f(): { [key: string]: AbstractControl } {
    return this.userProfileForm.controls;
  }

  get FirstName(): FormControl {
    return this.userProfileForm.get('firstName') as FormControl;
  }

  get LastName(): FormControl {
    return this.userProfileForm.get('lastName') as FormControl;
  }

  get Email(): FormControl {
    return this.userProfileForm.get('email') as FormControl;
  }

  get MobCode(): FormControl {
    return this.userProfileForm.get('mobCode') as FormControl;
  }

  get MobileNo(): FormControl {
    return this.userProfileForm.get('mobileNo') as FormControl;
  }

  get UserType(): FormControl {
    return this.userProfileForm.get('userType') as FormControl;
  }

  get CompanyName(): FormControl {
    return this.userProfileForm.get('companyName') as FormControl;
  }

  get CompanyAddr(): FormControl {
    return this.userProfileForm.get('companyAddr') as FormControl;
  }

  get CompanyType(): FormControl {
    return this.userProfileForm.get('companyType') as FormControl;
  }

  get WebsiteUrl(): FormControl {
    return this.userProfileForm.get('websiteUrl') as FormControl;
  }
}