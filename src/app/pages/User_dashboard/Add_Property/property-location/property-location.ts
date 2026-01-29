// import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormGroup, FormBuilder, FormControl, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
// import { Router } from '@angular/router';
// import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
// import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
// import { RoutePath } from '../../../../core/constant/api.constant';
// import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
// import { NotifierService } from '../../../../services/Notifier-service/notifier.service';
// import { ToastService } from '../../../../services/Toast-service/toast.service';
// import Swal from 'sweetalert2';
// import { HttpClient } from '@angular/common/http';
// import { MapLocation } from '../../../map-location/map-location';
// import { effect } from '@angular/core';


// @Component({
//   selector: 'app-property-location',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     NgxSpinnerModule,
//     MapLocation
    
//   ],
//   templateUrl: './property-location.html',
//   styleUrls: ['./property-location.scss']
// })
// export class PropertyLocation implements OnInit, OnDestroy {
//   @Input() selectedPropertyData: any;
//   @Output() promptFromChild: any = new EventEmitter<void>();
  
//   // ViewChild to access the map component
//   @ViewChild('mapLocationComponent') mapLocationComponent!: MapLocation;

//   addrDetailForm!: FormGroup;
//   btnSubmitted: boolean = false;
//   canDisablePublishProperty: boolean = false;
//   propertyId: any;
//   states: any[] = [];
//   countryCodes: any[] = [];
//   private dataSubscription: Subscription = new Subscription();

//   selectedFile: File | null = null;
//   url: any;
//   showMarkOnMapModal: boolean = false;
//   displayMarkOnMapModal: any = 'none';

//   constructor(
//     private fb: FormBuilder,
//     private service: ManagePropertyService,
//     private spinner: NgxSpinnerService,
//     private notifier: NotifierService,
//     private swalToast: ToastService,
//     private router: Router,
//     private http: HttpClient,

    


//   ) {}

//   ngOnInit() {
//     this.initializeForm();
//     this.loadInitialData();
//     this.setupFormListeners();

//     // Clear state validators initially
//     this.addrDetailForm.get('state')?.clearValidators();
//     this.State.clearValidators();
//   }

//   onCityBlur() {
//   this.mapLocationComponent.triggerAddressUpdate();
// }


//   initializeForm(): void {
//     this.addrDetailForm = this.fb.group({
//       floor: [null, [Validators.pattern('^[0-9]{1,5}(\\.[0-9]{1,2})?$')]],
//       addressLine1: ['', [
//         Validators.required,
//         Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'),
//         Validators.maxLength(200)
//       ]],
//       addrLine2: ['', [
//         Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'),
//         Validators.maxLength(200)
//       ]],
//       addrLine3: ['', [
//         Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'),
//         Validators.maxLength(200)
//       ]],
//       country: ['India', Validators.required],
//       state: ['Tamil Nadu', Validators.required],
//       city: ['Nagercoil', [
//         Validators.required,
//         Validators.pattern('^[a-zA-Z\\s]*$'),
//         Validators.maxLength(35)
//       ]],
//       landMark: ['NH944', [
//         Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'),
//         Validators.maxLength(200)
//       ]],
//       zipCode: ['629001', [
//         Validators.required,
//         Validators.pattern('^[0-9]{3,7}$')
//       ]],
//       latitude: [''],
//       longitude: ['']
//     });
//   }

//   loadInitialData(): void {
//     this.countryCodes = this.service.getCountryCodes();
//     this.states = this.service.getStates();
//     this.propertyId = this.selectedPropertyData?.id;

//     this.notifier.canDisablePublishToSite$.subscribe(res => {
//       this.canDisablePublishProperty = res;
//     });

//     // Load existing address data if we're editing an existing property
//     if (this.selectedPropertyData?.addressInfo && this.propertyId) {
//       console.log('📋 Loading existing address data:', this.selectedPropertyData.addressInfo);
//       this.addrDetailForm.patchValue(this.selectedPropertyData.addressInfo);
//     } else {
//       console.log('📝 New property - form ready for input');
//       // Set default country to India for new properties
//       this.addrDetailForm.patchValue({
//         country: 'India'
//       });
//     }
//   }

//   setupFormListeners(): void {
//     // Listen to form changes and notify publish button state
//     this.addrDetailForm.valueChanges
//       .pipe(debounceTime(2000), distinctUntilChanged())
//       .subscribe(() => this.onNotifyPublishToSite());

//     // Listen to city changes and update map
//     this.addrDetailForm.get('city')?.valueChanges
//       .pipe(debounceTime(1500), distinctUntilChanged())
//       .subscribe(() => {
//         if (this.mapLocationComponent) {
//           this.mapLocationComponent.triggerAddressUpdate();
//         }
//       });

//     // Listen to property ID changes
//     this.notifier.propertyID$.subscribe(res => {
//       console.log(res, "property ID from notifier");
//     });
//   }

//   // Receive location updates from map component
//   onLocationUpdate(event: { latitude: number; longitude: number; addressDetails: any }): void {
//     console.log('Received from Map Component:', event);
    
//     // Update form with location data from map
//     this.addrDetailForm.patchValue({
//       ...event.addressDetails,
//       latitude: event.latitude,
//       longitude: event.longitude
//     });
//   }

//   onNotifyPublishToSite(): void {
//     this.canDisablePublishProperty = this.addrDetailForm.invalid;
//     this.notifier.notifyDisablePublishToSite(this.canDisablePublishProperty);
//   }

//   onSubmitAddressDetail(): void {
//     this.btnSubmitted = true;

//     console.log("Form Status:", this.addrDetailForm.status);
//     console.log("Form Value:", this.addrDetailForm.value);

//     if (this.addrDetailForm.invalid) {
//       console.warn("Form is invalid. Submission stopped.");
//       this.swalToast.showToast("Please fill all required fields correctly.", 'error');
      
//       // Mark all fields as touched to show errors
//       Object.keys(this.addrDetailForm.controls).forEach(key => {
//         this.addrDetailForm.get(key)?.markAsTouched();
//       });
//       return;
//     }

//     this.spinner.show();

//     const rawData = this.addrDetailForm.value;

//     // Prepare data payload for API
//     const formData = {
//       ...rawData,
//       landmark: rawData.landMark,
//       zipcode: rawData.zipCode,
//       propertyId: this.propertyId
//     };

