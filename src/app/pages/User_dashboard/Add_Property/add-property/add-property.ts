import { Component, OnInit, OnDestroy, HostListener, AfterViewInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../../services/Notifier-service/notifier.service';
import { ToastService } from '../../../../services/Toast-service/toast.service';
import { Subscription } from 'rxjs';
import { RoutePath } from '../../../../core/constant/api.constant';
import { DatePipe, CommonModule } from '@angular/common';
import * as currencyData from '../../../../../assets/common-currency.json';

@Component({
  selector: 'app-add-property',
  templateUrl: './add-property.html',
  styleUrls: ['./add-property.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule],
  providers: [DatePipe]
})
export class AddProperty implements OnInit, AfterViewInit, OnDestroy {
  @Input() selectedPropertyData: any;
  
  minDate!: string;
  isEdit: boolean = false;
  btnSubmitted: boolean = false;
  currencyDetails: any[] = [];
  propertyId: any;
  url: any;
  
  basicDetailsData: any = {
    propertyId: '',
    status: '',
    listPropertyAs: '',
    title: '',
    propertyDescription: '',
    developerName: '',
    type: '',
    parking: '',
    area: 0,
    size: '',
    facingDirection: '',
    currency: '',
    price: '',
    perValueUnit: '',
    videoUrl: '',
    min: '',
    max: '',
    bedRooms: '',
    bathRooms: '',
    description: '',
    readyToMove: false,
    availableDate: '',
    // Lease-specific fields
    leaseDuration: '',
    securityDeposit: '',
    leaseType: ''
  };

  private dataSubscription: Subscription = new Subscription();
  
  basicDetailForm: FormGroup = new FormGroup({
    status: new FormControl(''),
    listPropAs: new FormControl(''),
    title: new FormControl(''),
    type: new FormControl(''),
    developerName: new FormControl(''),
    parking: new FormControl(''),
    areaSize: new FormControl(''),
    areaUnit: new FormControl(''),
    facing: new FormControl(''),
    currency: new FormControl(''),
    price: new FormControl(''),
    perValueUnit: new FormControl(''),
    videoUrl: new FormControl(''),
    propertyAgeMin: new FormControl(''),
    propertyAgeMax: new FormControl(''),
    noOfBedrooms: new FormControl(''),
    noOfBathrooms: new FormControl(''),
    description: new FormControl(''),
    isReadyToMove: new FormControl(''),
    transferDate: new FormControl(''),
    // Lease-specific form controls
    leaseDuration: new FormControl(''),
    securityDeposit: new FormControl(''),
    leaseType: new FormControl('')
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private service: ManagePropertyService,
    private swalToast: ToastService,
    private spinner: NgxSpinnerService,
    private notifier: NotifierService,
    private datePipe: DatePipe
  ) {
    const currentDate = new Date();
    this.minDate = this.datePipe.transform(currentDate, 'yyyy-MM-dd') || '';
  }

  @HostListener('window:beforeunload')
  onWindowScroll() {
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }

  get f(): { [key: string]: AbstractControl } {
    return this.basicDetailForm.controls;
  }

  public get ToDo(): FormControl {
    return this.basicDetailForm.get('status') as FormControl;
  }

  public get ListPropAs(): FormControl {
    return this.basicDetailForm.get('listPropAs') as FormControl;
  }

  public get Title(): FormControl {
    return this.basicDetailForm.get('title') as FormControl;
  }

  public get PropertyType(): FormControl {
    return this.basicDetailForm.get('type') as FormControl;
  }

  public get Developer(): FormControl {
    return this.basicDetailForm.get('developerName') as FormControl;
  }

  public get Parking(): FormControl {
    return this.basicDetailForm.get('parking') as FormControl;
  }

  public get AreaSize(): FormControl {
    return this.basicDetailForm.get('areaSize') as FormControl;
  }

  public get AreaUnit(): FormControl {
    return this.basicDetailForm.get('areaUnit') as FormControl;
  }

  public get Facing(): FormControl {
    return this.basicDetailForm.get('facing') as FormControl;
  }

  public get Currency(): FormControl {
    return this.basicDetailForm.get('currency') as FormControl;
  }

  public get Price(): FormControl {
    return this.basicDetailForm.get('price') as FormControl;
  }

  public get VideoUrl(): FormControl {
    return this.basicDetailForm.get('videoUrl') as FormControl;
  }

  public get PropertyAgeMin(): FormControl {
    return this.basicDetailForm.get('propertyAgeMin') as FormControl;
  }

  public get PropertyAgeMax(): FormControl {
    return this.basicDetailForm.get('propertyAgeMax') as FormControl;
  }

  public get NoOfBedrooms(): FormControl {
    return this.basicDetailForm.get('noOfBedrooms') as FormControl;
  }

  public get NoOfBathrooms(): FormControl {
    return this.basicDetailForm.get('noOfBathrooms') as FormControl;
  }

  public get PerValueUnit(): FormControl {
    return this.basicDetailForm.get('perValueUnit') as FormControl;
  }

  public get Description(): FormControl {
    return this.basicDetailForm.get('description') as FormControl;
  }

  public get IsReadyToMove(): FormControl {
    return this.basicDetailForm.get('isReadyToMove') as FormControl;
  }

  public get TransferDate(): FormControl {
    return this.basicDetailForm.get('transferDate') as FormControl;
  }

  // Lease-specific form control getters
  public get LeaseDuration(): FormControl {
    return this.basicDetailForm.get('leaseDuration') as FormControl;
  }

  public get SecurityDeposit(): FormControl {
    return this.basicDetailForm.get('securityDeposit') as FormControl;
  }

  public get LeaseType(): FormControl {
    return this.basicDetailForm.get('leaseType') as FormControl;
  }

  onChangePropertyType(event: any) {
    this.PropertyType.setValue(event.target.value);
  }

  /**
   * Handle status change (Sell, Rent, Lease)
   * Add specific functionality for different status types
   */
  onChangeStatus(event: any) {
    const selectedStatus = event.target.value;
    console.log('📋 Status changed to:', selectedStatus);
    
    // Handle specific logic for different status types
    switch (selectedStatus) {
      case 'Sell':
        this.handleSellStatus();
        break;
      case 'Rent':
        this.handleRentStatus();
        break;
      case 'Lease':
        this.handleLeaseStatus();
        break;
      default:
        break;
    }
  }

  /**
   * Handle Sell status specific functionality
   */
  private handleSellStatus(): void {
    console.log('🏠 Sell status selected');
    // Clear lease-specific fields when sell is selected
    this.clearLeaseSpecificFields();
    
    // Set per value unit back to area-based for selling
    if (this.PerValueUnit.value === 'month' || this.PerValueUnit.value === 'year') {
      this.PerValueUnit.setValue('sqft');
    }
  }

  /**
   * Handle Rent status specific functionality
   */
  private handleRentStatus(): void {
    console.log('🏠 Rent status selected');
    // Clear lease-specific fields when rent is selected
    this.clearLeaseSpecificFields();
    
    // Set per value unit to monthly for rent
    if (!this.PerValueUnit.value || this.PerValueUnit.value === 'sqft') {
      this.PerValueUnit.setValue('month');
    }
  }

  /**
   * Handle Lease status specific functionality
   */
  private handleLeaseStatus(): void {
    console.log('🏠 Lease status selected');
    // Add lease-specific logic here
    // For example: show lease duration fields, lease terms, etc.
    
    // You can add specific validations or field modifications for lease
    // Example: Set minimum lease duration, show lease-specific fields
    this.setLeaseSpecificFields();
  }

  /**
   * Set lease-specific form fields and validations
   */
  private setLeaseSpecificFields(): void {
    console.log('⚙️ Setting lease-specific fields and validations');
    
    // Set lease duration as required when lease is selected
    this.LeaseDuration.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(120),
      Validators.pattern("^[0-9]+$")
    ]);
    this.LeaseDuration.updateValueAndValidity();
    
    // Set default per value unit for lease
    if (!this.PerValueUnit.value || this.PerValueUnit.value === 'sqft') {
      this.PerValueUnit.setValue('month');
    }
    
    // Set security deposit validators
    this.SecurityDeposit.setValidators([
      Validators.min(0),
      Validators.pattern("^[0-9]+(\.([0-9]{1,2}))?$")
    ]);
    this.SecurityDeposit.updateValueAndValidity();
    
    console.log('✅ Lease-specific validations set');
  }

  /**
   * Clear lease-specific validations when other status is selected
   */
  private clearLeaseSpecificFields(): void {
    console.log('🧹 Clearing lease-specific fields and validations');
    
    // Clear lease duration validators
    this.LeaseDuration.clearValidators();
    this.LeaseDuration.setValue('');
    this.LeaseDuration.updateValueAndValidity();
    
    // Clear security deposit value
    this.SecurityDeposit.setValue('');
    
    // Clear lease type
    this.LeaseType.setValue('');
    
    // Reset per value unit to default
    this.PerValueUnit.setValue('sqft');
    
    console.log('✅ Lease-specific fields cleared');
  }

  ngOnInit() {
    // Load currency data
    this.currencyDetails = Object.values(currencyData).map(x => x);

    // Check if we're in edit mode by looking for property ID in query params
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.propertyId = params['id'];
        console.log('🔧 Edit mode detected, property ID:', this.propertyId);
      } else {
        this.isEdit = false;
        console.log('➕ Add mode detected');
      }
    });

    // Initialize form with validators
    this.basicDetailForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(50)]],
      status: ['', [Validators.required]],
      listPropAs: ['', Validators.required],
      type: ['Plots', [Validators.required]], // Default value
      areaSize: [null, [Validators.required, Validators.pattern("^[0-9]+(\.([0-9]{1,2}))?$")]],
      areaUnit: ['Sq.Ft', [Validators.required]], // Default value
      currency: ['', [Validators.required]],
      price: [null, [Validators.required, Validators.pattern("^[0-9]+(\.([0-9]{1,2}))?$")]],
      facing: ['North'], // Default value
      developerName: ['', [Validators.maxLength(100)]],
      propertyAgeMin: [null, [Validators.pattern("^([0-9]{1,3})(\.[0-9]{1,2})?$"), Validators.max(100)]],
      propertyAgeMax: [null, [Validators.pattern("^([0-9]{1,3})(\.[0-9]{1,2})?$"), Validators.max(100)]],
      parking: [''], // Default empty to avoid validation issues
      videoUrl: ['', Validators.pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)(\/.*)?$/)],
      noOfBedrooms: new FormControl(null, [Validators.pattern("^([0-9]{1,3})?$")]),
      noOfBathrooms: new FormControl(null, [Validators.pattern("^([0-9]{1,3})?$")]),
      description: ['', [Validators.maxLength(1500)]],
      perValueUnit: ['sqft'], // Default value
      isReadyToMove: [false],
      transferDate: [''],
      // Lease-specific form controls with validators
      leaseDuration: [''],
      securityDeposit: ['', [Validators.min(0), Validators.pattern("^[0-9]+(\.([0-9]{1,2}))?$")]],
      leaseType: ['']
    }, {
      validators: [this.checkboxOrDateRequired(), this.leaseFieldsRequired()]
    });

    // Disable list property as field
    this.ListPropAs.disable();
    
    // Get user profile data
    this.getNotifyData();

    // If in edit mode, load existing property data
    if (this.isEdit && this.propertyId) {
      this.loadPropertyData();
    }
    
    // If selectedPropertyData is provided as input, populate the form
    if (this.selectedPropertyData) {
      this.populateFormWithData(this.selectedPropertyData);
      this.isEdit = true;
      this.propertyId = this.selectedPropertyData.id;
    }
  }

  ngAfterViewInit(): void {
    // Additional initialization if needed
  }

  getNotifyData() {
    this.dataSubscription = this.notifier.userProfileData$.subscribe((res) => {
      if (res) {
        this.ListPropAs.setValue(res?.userType);
        const developerName = res?.companyDetail ? res.companyDetail.companyName : '';
        this.Developer.setValue(developerName);
      }
    });
  }

  checkboxOrDateRequired() {
    return (formGroup: AbstractControl) => {
      const checkboxControl = formGroup.get('isReadyToMove');
      const dateControl = formGroup.get('transferDate');
      
      if (!checkboxControl?.value && !dateControl?.value) {
        return { checkboxOrDateRequired: true };
      }
      return null;
    };
  }

  /**
   * Validator for lease-specific required fields
   */
  leaseFieldsRequired() {
    return (formGroup: AbstractControl) => {
      const statusControl = formGroup.get('status');
      const leaseDurationControl = formGroup.get('leaseDuration');
      
      // If status is 'Lease', then lease duration is required
      if (statusControl?.value === 'Lease' && !leaseDurationControl?.value) {
        return { leaseFieldsRequired: true };
      }
      return null;
    };
  }

  onValidatePastDate(): boolean {
    const availableDate: any = this.TransferDate.value;
    
    if (availableDate) {
      const parsedAvailableDate: Date = new Date(availableDate);
      
      if (!isNaN(parsedAvailableDate.getTime())) {
        const currentDate: Date = new Date();
        parsedAvailableDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        if (parsedAvailableDate.getTime() < currentDate.getTime()) {
          this.swalToast.showToast('Availability Date cannot be a past date!', 'error');
          return true;
        } else if (parsedAvailableDate.getFullYear() > currentDate.getFullYear()) {
          this.swalToast.showToast('Availability Date year cannot be a future year!', 'error');
          return true;
        } else {
          return false;
        }
      } else {
        this.swalToast.showToast('Invalid date input!', 'error');
        return true;
      }
    }
    return false;
  }

  onSubmitPropertyData() {
    this.btnSubmitted = true;
    
    if (this.basicDetailForm.invalid || this.onCompareAge() || this.onValidatePastDate()) {
      return;
    }

    this.mapFormBasicDetailsData();
    this.spinner.show();
    
    if (this.isEdit) {
      // Update existing property
      console.log('🔄 Updating existing property...');
      console.log('📋 Property data for update:', this.basicDetailsData);
      console.log('🆔 Property ID:', this.propertyId);
      console.log('🔍 Is property ID in data?', !!this.basicDetailsData.propertyId);
      
      this.service.updatePropertyData(this.basicDetailsData).subscribe({
        next: (res) => {
          console.log('✅ Property update successful:', res);
          if (res.headers.statusCode == 200) {
            this.swalToast.showToast('Property updated successfully', 'success');
            this.router.navigate(['/user-dashboard/my-property']);
            this.spinner.hide();
          } else {
            const errorList = res.errorList;
            const errorMessages = Object.values(errorList).join(', ');
            this.swalToast.showToast(errorMessages, 'error');
            this.spinner.hide();
          }
        },
        error: (err) => {
          const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
          this.swalToast.showToast(errList, 'error');
          this.spinner.hide();
        }
      });
    } else {
      // Create new property
      this.service.savePropertyData(this.basicDetailsData).subscribe({
        next: (res) => {
          console.log('📥 Add Property API Response:', res);
          console.log('🔍 Response structure:', {
            headers: res.headers,
            propertyId: res.propertyId,
            id: res.id,
            data: res.data,
            allKeys: Object.keys(res)
          });
          
          if (res.headers.statusCode == 200) {
            // Try different possible property ID field names
            const propertyId = res.propertyId || res.id || res.data?.propertyId || res.data?.id;
            
            console.log('🆔 Property ID for navigation:', propertyId);
            console.log('🔍 Property ID validation:', this.isValidPropertyId(propertyId));
            
            if (this.isValidPropertyId(propertyId)) {
              console.log('🧭 Navigating to edit property with ID:', propertyId);
              
              // Navigate to edit property with error handling
              this.router.navigate([RoutePath.EDIT_PROPERTY], { queryParams: { id: propertyId } })
                .then((navigationSuccess) => {
                  if (navigationSuccess) {
                    console.log('✅ Navigation to edit property successful');
                    this.swalToast.showToast(res.headers.message || 'Property added successfully! Continue editing...', 'success');
                  } else {
                    console.error('❌ Navigation to edit property failed');
                    this.swalToast.showToast('Property added successfully, but navigation failed. Redirecting to My Properties.', 'warning');
                    // Fallback navigation
                    this.router.navigate(['/user-dashboard/my-property']);
                  }
                })
                .catch((navigationError) => {
                  console.error('❌ Navigation error:', navigationError);
                  this.swalToast.showToast('Property added successfully, but navigation failed. Redirecting to My Properties.', 'warning');
                  // Fallback navigation
                  this.router.navigate(['/user-dashboard/my-property']);
                });
            } else {
              console.error('❌ No property ID found in response');
              this.swalToast.showToast('Property added successfully, but could not navigate to edit page. Property ID missing.', 'warning');
              // Navigate to my properties as fallback
              this.router.navigate(['/user-dashboard/my-property']);
            }
            this.spinner.hide();
          } else {
            const errorList = res.errorList;
            const errorMessages = Object.values(errorList).join(', ');
            this.swalToast.showToast(errorMessages, 'error');
            this.spinner.hide();
          }
        },
        error: (err) => {
          console.error('❌ Add Property API Error:', err);
          const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
          this.swalToast.showToast(errList, 'error');
          this.spinner.hide();
        }
      });
    }
  }

  clearData() {
    this.resetFormData();
  }

  resetFormData() {
    this.btnSubmitted = false;
    this.basicDetailForm.reset({
      type: 'Plots',
      areaUnit: 'Sq.Ft',
      facing: 'North',
      parking: '',
      perValueUnit: 'sqft',
      isReadyToMove: false
    });
    this.VideoUrl.setValue("");
    this.basicDetailsData = {};
  }

  mapFormBasicDetailsData() {
    this.basicDetailsData = {
      propertyId: this.propertyId,
      status: this.ToDo.value,
      listPropertyAs: this.ListPropAs.value,
      title: this.Title.value,
      developerName: this.Developer.value,
      type: this.PropertyType.value,
      parking: (this.Parking.value && this.Parking.value !== '') ? this.Parking.value : null,
      area: this.AreaSize.value,
      size: this.AreaUnit.value,
      facingDirection: (this.Facing.value && this.Facing.value !== '') ? this.Facing.value : null,
      currency: this.Currency.value,
      price: this.Price.value,
      perValueUnit: (this.PerValueUnit.value && this.PerValueUnit.value !== '') ? this.PerValueUnit.value : null,
      videoUrl: this.VideoUrl.value,
      min: this.PropertyAgeMin.value,
      max: this.PropertyAgeMax.value,
      bedRooms: this.NoOfBedrooms.value,
      bathRooms: this.NoOfBathrooms.value,
      description: this.Description.value
    };

    // Add lease-specific fields if status is 'Lease'
    if (this.ToDo.value === 'Lease') {
      this.basicDetailsData.leaseDuration = this.LeaseDuration.value;
      this.basicDetailsData.securityDeposit = this.SecurityDeposit.value;
      this.basicDetailsData.leaseType = this.LeaseType.value;
    }

    if (this.IsReadyToMove.value) {
      this.basicDetailsData.readyToMove = this.IsReadyToMove.value;
    } else {
      this.basicDetailsData.availableDate = this.datePipe.transform(this.TransferDate.value, 'yyyy-MM-dd');
    }
  }

  onCheckReadyToMoveFlag() {
    if (this.IsReadyToMove.value) {
      this.TransferDate.setValue(null);
    }
  }

  onCompareAge(): boolean {
    if (
      (this.PropertyAgeMin.value !== null && this.PropertyAgeMin.value !== undefined) &&
      (this.PropertyAgeMax.value !== null && this.PropertyAgeMax.value !== undefined) &&
      (this.PropertyAgeMin.value > this.PropertyAgeMax.value)
    ) {
      this.swalToast.showToast('Property Age min cannot be greater than max field!', 'error');
      return true;
    } else {
      return false;
    }
  }

  /**
   * Load existing property data for editing
   */
  loadPropertyData(): void {
    console.log('📡 Loading property data for editing, ID:', this.propertyId);
    this.spinner.show();
    
    this.service.getPropertyById(this.propertyId).subscribe({
      next: (res) => {
        console.log('✅ Property data loaded:', res);
        if (res && res.recordInfo) {
          this.selectedPropertyData = res.recordInfo;
          this.populateFormWithData(this.selectedPropertyData);
        } else if (res) {
          // Handle different response structures
          this.selectedPropertyData = res;
          this.populateFormWithData(this.selectedPropertyData);
        }
        this.spinner.hide();
      },
      error: (err) => {
        console.error('❌ Failed to load property data:', err);
        this.swalToast.showToast('Failed to load property data', 'error');
        this.spinner.hide();
      }
    });
  }

  /**
   * Populate form with existing property data
   */
  populateFormWithData(data: any): void {
    console.log('📝 Populating form with data:', data);
    console.log('🔍 All available data keys:', Object.keys(data));
    console.log('🔍 Debugging specific fields:');
    console.log('  - data.min (propertyAgeMin):', data.min);
    console.log('  - data.max (propertyAgeMax):', data.max);
    console.log('  - data.propertyAgeMin:', data.propertyAgeMin);
    console.log('  - data.propertyAgeMax:', data.propertyAgeMax);
    console.log('  - data.minAge:', data.minAge);
    console.log('  - data.maxAge:', data.maxAge);
    console.log('  - data.availableDate (transferDate):', data.availableDate);
    console.log('  - data.transferDate:', data.transferDate);
    console.log('  - data.availabilityDate:', data.availabilityDate);
    console.log('  - data.readyToMove:', data.readyToMove);
    
    if (!data) return;

    // Map the data to form controls
    this.basicDetailForm.patchValue({
      title: data.title || '',
      status: data.status || '',
      listPropAs: data.listPropertyAs || '',
      type: data.type || 'Plots',
      areaSize: data.area || null,
      areaUnit: data.size || 'Sq.Ft',
      currency: data.currency || '',
      price: data.price || null,
      facing: data.facingDirection || 'North',
      developerName: data.developerName || '',
      propertyAgeMin: data.min || data.propertyAgeMin || data.minAge || null,
      propertyAgeMax: data.max || data.propertyAgeMax || data.maxAge || null,
      parking: data.parking || '',
      videoUrl: data.videoUrl || '',
      noOfBedrooms: data.bedRooms || null,
      noOfBathrooms: data.bathRooms || null,
      description: data.description || '',
      perValueUnit: data.perValueUnit || 'sqft',
      isReadyToMove: data.readyToMove || false,
      transferDate: this.formatDateForInput(data.availableDate || data.transferDate || data.availabilityDate) || '',
      // Lease-specific fields
      leaseDuration: data.leaseDuration || '',
      securityDeposit: data.securityDeposit || '',
      leaseType: data.leaseType || ''
    });

    // Debug: Check form values after patching
    console.log('🔍 Form values after patching:');
    console.log('  - propertyAgeMin:', this.PropertyAgeMin.value);
    console.log('  - propertyAgeMax:', this.PropertyAgeMax.value);
    console.log('  - transferDate:', this.TransferDate.value);
    console.log('  - isReadyToMove:', this.IsReadyToMove.value);

    // If status is lease, set up lease-specific validations
    if (data.status === 'Lease') {
      this.setLeaseSpecificFields();
    }

    console.log('✅ Form populated with existing data');
  }

  /**
   * Validate property ID format
   */
  private isValidPropertyId(propertyId: any): boolean {
    if (!propertyId) return false;
    
    // Convert to string and check if it's not empty
    const idString = String(propertyId).trim();
    if (!idString || idString === 'null' || idString === 'undefined') {
      return false;
    }
    
    // Check if it's a valid format (could be number or string)
    return idString.length > 0;
  }

  /**
   * Format date for HTML date input (YYYY-MM-DD format)
   */
  private formatDateForInput(dateValue: any): string {
    if (!dateValue) return '';
    
    try {
      // If it's already a valid date string in YYYY-MM-DD format, return as is
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        console.log('📅 Date already in correct format:', dateValue);
        return dateValue;
      }
      
      // Try to parse the date and format it
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const formattedDate = this.datePipe.transform(date, 'yyyy-MM-dd') || '';
        console.log('📅 Date formatted from', dateValue, 'to', formattedDate);
        return formattedDate;
      }
      
      console.warn('⚠️ Invalid date value:', dateValue);
      return '';
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return '';
    }
  }

  ngOnDestroy(): void {
    this.dataSubscription.unsubscribe();
  }
}