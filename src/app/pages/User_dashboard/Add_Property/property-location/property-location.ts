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

    this.addrDetailForm.get('state')?.clearValidators();
    this.State.clearValidators();
  }

 
  ngAfterViewInit() {
    
    setTimeout(() => {
      
      
      this.setupMapTriggers();
      this.initializeSignalsFromForm(); 
    }, 100);
  }

  getControl(name: string): AbstractControl {
    return this.addrDetailForm.controls[name];
  }

  initializeForm() {
   this.addrDetailForm = this.fb.group({
  floor: [null, [Validators.pattern('^[0-9]{1,5}$')]],
  addressLine1: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/]*$'), Validators.maxLength(200)]],
  addrLine2: [''],
  addrLine3: [''],
  country: ['India', Validators.required],
  state: ['Tamil Nadu', Validators.required],
  city: ['Nagercoil', [Validators.required, Validators.pattern('^[a-zA-Z\\s]*$'), Validators.maxLength(35)]],
  landMark: ['NH944', [Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/]*$'), Validators.maxLength(100)]],
  zipCode: ['629001', [Validators.required, Validators.pattern('^[0-9]{3,7}$')]],
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
      
      this.currentCity.set(addressInfo.city || '');
      this.currentState.set(addressInfo.state || '');
      this.currentLandmark.set(addressInfo.landMark || '');
      this.currentCountry.set(addressInfo.country || '');
      this.currentZipCode.set(addressInfo.zipCode || '');
      this.currentLatitude.set(addressInfo.latitude || null);
      this.currentLongitude.set(addressInfo.longitude || null);
      

    }
  }

  setupFormListeners() {

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


  
  setupMapTriggers() {

    

    ['city', 'state', 'country', 'zipCode', 'landMark', 'addressLine1'].forEach(field => {
      this.addrDetailForm.get(field)?.valueChanges
        .pipe(debounceTime(800), distinctUntilChanged())
        .subscribe((value) => {

          
         
          
          switch(field) {
            case 'city': this.currentCity.set(value || ''); break;
            case 'state': this.currentState.set(value || ''); break;
            case 'country': this.currentCountry.set(value || ''); break;
            case 'zipCode': this.currentZipCode.set(value || ''); break;
            case 'landMark': this.currentLandmark.set(value || ''); break;
          }
          

          this.triggerMapUpdateDirectly();
        });
    });
    

  }


  
  private triggerMapUpdateDirectly() {
    const country = this.addrDetailForm.get('country')?.value;
    const city = this.addrDetailForm.get('city')?.value;
    const zipCode = this.addrDetailForm.get('zipCode')?.value;
    

  
    
    

    const hasMinimumData = country && (city || zipCode);
    
    if (hasMinimumData && this.mapLocationComponent) {

      

      this.currentCity.set(city || '');
      this.currentState.set(this.addrDetailForm.get('state')?.value || '');
      this.currentCountry.set(country || '');
      this.currentZipCode.set(zipCode || '');
      this.currentLandmark.set(this.addrDetailForm.get('landMark')?.value || '');
      
   
      
      

        setTimeout(() => {
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

 
  
  onAddressFieldBlur(fieldName: string) {
    
    if (['city', 'state', 'country', 'zipCode', 'landMark', 'addressLine1'].includes(fieldName)) {


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
  
  
    
  
    if (this.addrDetailForm.invalid) {

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
       
        
        const errList = err?.error || {};
        const errorMessages = Object.values(errList).join(', ') || 'API request failed';
        this.swalToast.showToast(errorMessages, 'error');
        this.spinner.hide(); 
      }
    });
  }


  
  testMapNavigation() {
  
    
    this.addrDetailForm.patchValue({
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      zipCode: '600001',
      landMark: 'Marina Beach'
    });
    

    

    
    setTimeout(() => {
      this.triggerMapUpdateDirectly();
    }, 500);
  }

 
  
  onChangeCountry(event: any) {
    const value = event.target.value;

 
    
    this.addrDetailForm.patchValue({
      city: '',
      state: '',
      zipCode: '',
      landMark: 'NH944',
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
    

    if (value) {

      setTimeout(() => {
        this.triggerMapUpdateDirectly();
      }, 200);
    }
  }


  
  onSelectStateChange(event: any) {
    const state = event.target.value;

    
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

    
    if (state && this.currentCountry()) {

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
    

  }

  resetFormData(): void {
    this.btnSubmitted.set(false);
  
   
    
    this.addrDetailForm.reset({
      floor: null,
      addressLine1: '', 
      
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
  
    
    
    Object.keys(this.addrDetailForm.controls).forEach(controlName => {
      const control = this.addrDetailForm.get(controlName);
      control?.clearValidators();
      control?.updateValueAndValidity();
    });
  
    
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
  

    Object.keys(this.addrDetailForm.controls).forEach(controlName => {
      this.addrDetailForm.get(controlName)?.updateValueAndValidity();
    });
  

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