//     // Remove temporary fields
//     delete formData.landMark;
//     delete formData.zipCode;

//     this.service.saveAddressDetail(formData).subscribe({
//       next: (res) => {
//         console.log('Full API Response:', res);

//         const statusCode = res?.statusCode || res?.headers?.statusCode || res?.code;
//         const message = res?.message || res?.headers?.message || 'Success';

//         if (statusCode == 200) {
//           this.swalToast.showToast(message, 'success');
//           this.promptFromChild.emit();
//           this.spinner.hide();
//         } else {
//           const errorList = res?.errorList || {};
//           const errorMessages = Object.values(errorList).join(', ') || 'An unexpected error occurred';
//           this.swalToast.showToast(errorMessages, 'error');
//           this.spinner.hide();
//         }
//       },
//       error: (err) => {
//         console.error('API Error:', err);
//         const errList = err?.error || {};
//         const errorMessages = Object.values(errList).join(', ') || 'API request failed';
//         this.swalToast.showToast(errorMessages, 'error');
//         this.spinner.hide();
//       }
//     });
//   }

//   onChangeCountry(event: any): void {
//     const value = event.target.value;
    
//     // Clear dependent fields when country changes
//     // this.addrDetailForm.patchValue({
//     //   city: '',
//     //   state: '',
//     //   zipCode: '',
//     //   landMark: ''
//     // });

//     // Set state validators based on country selection
//     if (value === 'India') {
//       this.addrDetailForm.get('state')?.setValidators([Validators.required]);
//     } else {
//       this.addrDetailForm.get('state')?.clearValidators();
//     }

//     this.addrDetailForm.get('state')?.updateValueAndValidity();
    
//     // Trigger map update
//     if (this.mapLocationComponent) {
//       this.mapLocationComponent.triggerAddressUpdate();
//     }
//   }

//   onSelectStateChange(event: any): void {
//     const state = event.target.value;

//     this.addrDetailForm.patchValue({
//       state: state,
//       city: '',
//       zipCode: '',
//       landMark: ''
//     });
    
//     // Trigger map update
//     if (this.mapLocationComponent) {
//       this.mapLocationComponent.triggerAddressUpdate();
//     }
//   }

//   onPublishToSite(): void {
//     Swal.fire({
//       title: 'Do you want to publish this Property?',
//       text: 'Once you published, Admin will verify the property',
//       icon: 'info',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, publish it!',
//       cancelButtonText: 'No, keep it',
//       showCloseButton: false
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.spinner.show();
//         this.service.publishProperty(this.propertyId).subscribe({
//           next: (res) => {
//             if (res.headers.statusCode == 200) {
//               this.swalToast.showToast(res.headers.message, 'success');
//               this.spinner.hide();
//               this.router.navigateByUrl(RoutePath.MY_PROPERTIES);
//             } else {
//               this.swalToast.showToast(res.headers.message, 'error');
//               this.spinner.hide();
//             }
//           },
//           error: (err) => {
//             const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
//             this.swalToast.showToast(errList, 'error');
//             this.spinner.hide();
//           }
//         });
//       }
//     });
//   }

//   clearData(): void {
//     this.resetFormData();
//     this.onNotifyPublishToSite();

//     // Reset map component
//     if (this.mapLocationComponent) {
//       this.mapLocationComponent.resetMap();
//     }
//     console.log('Cleared map and form data');
//   }

//   resetFormData(): void {
//     this.btnSubmitted = false;

//     // Reset all form values with addressLine1 kept empty
//     this.addrDetailForm.reset({
//       floor: null,
//       addressLine1: '', // Keep empty - user should enter their own address
//       addrLine2: '',
//       addrLine3: '',
//       country: 'India',
//       state: 'Tamil Nadu',
//       city: 'Nagercoil',
//       landMark: 'NH944',
//       zipCode: '629001',
//       latitude: null,
//       longitude: null
//     });

//     console.log('🔄 Form reset - addressLine1 kept empty');

//     // Clear all validators
//     Object.keys(this.addrDetailForm.controls).forEach(controlName => {
//       const control = this.addrDetailForm.get(controlName);
//       control?.clearValidators();
//       control?.updateValueAndValidity();
//     });

//     // Re-apply required validators
//     this.addrDetailForm.get('addressLine1')?.setValidators([
//       Validators.required,
//       Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'),
//       Validators.maxLength(200)
//     ]);
//     this.addrDetailForm.get('city')?.setValidators([
//       Validators.required,
//       Validators.pattern('^[a-zA-Z\\s]*$'),
//       Validators.maxLength(35)
//     ]);
//     this.addrDetailForm.get('country')?.setValidators([Validators.required]);
//     this.addrDetailForm.get('zipCode')?.setValidators([
//       Validators.required,
//       Validators.pattern('^[0-9]{3,7}$')
//     ]);
//     this.addrDetailForm.get('state')?.setValidators(
//       this.Country?.value === 'India' ? [Validators.required] : []
//     );

//     // Update validity after setting validators
//     Object.keys(this.addrDetailForm.controls).forEach(controlName => {
//       this.addrDetailForm.get(controlName)?.updateValueAndValidity();
//     });

//     // Mark the form as pristine and untouched
//     this.addrDetailForm.markAsPristine();
//     this.addrDetailForm.markAsUntouched();
//     this.addrDetailForm.updateValueAndValidity();
//   }

//   ngOnDestroy(): void {
//     this.dataSubscription.unsubscribe();
//   }

//   // Form Control Getters
//   get f(): { [key: string]: AbstractControl } {
//     return this.addrDetailForm.controls;
//   }

//   getControl(name: string): AbstractControl {
//     return this.addrDetailForm.controls[name];
//   }

//   get Country(): FormControl {
//     return this.addrDetailForm.get('country') as FormControl;
//   }

//   get State(): FormControl {
//     return this.addrDetailForm.get('state') as FormControl;
//   }

//   get City(): FormControl {
//     return this.addrDetailForm.get('city') as FormControl;
//   }

//   get Landmark(): FormControl {
//     return this.addrDetailForm.get('landMark') as FormControl;
//   }

//   get Latitude(): FormControl {
//     return this.addrDetailForm.get('latitude') as FormControl;
//   }

//   get Longitude(): FormControl {
//     return this.addrDetailForm.get('longitude') as FormControl;
//   }

//   // Reactive getters for map component bindings
//   get currentCity(): string {
//     return this.addrDetailForm.get('city')?.value || 'Nagercoil';
//   }

