import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, FormControl, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { RoutePath } from '../../../../core/constant/api.constant';
import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../../services/Notifier-service/notifier.service';
import { ToastService } from '../../../../services/Toast-service/toast.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { MapLocation } from '../../../map-location/map-location';
import { effect } from '@angular/core';


@Component({
  selector: 'app-property-location',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    MapLocation
    
  ],
  templateUrl: './property-location.html',
  styleUrls: ['./property-location.scss']
})
export class PropertyLocation implements OnInit, OnDestroy {
  @Input() selectedPropertyData: any;
  @Output() promptFromChild: any = new EventEmitter<void>();
  
  // ViewChild to access the map component
  @ViewChild('mapLocationComponent') mapLocationComponent!: MapLocation;

  addrDetailForm!: FormGroup;
  btnSubmitted: boolean = false;
  canDisablePublishProperty: boolean = false;
  propertyId: any;
  states: any[] = [];
  countryCodes: any[] = [];
  private dataSubscription: Subscription = new Subscription();

  selectedFile: File | null = null;
  url: any;
  showMarkOnMapModal: boolean = false;
  displayMarkOnMapModal: any = 'none';

  constructor(
    private fb: FormBuilder,
    private service: ManagePropertyService,
    private spinner: NgxSpinnerService,
    private notifier: NotifierService,
    private swalToast: ToastService,
    private router: Router,
    private http: HttpClient,

    


  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadInitialData();
    this.setupFormListeners();

    // Clear state validators initially
    this.addrDetailForm.get('state')?.clearValidators();
    this.State.clearValidators();
  }

  onCityBlur() {
  this.mapLocationComponent.triggerAddressUpdate();
}