//   get currentState(): string {
//     return this.addrDetailForm.get('state')?.value || 'Tamil Nadu';
//   }

//   get currentCountry(): string {
//     return this.addrDetailForm.get('country')?.value || 'India';
//   }

//   get currentLandmark(): string {
//     return this.addrDetailForm.get('landMark')?.value || 'NH944';
//   }

//   get currentZipCode(): string {
//     return this.addrDetailForm.get('zipCode')?.value || '629001';
//   }

//   get currentLatitude(): number {
//     return this.addrDetailForm.get('latitude')?.value || 8.1906;
//   }

//   get currentLongitude(): number {
//     return this.addrDetailForm.get('longitude')?.value || 77.4356;
//   }
// }


// import {
//   Component,
//   OnInit,
//   OnDestroy,
//   Input,
//   Output,
//   EventEmitter,
//   ViewChild,
//   inject,
//   signal,
//   computed,
//   effect
// } from '@angular/core';
// import {
//   FormGroup,
//   FormBuilder,
//   FormControl,
//   Validators,
//   AbstractControl,
//   ReactiveFormsModule,
// } from '@angular/forms';
// import { Router } from '@angular/router';
// import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
// import { debounceTime, distinctUntilChanged, Subscription, Subject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';
// import { RoutePath } from '../../../../core/constant/api.constant';
// import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
// import { NotifierService } from '../../../../services/Notifier-service/notifier.service';
// import { ToastService } from '../../../../services/Toast-service/toast.service';
// import Swal from 'sweetalert2';
// import { HttpClient } from '@angular/common/http';
// import { MapLocation } from '../../../map-location/map-location';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-property-location',
//   templateUrl: './property-location.html',
//   styleUrls: ['./property-location.scss'],
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule, MapLocation]
// })
// export class PropertyLocation implements OnInit, OnDestroy {
//   // Dependency Injection using Angular 20's inject()
//   private fb = inject(FormBuilder);
//   private service = inject(ManagePropertyService);
//   private spinner = inject(NgxSpinnerService);
//   private notifier = inject(NotifierService);
//   private swalToast = inject(ToastService);
//   private router = inject(Router);
//   private http = inject(HttpClient);

//   // Inputs and Outputs
//   @Input() selectedPropertyData: any;
//   @Output() promptFromChild: EventEmitter<void> = new EventEmitter<void>();
  
//   // ViewChild for map component
//   @ViewChild('mapLocationComponent') mapLocationComponent!: MapLocation;

//   // Form and validation
//   addrDetailForm!: FormGroup;
//   btnSubmitted = signal(false);
//   canDisablePublishProperty = signal(false);

//   // Data properties
//   propertyId: any;
//   states: any[] = [];
//   countryCodes: any[] = [];

//   // Computed properties for current form values (for map component inputs)
//   currentCity = computed(() => this.addrDetailForm?.get('city')?.value || '');
//   currentState = computed(() => this.addrDetailForm?.get('state')?.value || '');
//   currentCountry = computed(() => this.addrDetailForm?.get('country')?.value || '');
//   currentZipCode = computed(() => this.addrDetailForm?.get('zipCode')?.value || '');
//   currentLandmark = computed(() => this.addrDetailForm?.get('landMark')?.value || '');
//   currentLatitude = computed(() => this.addrDetailForm?.get('latitude')?.value || null);
//   currentLongitude = computed(() => this.addrDetailForm?.get('longitude')?.value || null);

//   // Cleanup
//   private destroy$ = new Subject<void>();
//   private dataSubscription: Subscription = new Subscription();

//   constructor() {}

//   // Getters for form controls
//   get f(): { [key: string]: AbstractControl } {
//     return this.addrDetailForm.controls;
//   }

//   getControl(name: string): AbstractControl {
//     return this.addrDetailForm.controls[name];
//   }

//   get Country(): FormControl {
//     return this.addrDetailForm.get('country') as FormControl;
//   }

//   get State(): FormControl {
//     return this.addrDetailForm.get('state') as FormControl;
//   }

//   get Landmark(): FormControl {
//     return this.addrDetailForm.get('landMark') as FormControl;
//   }

//   get Latitude(): FormControl {
//     return this.addrDetailForm.get('latitude') as FormControl;
//   }

//   get Longitude(): FormControl {
//     return this.addrDetailForm.get('longitude') as FormControl;
//   }

//   ngOnInit(): void {
//     console.log('🚀 PropertyLocationsComponent initialized');
//     this.initializeForm();
//     this.loadInitialData();
//     this.setupFormListeners();
//   }

//   /**
//    * Initialize the address form with validators
//    */
//   private initializeForm(): void {
//     this.addrDetailForm = this.fb.group({
//       floor: [null, [Validators.pattern('^[0-9]{1,5}$')]],
//       addressLine1: [
//         '', 
//         [
//           Validators.required, 
//           Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'), 
//           Validators.maxLength(200)
//         ]
//       ],
//       addrLine2: [
//         '', 
//         [
//           Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'), 
//           Validators.maxLength(200)
//         ]
//       ],
//       addrLine3: [
//         '', 
//         [
//           Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'), 
//           Validators.maxLength(200)
//         ]
//       ],
//       country: ['', Validators.required],
//       state: ['', Validators.required],
//       city: [
//         '', 
//         [
//           Validators.required, 
//           Validators.pattern('^[a-zA-Z\\s]*$'), 
//           Validators.maxLength(35)
//         ]
//       ],
//       landMark: [
//         '', 
//         [
//           Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'), 
//           Validators.maxLength(100)
//         ]
//       ],
//       zipCode: [
//         '', 
//         [
//           Validators.required, 
//           Validators.pattern('^[0-9]{3,7}$')
//         ]
//       ],
//       latitude: [''],
//       longitude: [''],
//     });

//     // Initially clear state validators (will be set based on country selection)
//     this.State.clearValidators();
//     this.State.updateValueAndValidity();

//     console.log('✅ Form initialized with validators');
//   }

//   /**
//    * Load initial data (countries, states, property data)
//    */
//   private loadInitialData(): void {
//     // Load country codes and states
//     this.countryCodes = this.service.getCountryCodes();
//     this.states = this.service.getStates();
    
//     console.log('📦 Loaded countries:', this.countryCodes.length);
//     console.log('📦 Loaded states:', this.states.length);

//     // Get property ID from selected property data
//     this.propertyId = this.selectedPropertyData?.id;
//     console.log('🏠 Property ID:', this.propertyId);

//     // Subscribe to publish button disable state
//     this.notifier.canDisablePublishToSite$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(res => {
//         this.canDisablePublishProperty.set(res);
//       });

//     // Patch form if property data exists
//     if (this.selectedPropertyData?.addressInfo) {
//       console.log('🔄 Patching form with existing address data');
//       this.addrDetailForm.patchValue(this.selectedPropertyData.addressInfo);
      
//       // Set state validators if country is India
//       if (this.selectedPropertyData.addressInfo.country === 'India') {
//         this.State.setValidators([Validators.required]);
//         this.State.updateValueAndValidity();
//       }
//     }
//   }

//   /**
//    * Setup form value change listeners
//    */
//   private setupFormListeners(): void {
//     // Listen to overall form changes for publish button state
//     this.addrDetailForm.valueChanges
//       .pipe(
//         debounceTime(2000),
//         distinctUntilChanged(),
//         takeUntil(this.destroy$)
//       )
//       .subscribe(() => {
//         this.onNotifyPublishToSite();
//       });

//     // Listen to property ID changes
//     this.notifier.propertyID$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(res => {
//         console.log('🆔 Property ID updated:', res);
//       });

//     console.log('👂 Form listeners configured');
//   }

//   /**
//    * Handle city blur event to trigger map update
//    */
//   onCityBlur(): void {
//     console.log('🗺️ City blur - checking if map update is needed');
    
//     // Only trigger map update if the city value has actually changed and is not empty
//     const currentCity = this.addrDetailForm.get('city')?.value;
//     if (currentCity && currentCity.trim() !== '') {
//       console.log('🗺️ City has value, triggering map update');
//       if (this.mapLocationComponent) {
//         // Small delay to ensure form value is updated
//         setTimeout(() => {
//           this.mapLocationComponent.triggerAddressUpdate();
//         }, 300); // Increased delay to give user time to finish typing
//       }
//     } else {
//       console.log('🗺️ City is empty, skipping map update');
//     }
//   }

//   /**
//    * Handle location updates from map component
//    */
//   onLocationUpdate(event: {
//     latitude: number;
//     longitude: number;
//     addressDetails: any;
//   }): void {
//     console.log('📍 Location updated from map:', event);
    
//     // Only update coordinates and empty fields to avoid overwriting user input
//     const currentFormValue = this.addrDetailForm.value;
//     const updateData: any = {
//       latitude: event.latitude,
//       longitude: event.longitude
//     };
    
//     // Only update address fields if they are currently empty or if the user hasn't modified them
//     if (event.addressDetails) {
//       // Only update city if current city is empty
//       if (!currentFormValue.city || currentFormValue.city.trim() === '') {
//         updateData.city = event.addressDetails.city || '';
//       }
      
//       // Only update state if current state is empty
//       if (!currentFormValue.state || currentFormValue.state.trim() === '') {
//         updateData.state = event.addressDetails.state || '';
//       }
      
//       // Only update country if current country is empty
//       if (!currentFormValue.country || currentFormValue.country.trim() === '') {
//         updateData.country = event.addressDetails.country || '';
//       }
      
//       // Only update zipCode if current zipCode is empty
//       if (!currentFormValue.zipCode || currentFormValue.zipCode.trim() === '') {
//         updateData.zipCode = event.addressDetails.zipCode || '';
//       }
      
//       // Only update landmark if current landmark is empty
//       if (!currentFormValue.landMark || currentFormValue.landMark.trim() === '') {
//         updateData.landMark = event.addressDetails.landMark || '';
//       }
//     }
    
//     console.log('📝 Updating form with selective data:', updateData);
    
//     // Update form with selective data
//     this.addrDetailForm.patchValue(updateData, { emitEvent: false }); // Don't emit event to avoid circular updates
//   }

//   /**
//    * Notify parent about publish button state
//    */
//   private onNotifyPublishToSite(): void {
//     const isInvalid = this.addrDetailForm.invalid;
//     this.canDisablePublishProperty.set(isInvalid);
//     this.notifier.notifyDisablePublishToSite(isInvalid);
//   }

//   /**
//    * Handle form submission
//    */
//   onSubmitAddressDetail(): void {
//     this.btnSubmitted.set(true);

//     console.log('📤 Form submission started');
//     console.log('Form Status:', this.addrDetailForm.status);
//     console.log('Form Valid:', this.addrDetailForm.valid);
//     console.log('Form Value:', this.addrDetailForm.value);

//     // Validate form
//     if (this.addrDetailForm.invalid) {
//       console.warn('⚠️ Form is invalid - stopping submission');
//       this.swalToast.showToast('Please fill all required fields correctly.', 'error');
      
//       // Mark all fields as touched to show validation errors
//       Object.keys(this.addrDetailForm.controls).forEach(key => {
//         this.addrDetailForm.get(key)?.markAsTouched();
//       });
      
//       return;
//     }

//     this.spinner.show();

//     const rawData = this.addrDetailForm.value;

//     // Prepare data payload
//     const formData = {
//       ...rawData,
//       landmark: rawData.landMark, // Map landMark to landmark for API
//       zipcode: rawData.zipCode,   // Map zipCode to zipcode for API
//       propertyId: this.propertyId
//     };

//     // Remove temporary fields that were mapped
//     delete formData.landMark;
//     delete formData.zipCode;

//     console.log('📡 Sending address data to API:', formData);

//     // Call the API
//     this.service.saveAddressDetail(formData)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (res) => {
//           console.log('✅ API Response:', res);

//           // Check for success - handle different response structures
//           const statusCode = res?.statusCode || res?.headers?.statusCode || res?.code;
//           const message = res?.message || res?.headers?.message || 'Address details saved successfully';

//           if (statusCode == 200 || statusCode == '200') {
//             this.swalToast.showToast(message, 'success');
//             this.promptFromChild.emit(); // Notify parent component
//             this.btnSubmitted.set(false); // Reset submission state
//           } else {
//             const errorList = res?.errorList || {};
//             const errorMessages = Object.values(errorList).join(', ') || 'An unexpected error occurred';
//             this.swalToast.showToast(errorMessages, 'error');
//           }
          