  initializeForm(): void {
    this.addrDetailForm = this.fb.group({
      floor: [null, [Validators.pattern('^[0-9]{1,5}(\\.[0-9]{1,2})?$')]],
      addressLine1: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'),
        Validators.maxLength(200)
      ]],
      addrLine2: ['', [
        Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'),
        Validators.maxLength(200)
      ]],
      addrLine3: ['', [
        Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'),
        Validators.maxLength(200)
      ]],
      country: ['India', Validators.required],
      state: ['Tamil Nadu', Validators.required],
      city: ['Nagercoil', [
        Validators.required,
        Validators.pattern('^[a-zA-Z\\s]*$'),
        Validators.maxLength(35)
      ]],
      landMark: ['NH944', [
        Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'),
        Validators.maxLength(200)
      ]],
      zipCode: ['629001', [
        Validators.required,
        Validators.pattern('^[0-9]{3,7}$')
      ]],
      latitude: [''],
      longitude: ['']
    });
  }

  loadInitialData(): void {
    this.countryCodes = this.service.getCountryCodes();
    this.states = this.service.getStates();
    this.propertyId = this.selectedPropertyData?.id;

    this.notifier.canDisablePublishToSite$.subscribe(res => {
      this.canDisablePublishProperty = res;
    });

    // Only load existing address data if we're editing an existing property
    // For new properties, keep addressLine1 empty
    if (this.selectedPropertyData?.addressInfo && this.propertyId) {
      // Patch form with existing data but keep addressLine1 empty for user input
      const addressData = { ...this.selectedPropertyData.addressInfo };
      
      // Always keep addressLine1 empty - user should enter their own address
      delete addressData.addressLine1;
      
      console.log('📋 Loading existing address data (excluding addressLine1):', addressData);
      this.addrDetailForm.patchValue(addressData);
    } else {
      console.log('📝 New property - keeping addressLine1 empty');
    }
  }

  setupFormListeners(): void {
    // Listen to form changes and notify publish button state
    this.addrDetailForm.valueChanges
      .pipe(debounceTime(2000), distinctUntilChanged())
      .subscribe(() => this.onNotifyPublishToSite());

    // Listen to city changes and update map
    this.addrDetailForm.get('city')?.valueChanges
      .pipe(debounceTime(1500), distinctUntilChanged())
      .subscribe(() => {
        if (this.mapLocationComponent) {
          this.mapLocationComponent.triggerAddressUpdate();
        }
      });

    // Listen to property ID changes
    this.notifier.propertyID$.subscribe(res => {
      console.log(res, "property ID from notifier");
    });
  }

  // Receive location updates from map component
  onLocationUpdate(event: { latitude: number; longitude: number; addressDetails: any }): void {
    console.log('Received from Map Component:', event);
    
    // Update form with location data from map
    this.addrDetailForm.patchValue({
      ...event.addressDetails,
      latitude: event.latitude,
      longitude: event.longitude
    });
  }

  onNotifyPublishToSite(): void {
    this.canDisablePublishProperty = this.addrDetailForm.invalid;
    this.notifier.notifyDisablePublishToSite(this.canDisablePublishProperty);
  }

  onSubmitAddressDetail(): void {
    this.btnSubmitted = true;

    console.log("Form Status:", this.addrDetailForm.status);
    console.log("Form Value:", this.addrDetailForm.value);

    if (this.addrDetailForm.invalid) {
      console.warn("Form is invalid. Submission stopped.");
      this.swalToast.showToast("Please fill all required fields correctly.", 'error');
      
      // Mark all fields as touched to show errors
      Object.keys(this.addrDetailForm.controls).forEach(key => {
        this.addrDetailForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.spinner.show();

    const rawData = this.addrDetailForm.value;

    // Prepare data payload for API
    const formData = {
      ...rawData,
      landmark: rawData.landMark,
      zipcode: rawData.zipCode,
      propertyId: this.propertyId
    };

    // Remove temporary fields
    delete formData.landMark;
    delete formData.zipCode;

    this.service.saveAddressDetail(formData).subscribe({
      next: (res) => {
        console.log('Full API Response:', res);

        const statusCode = res?.statusCode || res?.headers?.statusCode || res?.code;
        const message = res?.message || res?.headers?.message || 'Success';

        if (statusCode == 200) {
          this.swalToast.showToast(message, 'success');
          this.promptFromChild.emit();
          this.spinner.hide();
        } else {
          const errorList = res?.errorList || {};
          const errorMessages = Object.values(errorList).join(', ') || 'An unexpected error occurred';
          this.swalToast.showToast(errorMessages, 'error');
          this.spinner.hide();
        }
      },
      error: (err) => {
        console.error('API Error:', err);
        const errList = err?.error || {};
        const errorMessages = Object.values(errList).join(', ') || 'API request failed';
        this.swalToast.showToast(errorMessages, 'error');
        this.spinner.hide();
      }
    });
  }

  onChangeCountry(event: any): void {
    const value = event.target.value;
    
    // Clear dependent fields when country changes
    // this.addrDetailForm.patchValue({
    //   city: '',
    //   state: '',
    //   zipCode: '',
    //   landMark: ''
    // });

    // Set state validators based on country selection
    if (value === 'India') {
      this.addrDetailForm.get('state')?.setValidators([Validators.required]);
    } else {
      this.addrDetailForm.get('state')?.clearValidators();
    }

    this.addrDetailForm.get('state')?.updateValueAndValidity();
    
    // Trigger map update
    if (this.mapLocationComponent) {
      this.mapLocationComponent.triggerAddressUpdate();
    }
  }

  onSelectStateChange(event: any): void {
    const state = event.target.value;

    this.addrDetailForm.patchValue({
      state: state,
      city: '',
      zipCode: '',
      landMark: ''
    });
    
    // Trigger map update
    if (this.mapLocationComponent) {
      this.mapLocationComponent.triggerAddressUpdate();
    }
  }

  onPublishToSite(): void {
    Swal.fire({
      title: 'Do you want to publish this Property?',
      text: 'Once you published, Admin will verify the property',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Yes, publish it!',
      cancelButtonText: 'No, keep it',
      showCloseButton: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.spinner.show();
        this.service.publishProperty(this.propertyId).subscribe({
          next: (res) => {
            if (res.headers.statusCode == 200) {
              this.swalToast.showToast(res.headers.message, 'success');
              this.spinner.hide();
              this.router.navigateByUrl(RoutePath.MY_PROPERTIES);
            } else {
              this.swalToast.showToast(res.headers.message, 'error');
              this.spinner.hide();
            }
          },
          error: (err) => {
            const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
            this.swalToast.showToast(errList, 'error');
            this.spinner.hide();
          }
        });
      }
    });
  }

  clearData(): void {
    this.resetFormData();
    this.onNotifyPublishToSite();

    // Reset map component
    if (this.mapLocationComponent) {
      this.mapLocationComponent.resetMap();
    }
    console.log('Cleared map and form data');
  }

  resetFormData(): void {
    this.btnSubmitted = false;

    // Reset all form values with addressLine1 kept empty
    this.addrDetailForm.reset({
      floor: null,
      addressLine1: '', // Keep empty - user should enter their own address
      addrLine2: '',
      addrLine3: '',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Nagercoil',
      landMark: 'NH944',
      zipCode: '629001',
      latitude: null,
      longitude: null
    });

    console.log('🔄 Form reset - addressLine1 kept empty');

    // Clear all validators
    Object.keys(this.addrDetailForm.controls).forEach(controlName => {
      const control = this.addrDetailForm.get(controlName);
      control?.clearValidators();
      control?.updateValueAndValidity();
    });

    // Re-apply required validators
    this.addrDetailForm.get('addressLine1')?.setValidators([
      Validators.required,
      Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'),
      Validators.maxLength(200)
    ]);
    this.addrDetailForm.get('city')?.setValidators([
      Validators.required,
      Validators.pattern('^[a-zA-Z\\s]*$'),
      Validators.maxLength(35)
    ]);
    this.addrDetailForm.get('country')?.setValidators([Validators.required]);
    this.addrDetailForm.get('zipCode')?.setValidators([
      Validators.required,
      Validators.pattern('^[0-9]{3,7}$')
    ]);
    this.addrDetailForm.get('state')?.setValidators(
      this.Country?.value === 'India' ? [Validators.required] : []
    );

    // Update validity after setting validators
    Object.keys(this.addrDetailForm.controls).forEach(controlName => {
      this.addrDetailForm.get(controlName)?.updateValueAndValidity();
    });

    // Mark the form as pristine and untouched
    this.addrDetailForm.markAsPristine();
    this.addrDetailForm.markAsUntouched();
    this.addrDetailForm.updateValueAndValidity();
  }

  ngOnDestroy(): void {
    this.dataSubscription.unsubscribe();
  }

  // Form Control Getters
  get f(): { [key: string]: AbstractControl } {
    return this.addrDetailForm.controls;
  }

  getControl(name: string): AbstractControl {
    return this.addrDetailForm.controls[name];
  }

  get Country(): FormControl {
    return this.addrDetailForm.get('country') as FormControl;
  }

  get State(): FormControl {
    return this.addrDetailForm.get('state') as FormControl;
  }

  get City(): FormControl {
    return this.addrDetailForm.get('city') as FormControl;
  }

  get Landmark(): FormControl {
    return this.addrDetailForm.get('landMark') as FormControl;
  }

  get Latitude(): FormControl {
    return this.addrDetailForm.get('latitude') as FormControl;
  }

  get Longitude(): FormControl {
    return this.addrDetailForm.get('longitude') as FormControl;
  }

  // Reactive getters for map component bindings
  get currentCity(): string {
    return this.addrDetailForm.get('city')?.value || 'Nagercoil';
  }

  get currentState(): string {
    return this.addrDetailForm.get('state')?.value || 'Tamil Nadu';
  }

  get currentCountry(): string {
    return this.addrDetailForm.get('country')?.value || 'India';
  }

  get currentLandmark(): string {
    return this.addrDetailForm.get('landMark')?.value || 'NH944';
  }

  get currentZipCode(): string {
    return this.addrDetailForm.get('zipCode')?.value || '629001';
  }

  get currentLatitude(): number {
    return this.addrDetailForm.get('latitude')?.value || 8.1906;
  }

  get currentLongitude(): number {
    return this.addrDetailForm.get('longitude')?.value || 77.4356;
  }
}