//           this.spinner.hide();
//         },
//         error: (err) => {
//           console.error('❌ API Error:', err);
          
//           const errorMessage = err.message || 'Failed to save address details';
//           this.swalToast.showToast(errorMessage, 'error');
//           this.spinner.hide();
//         }
//       });
//   }

//   /**
//    * Handle country change event
//    */
//   onChangeCountry(event: any): void {
//     const value = event.target.value;
//     console.log('🌍 Country changed to:', value);

//     // Clear dependent fields
//     this.addrDetailForm.patchValue({
//       city: '',
//       state: '',
//       zipCode: '',
//       landMark: '',
//     });

//     // Set state validators based on country
//     if (value === 'India') {
//       this.State.setValidators([Validators.required]);
//       console.log('🇮🇳 India selected - state is required');
//     } else {
//       this.State.clearValidators();
//       console.log('🌎 Non-India country - state is optional');
//     }

//     this.State.updateValueAndValidity();

//     // Trigger map update
//     if (this.mapLocationComponent) {
//       setTimeout(() => {
//         this.mapLocationComponent.triggerAddressUpdate();
//       }, 100);
//     }
//   }

//   /**
//    * Handle state change event
//    */
//   onSelectStateChange(event: any): void {
//     const state = event.target.value;
//     console.log('📍 State changed to:', state);

//     // Clear dependent fields
//     this.addrDetailForm.patchValue({
//       state: state,
//       city: '',
//       zipCode: '',
//       landMark: '',
//     });

//     // Trigger map update
//     if (this.mapLocationComponent) {
//       setTimeout(() => {
//         this.mapLocationComponent.triggerAddressUpdate();
//       }, 100);
//     }
//   }

//   /**
//    * Publish property to site
//    */
//   onPublishToSite(): void {
//     Swal.fire({
//       title: 'Do you want to publish this Property?',
//       text: 'Once you published, Admin will verify the property',
//       icon: 'info',
//       showCancelButton: true,
//       confirmButtonText: 'Yes, publish it!',
//       cancelButtonText: 'No, keep it',
//       showCloseButton: false,
//     }).then((result) => {
//       if (result.isConfirmed) {
//         console.log('📢 Publishing property:', this.propertyId);
//         this.spinner.show();

//         this.service.publishProperty(this.propertyId)
//           .pipe(takeUntil(this.destroy$))
//           .subscribe({
//             next: (res) => {
//               const statusCode = res?.headers?.statusCode || res?.statusCode;
//               const message = res?.headers?.message || res?.message || 'Property published successfully';

//               if (statusCode == 200) {
//                 this.swalToast.showToast(message, 'success');
//                 this.spinner.hide();
//                 this.router.navigateByUrl(RoutePath.MY_PROPERTIES);
//               } else {
//                 this.swalToast.showToast(message, 'error');
//                 this.spinner.hide();
//               }
//             },
//             error: (err) => {
//               console.error('❌ Publish Error:', err);
//               const errorMessage = err.message || 'Failed to publish property';
//               this.swalToast.showToast(errorMessage, 'error');
//               this.spinner.hide();
//             },
//           });
//       }
//     });
//   }

//   /**
//    * Clear all form data
//    */
//   clearData(): void {
//     console.log('🧹 Clearing form data');
    
//     this.resetFormData();
//     this.onNotifyPublishToSite();

//     // Reset map component
//     if (this.mapLocationComponent) {
//       this.mapLocationComponent.resetMap();
//     }
//   }

//   /**
//    * Reset form to initial state
//    */
//   private resetFormData(): void {
//     this.btnSubmitted.set(false);

//     // Reset all form values
//     this.addrDetailForm.reset({
//       floor: null,
//       addressLine1: '',
//       addrLine2: '',
//       addrLine3: '',
//       country: '',
//       state: '',
//       city: '',
//       zipCode: '',
//       landMark: '',
//       latitude: null,
//       longitude: null
//     });

//     // Clear all validators
//     Object.keys(this.addrDetailForm.controls).forEach(controlName => {
//       const control = this.addrDetailForm.get(controlName);
//       control?.clearValidators();
//       control?.updateValueAndValidity();
//     });

//     // Re-apply required validators
//     this.addrDetailForm.get('addressLine1')?.setValidators([
//       Validators.required,
//       Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/"]*$'),
//       Validators.maxLength(200)
//     ]);
    
//     this.addrDetailForm.get('city')?.setValidators([
//       Validators.required,
//       Validators.pattern('^[a-zA-Z\\s]*$'),
//       Validators.maxLength(35)
//     ]);
    
//     this.addrDetailForm.get('country')?.setValidators([Validators.required]);
    
//     this.addrDetailForm.get('zipCode')?.setValidators([
//       Validators.required,
//       Validators.pattern('^[0-9]{3,7}$')
//     ]);

//     // State validator depends on country
//     const countryValue = this.Country?.value;
//     this.addrDetailForm.get('state')?.setValidators(
//       countryValue === 'India' ? [Validators.required] : []
//     );

//     // Update validity for all controls
//     Object.keys(this.addrDetailForm.controls).forEach(controlName => {
//       this.addrDetailForm.get(controlName)?.updateValueAndValidity();
//     });

//     // Mark form as pristine and untouched
//     this.addrDetailForm.markAsPristine();
//     this.addrDetailForm.markAsUntouched();
//     this.addrDetailForm.updateValueAndValidity();

//     // Enable form
//     this.addrDetailForm.enable();

//     console.log('✅ Form reset complete');
//   }

//   /**
//    * Cleanup on component destroy
//    */
//   ngOnDestroy(): void {
//     console.log('🧹 PropertyLocationsComponent destroyed - cleaning up');
//     this.destroy$.next();
//     this.destroy$.complete();
//     this.dataSubscription.unsubscribe();
//   }
// } 



/**
 * COMPLETE FIX for property-location.ts
 * 
 * 🔴 ROOT CAUSE: MapComponent was NOT being told to re-geocode when inputs change
 * 
 * ✅ FIXES APPLIED:
 * 1. Added ZIP code trigger (was missing!) - now all address fields trigger map updates
 * 2. Moved map triggers to ngAfterViewInit() - prevents ViewChild timing issues  
 * 3. Centralized all map triggers in setupMapTriggers() - cleaner, more reliable
 * 4. Added proper logging for debugging
 * 
 * 🎯 RESULT: 
 * ✔️ Change city → map moves 
 * ✔️ Change zip → map moves (FIXED!)
 * ✔️ Change country/state → map moves
 * ✔️ All triggers work reliably
 */

import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter, ViewChild, signal, effect, inject } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

import { RoutePath } from '../../../../core/constant/api.constant';
import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../../services/Notifier-service/notifier.service';
import { ToastService } from '../../../../services/Toast-service/toast.service';
import Swal from 'sweetalert2';
import { MapLocationComponent } from '../../../map-location/map-location';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-property-location',
  templateUrl: './property-location.html',
  styleUrls: ['./property-location.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule, MapLocationComponent]
})
export class PropertyLocation implements OnInit, OnDestroy, AfterViewInit {
  @Input() selectedPropertyData: any;
  @Output() promptFromChild: any = new EventEmitter<void>();
  @ViewChild('mapLocationComponent') mapLocationComponent!: MapLocationComponent;

  addrDetailForm!: FormGroup;
  btnSubmitted = signal(false);
  canDisablePublishProperty = signal(true);
  propertyId: any;
  states: any[] = [];
  countryCodes: any[] = [];
  private dataSubscription: Subscription = new Subscription();

  selectedFile: File | null = null;
  url: any;
  showMarkOnMapModal: boolean = false;
  displayMarkOnMapModal: any = 'none';

  // Services
  private fb = inject(FormBuilder);
  private service = inject(ManagePropertyService);
  private spinner = inject(NgxSpinnerService);
  private notifier = inject(NotifierService);
  private swalToast = inject(ToastService);
  private router = inject(Router);

  constructor() {
    // Effect to monitor form validity and update publish button state
    effect(() => {
      if (this.addrDetailForm) {
        const isInvalid = this.addrDetailForm.invalid;
        this.canDisablePublishProperty.set(isInvalid);
        this.notifier.notifyDisablePublishToSite(isInvalid);
      }
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.addrDetailForm.controls;
  }

  public get Country(): FormControl {
    return this.addrDetailForm.get('country') as FormControl;
  }
  public get State(): FormControl {
    return this.addrDetailForm.get('state') as FormControl;
  }
  public get Landmark(): FormControl {
    return this.addrDetailForm.get('landMark') as FormControl;
  }
  public get Latitude(): FormControl {
    return this.addrDetailForm.get('latitude') as FormControl;
  }
  public get Longitude(): FormControl {
    return this.addrDetailForm.get('longitude') as FormControl;
  }

  // Computed signals for form values
  currentCity = signal('');
  currentState = signal('');
  currentLandmark = signal('');
  currentCountry = signal('');
  currentZipCode = signal('');
  currentLatitude = signal<number | null>(null);
  currentLongitude = signal<number | null>(null);

  ngOnInit() {
    this.initializeForm();
    this.loadInitialData();
    // Note: setupFormListeners moved to ngAfterViewInit to ensure ViewChild is ready

    this.addrDetailForm.get('state')?.clearValidators();
    this.State.clearValidators();
  }

  /**
   * ✅ FIX #2: Move map triggers to ngAfterViewInit
   * This prevents ViewChild timing issues
   */
  ngAfterViewInit() {
    // Small delay to ensure ViewChild is fully initialized
    setTimeout(() => {
      console.log('🔍 ViewChild initialization check:', {
        mapLocationComponent: !!this.mapLocationComponent,
        type: typeof this.mapLocationComponent,
        constructor: this.mapLocationComponent?.constructor?.name
      });
      
      this.setupMapTriggers();
      this.initializeSignalsFromForm(); // ✅ ADDED: Initialize signals with current form values
    }, 100);
  }

  getControl(name: string): AbstractControl {
    return this.addrDetailForm.controls[name];
  }

  initializeForm() {
    this.addrDetailForm = this.fb.group({
      floor: [null, [Validators.pattern('^[0-9]{1,5}$')]],
      addressLine1: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/]*$'), Validators.maxLength(200)]],
      addrLine2: ['', [Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/]*$'), Validators.maxLength(200)]],
      addrLine3: ['', [Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/]*$'), Validators.maxLength(200)]],
      country: ['', Validators.required],
      state: ['', Validators.required],
      city: ['', [Validators.required, Validators.pattern('^[a-zA-Z\\s]*$'), Validators.maxLength(35)]],
      landMark: ['', [Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/]*$'), Validators.maxLength(100)]],
      zipCode: ['', [Validators.required, Validators.pattern('^[0-9]{3,7}$')]],
      latitude: [''],
      longitude: [''],
    });
  }

  loadInitialData() {
    this.countryCodes = this.service.getCountryCodes();
    this.states = this.service.getStates();
    this.propertyId = this.selectedPropertyData?.id;

    this.notifier.canDisablePublishToSite$.subscribe(res => this.canDisablePublishProperty.set(res));

    if (this.selectedPropertyData?.addressInfo) {
      const addressInfo = this.selectedPropertyData.addressInfo;
      this.addrDetailForm.patchValue(addressInfo);
      
      // ✅ ENHANCED: Update signals immediately when loading existing data
      this.currentCity.set(addressInfo.city || '');
      this.currentState.set(addressInfo.state || '');
      this.currentLandmark.set(addressInfo.landMark || '');
      this.currentCountry.set(addressInfo.country || '');
      this.currentZipCode.set(addressInfo.zipCode || '');
      this.currentLatitude.set(addressInfo.latitude || null);
      this.currentLongitude.set(addressInfo.longitude || null);
      
      console.log('✅ Loaded existing address data and updated signals:', addressInfo);
    } else {
      // ✅ ADDED: Initialize with default values for new properties
      this.addrDetailForm.patchValue({
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Nagercoil',
        zipCode: '629001',
        addressLine1: '' // Keep address line 1 empty as requested
      });
      
      this.currentCity.set('Nagercoil');
      this.currentState.set('Tamil Nadu');
      this.currentLandmark.set('');
      this.currentCountry.set('India');
      this.currentZipCode.set('629001');
      this.currentLatitude.set(null);
      this.currentLongitude.set(null);
      
      console.log('✅ Initialized with default values for new property');
    }
  }

  setupFormListeners() {
    // Listen to form changes for publish button state
    this.addrDetailForm.valueChanges
      .pipe(debounceTime(2000), distinctUntilChanged())
      .subscribe(() => {
        this.canDisablePublishProperty.set(this.addrDetailForm.invalid);
      });

    this.notifier.propertyID$.subscribe(res => console.log(res, "reee"));
  }

  /**
   * ✅ ADDED: Initialize signals with current form values
   */
  initializeSignalsFromForm() {
    console.log('🔄 Initializing signals from current form values...');
    
    // Update all signals with current form values
    this.currentCity.set(this.addrDetailForm.get('city')?.value || '');
    this.currentState.set(this.addrDetailForm.get('state')?.value || '');
    this.currentCountry.set(this.addrDetailForm.get('country')?.value || '');
    this.currentZipCode.set(this.addrDetailForm.get('zipCode')?.value || '');
    this.currentLandmark.set(this.addrDetailForm.get('landMark')?.value || '');
    this.currentLatitude.set(this.addrDetailForm.get('latitude')?.value || null);
    this.currentLongitude.set(this.addrDetailForm.get('longitude')?.value || null);
    
    console.log('✅ Signals initialized:', {
      city: this.currentCity(),
      state: this.currentState(),
      country: this.currentCountry(),
      zipCode: this.currentZipCode(),
      landmark: this.currentLandmark()
    });
  }

  /**
   * ✅ FIXED: Direct map trigger method that bypasses signals
   * This ensures ALL address field changes trigger map updates immediately
   */
  setupMapTriggers() {
    console.log('🗺️ Setting up DIRECT map triggers for real-time navigation...');
    
    // ✅ FIXED: Direct approach - update signals AND trigger map immediately
    ['city', 'state', 'country', 'zipCode', 'landMark', 'addressLine1'].forEach(field => {
      this.addrDetailForm.get(field)?.valueChanges
        .pipe(debounceTime(800), distinctUntilChanged())
        .subscribe((value) => {
          console.log(`🔄 ${field} changed to:`, value);
          
          // Update corresponding signal
          switch(field) {
            case 'city': this.currentCity.set(value || ''); break;
            case 'state': this.currentState.set(value || ''); break;
            case 'country': this.currentCountry.set(value || ''); break;
            case 'zipCode': this.currentZipCode.set(value || ''); break;
            case 'landMark': this.currentLandmark.set(value || ''); break;
          }
          
          // ✅ FIXED: Direct map update instead of relying on signals
          this.triggerMapUpdateDirectly();
        });
    });
    
    console.log('✅ DIRECT map triggers configured for all address fields');
  }

  /**
   * ✅ ADDED: Direct map update method that doesn't rely on signals
   */
  private triggerMapUpdateDirectly() {
    const country = this.addrDetailForm.get('country')?.value;
    const city = this.addrDetailForm.get('city')?.value;
    const zipCode = this.addrDetailForm.get('zipCode')?.value;
    
    console.log('🗺️ Direct map trigger called with:', { country, city, zipCode });
    console.log('🔍 Map component status:', {
      exists: !!this.mapLocationComponent,
      isViewChild: this.mapLocationComponent instanceof MapLocationComponent
    });
    
    // Check if we have minimum required data
    const hasMinimumData = country && (city || zipCode);
    
    if (hasMinimumData && this.mapLocationComponent) {
      console.log('✅ Triggering DIRECT map navigation...');
      
      // Update all signals first to ensure map component has latest data
      this.currentCity.set(city || '');
      this.currentState.set(this.addrDetailForm.get('state')?.value || '');
      this.currentCountry.set(country || '');
      this.currentZipCode.set(zipCode || '');
      this.currentLandmark.set(this.addrDetailForm.get('landMark')?.value || '');
      
      console.log('📡 Updated signals before map trigger:', {
        city: this.currentCity(),
        state: this.currentState(),
        country: this.currentCountry(),
        zipCode: this.currentZipCode(),
        landmark: this.currentLandmark()
      });
      
      // Force map update with a small delay to ensure signals are updated
      setTimeout(() => {
        console.log('🚀 Calling mapLocationComponent.triggerAddressUpdate()...');
        this.mapLocationComponent.triggerAddressUpdate();
      }, 100);
    } else if (!hasMinimumData) {
      console.log('⏳ Insufficient data for map update:', { country, city, zipCode });
    } else {
      console.warn('⚠️ Map component not ready yet - ViewChild status:', {
        mapLocationComponent: !!this.mapLocationComponent,
        type: typeof this.mapLocationComponent
      });
    }
  }

  /**
   * ✅ FIXED: Direct address field blur handler
   */
  onAddressFieldBlur(fieldName: string) {
    console.log(`🔄 ${fieldName} blur event triggered`);
    
    if (['city', 'state', 'country', 'zipCode', 'landMark', 'addressLine1'].includes(fieldName)) {
      console.log('🗺️ Blur event - triggering direct map update...');
      // Small delay to ensure form value is updated
      setTimeout(() => {
        this.triggerMapUpdateDirectly();
      }, 100);
    }
  }

  onLocationUpdate(event: {
    latitude: number;
    longitude: number;
    addressDetails: any;
  }) {
    console.log('Received from Map Component:', event);
    
    // Update form values
    this.addrDetailForm.patchValue({
      ...event.addressDetails,
      latitude: event.latitude,
      longitude: event.longitude
    }, { emitEvent: false });

    // Update signals
    this.currentLatitude.set(event.latitude);
    this.currentLongitude.set(event.longitude);
    
    if (event.addressDetails) {
      this.currentCity.set(event.addressDetails.city || '');
      this.currentState.set(event.addressDetails.state || '');
      this.currentCountry.set(event.addressDetails.country || '');
      this.currentZipCode.set(event.addressDetails.zipCode || '');
      this.currentLandmark.set(event.addressDetails.landMark || '');
    }
  }

  onNotifyPublishToSite() {
    const isInvalid = this.addrDetailForm.invalid;
    this.canDisablePublishProperty.set(isInvalid);
    this.notifier.notifyDisablePublishToSite(isInvalid);
  }

  onSubmitAddressDetail(): void {
    this.btnSubmitted.set(true);
  
    // Log form status and values for debugging
    console.log("Form Status:", this.addrDetailForm.status);
    console.log("Form Value:", this.addrDetailForm.value);
  
    if (this.addrDetailForm.invalid) {
      console.warn("Form is invalid. Submission stopped.");
      this.swalToast.showToast("Please fill all required fields correctly.", 'error');
      return;
    }
  
    this.spinner.show();
  
    const rawData = this.addrDetailForm.value;
  
    // Prepare data payload
    const formData = {
      ...rawData,
      landmark: rawData.landMark,
      zipcode: rawData.zipCode,
      propertyId: this.propertyId
    };
  
    // Remove temporary fields
    delete formData.landMark;
    delete formData.zipCode;
  
    // Call the API
    this.service.saveAddressDetail(formData).subscribe({
      next: (res) => {
        console.log('Full API Response:', res);
  
        // Check for success using actual structure
        const statusCode = res?.statusCode || res?.headers?.statusCode || res?.code;
        const message = res?.message || res?.headers?.message || 'Success';
        
        if (statusCode == 200) {
          this.swalToast.showToast(message, 'success');
          this.promptFromChild.emit();
          this.btnSubmitted.set(false);
        } else {
          const errorList = res?.errorList || {};
          const errorMessages = Object.values(errorList).join(', ') || 'An unexpected error occurred';
          this.swalToast.showToast(errorMessages, 'error');
        }
        this.spinner.hide(); 
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

  /**
   * ✅ FIXED: Test method using direct map navigation
   */
  testMapNavigation() {
    console.log('🧪 Testing DIRECT map navigation...');
    
    // Set test values in the form (different from defaults)
    this.addrDetailForm.patchValue({
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      zipCode: '600001',
      landMark: 'Marina Beach'
    });
    
    console.log('✅ Test data set in form');
    
    // Use direct trigger method
    setTimeout(() => {
      this.triggerMapUpdateDirectly();
    }, 500);
  }

  /**
   * ✅ FIXED: Country change handler with direct map navigation
   */
  onChangeCountry(event: any) {
    const value = event.target.value;
    console.log('🌍 Country changed to:', value);
    
    // Clear related fields
    this.addrDetailForm.patchValue({
      city: '',
      state: '',
      zipCode: '',
      landMark: '',
    });

    // Update signals
    this.currentCountry.set(value);
    this.currentCity.set('');
    this.currentState.set('');
    this.currentZipCode.set('');
    this.currentLandmark.set('');

    if (value === 'India') {
      this.addrDetailForm.get('state')?.setValidators([Validators.required]);
    } else {
      this.addrDetailForm.get('state')?.clearValidators();
    }

    this.addrDetailForm.get('state')?.updateValueAndValidity();
    
    // ✅ FIXED: Direct map update when country changes
    if (value) {
      console.log('🗺️ Country changed - triggering direct map update...');
      setTimeout(() => {
        this.triggerMapUpdateDirectly();
      }, 200);
    }
  }

  /**
   * ✅ FIXED: State change handler with direct map navigation
   */
  onSelectStateChange(event: any) {
    const state = event.target.value;
    console.log('📍 State changed to:', state);

    this.addrDetailForm.patchValue({
      state: state,
      city: '',
      zipCode: '',
      landMark: '',
    });

    // Update signals
    this.currentState.set(state);
    this.currentCity.set('');
    this.currentZipCode.set('');
    this.currentLandmark.set('');

    // ✅ FIXED: Direct map update when state changes
    if (state && this.currentCountry()) {
      console.log('🗺️ State changed - triggering direct map update...');
      setTimeout(() => {
        this.triggerMapUpdateDirectly();
      }, 200);
    }
  }

  onPublishToSite() {
    Swal.fire({
      title: 'Do you want to publish this Property?',
      text: 'Once you published, Admin will verify the property',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Yes, publish it!',
      cancelButtonText: 'No, keep it',
      showCloseButton: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.publishProperty(this.propertyId).subscribe({
          next: (res) => {
            if (res.headers.statusCode == 200) {
              this.swalToast.showToast(res.headers.message, 'success');
              this.spinner.hide();
              this.router.navigateByUrl(RoutePath.MY_PROPERTIES);
            } else {
              this.swalToast.showToast(res.headers.message, 'error');
            }
          },
          error: (err) => {
            const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
            this.swalToast.showToast(errList, 'error');
            this.spinner.hide();
          },
        });
      }
    });
  }

  clearData() {
    this.resetFormData();
    this.onNotifyPublishToSite();

    if (this.mapLocationComponent) {
      this.mapLocationComponent.resetMap();
    }
    
    // Reset signals with default values
    this.currentCity.set('Nagercoil');
    this.currentState.set('Tamil Nadu');
    this.currentCountry.set('India');
    this.currentZipCode.set('629001');
    this.currentLandmark.set('');
    this.currentLatitude.set(null);
    this.currentLongitude.set(null);
    
    console.log('Cleared map and form data');
  }

  resetFormData(): void {
    this.btnSubmitted.set(false);
  
    // Reset all form values with default values
    this.addrDetailForm.reset({
      floor: null,
      addressLine1: '', // Keep empty as requested
      addrLine2: '',
      addrLine3: '',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Nagercoil',
      landMark: '',
      zipCode: '629001',
      latitude: '',
      longitude: ''
    });
  
    // Clear all validators
    Object.keys(this.addrDetailForm.controls).forEach(controlName => {
      const control = this.addrDetailForm.get(controlName);
      control?.clearValidators();
      control?.updateValueAndValidity();
    });
  
    // Re-apply validators manually
    this.addrDetailForm.get('addressLine1')?.setValidators([
      Validators.required, 
      Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/]*$'), 
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

    // Apply other validators
    this.addrDetailForm.get('addrLine2')?.setValidators([
      Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/]*$'), 
      Validators.maxLength(200)
    ]);
    this.addrDetailForm.get('addrLine3')?.setValidators([
      Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/]*$'), 
      Validators.maxLength(200)
    ]);
    this.addrDetailForm.get('landMark')?.setValidators([
      Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/]*$'), 
      Validators.maxLength(100)
    ]);
    this.addrDetailForm.get('floor')?.setValidators([
      Validators.pattern('^[0-9]{1,5}$')
    ]);
  
    // Update validity after setting validators
    Object.keys(this.addrDetailForm.controls).forEach(controlName => {
      this.addrDetailForm.get(controlName)?.updateValueAndValidity();
    });
  
    // Mark the form as pristine and untouched
    this.addrDetailForm.markAsPristine();
    this.addrDetailForm.markAsUntouched();
    this.addrDetailForm.updateValueAndValidity();
  
    // Enable the form
    this.addrDetailForm.enable();
  }
 
  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
} 