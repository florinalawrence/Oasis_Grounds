import { Component, OnInit, OnDestroy, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  FormControl,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../../services/Notifier-service/notifier.service';
import { SessionService } from '../../../../services/Session-service/session.service';
import { ToastService } from '../../../../services/Toast-service/toast.service';
import { Subscription } from 'rxjs';
import { RoutePath } from '../../../../core/constant/api.constant';

import * as currencyData from '../../../../../assets/common-currency.json';
import { PropertyLocation } from '../property-location/property-location';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgxSpinnerModule, PropertyLocation],
  providers: [DatePipe],
  templateUrl: './add-property.html',
  styleUrls: ['./add-property.scss'],
})
export class AddProperty implements OnInit, AfterViewInit, OnDestroy {
  minDate!: any;
  isEdit: boolean = false;
  btnSubmitted: boolean = false;
  currencyDetails: any[] = [];
  propertyId: any;
  selectedPropertyData: any;
  url: any;

  // Multi-step form control
  showAdditionalForms: boolean = false;
  currentStep: number = 1;

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
  });

  routePath = RoutePath;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private service: ManagePropertyService,
    private swalToast: ToastService,
    private spinner: NgxSpinnerService,
    private notifier: NotifierService,
    private datePipe: DatePipe,
    private session: SessionService
  ) {
    const currentDate = new Date();
    this.minDate = this.datePipe.transform(currentDate, 'yyyy-MM-dd');
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }

  ngOnInit() {
    // Check if user is logged in
    const token = this.session.getToken();
    if (!token) {
      this.swalToast.showToast('Please login to add a property', 'error');
      this.router.navigate([RoutePath.LOGIN]);
      return;
    }

    this.loadCurrencyData();
    this.initializeForm();
    this.getNotifyData();
  }

  ngAfterViewInit(): void {
    // Additional initialization if needed
  }

  loadCurrencyData(): void {
    const currencyCodes = (currencyData as any).default;
    this.currencyDetails = Object.values(currencyData).map((x) => x);
  }

  initializeForm(): void {
    this.basicDetailForm = this.fb.group(
      {
        title: ['', [Validators.required, Validators.maxLength(50)]],
        status: ['', [Validators.required]],
        listPropAs: ['', Validators.required],
        type: ['', [Validators.required]],
        areaSize: [null, [Validators.required, Validators.pattern('^[0-9]+(.([0-9]{1,2}))?$')]],
        areaUnit: ['', [Validators.required]],
        currency: ['', [Validators.required]],
        price: [null, [Validators.required, Validators.pattern('^[0-9]+(.([0-9]{1,2}))?$')]],
        facing: [''],
        developerName: ['', [Validators.maxLength(100)]],
        propertyAgeMin: [null, [Validators.pattern('^([0-9]{1,3})(.[0-9]{1,2})?$')]],
        propertyAgeMax: [null, [Validators.pattern('^([0-9]{1,3})(.[0-9]{1,2})?$')]],
        parking: [''],
        videoUrl: [
          '',
          Validators.pattern(
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)(\/.*)?$/
          ),
        ],
        noOfBedrooms: new FormControl(null, [Validators.pattern('^([0-9]{1,3})?$')]),
        noOfBathrooms: new FormControl(null, [Validators.pattern('^([0-9]{1,3})?$')]),
        description: ['', [Validators.maxLength(1500)]],
        perValueUnit: [''],
        isReadyToMove: [''],
        transferDate: [''],
      },
      {
        validators: this.checkboxOrDateRequired(),
      }
    );

    this.ListPropAs.disable();
  }

  getNotifyData(): void {
    this.dataSubscription = this.notifier.userProfileData$.subscribe((res) => {
      if (res) {
        this.ListPropAs.setValue(res?.userType);
        const developerName = res?.companyDetail?.companyName || '';
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
        return false;
      }
    }
    return false;
  }

  onSubmitPropertyData(): void {
    this.btnSubmitted = true;

    // Check form validity
    if (this.basicDetailForm.invalid) {
      console.log('Form is invalid:', this.basicDetailForm.errors);
      console.log('Invalid fields:', this.getInvalidFields());
      this.swalToast.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    if (this.onCompareAge()) {
      return;
    }

    if (this.onValidatePastDate()) {
      return;
    }

    this.mapFormBasicDetailsData();
    console.log('Submitting property data:', this.basicDetailsData);
    this.spinner.show();

    this.service.savePropertyData(this.basicDetailsData).subscribe({
      next: (res) => {
        this.spinner.hide();

        if (res && res.headers && res.headers.statusCode == 200) {
          this.propertyId = res.propertyId;
          this.showAdditionalForms = true;
          this.currentStep = 2;
          this.swalToast.showToast(res.headers.message || 'Property saved successfully', 'success');

          // Scroll to additional forms
          setTimeout(() => {
            const element = document.getElementById('additional-forms');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        } else {
          // Handle error response
          let errorMessage = 'Failed to save property';

          if (res && res.headers && res.headers.message) {
            errorMessage = res.headers.message;
          } else if (res && res.errorList) {
            const errorList = res.errorList;
            const errorMessages = Object.values(errorList)
              .filter((msg) => msg)
              .join(', ');
            errorMessage = errorMessages || 'Validation error occurred';
          }

          this.swalToast.showToast(errorMessage, 'error');
        }
      },
      error: (err) => {
        this.spinner.hide();

        // Better error message extraction
        let errorMessage = 'An error occurred while saving property';

        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error.headers && err.error.headers.message) {
            errorMessage = err.error.headers.message;
          } else if (err.error.errorList) {
            const errorList = Object.values(err.error.errorList)
              .filter((msg) => msg)
              .join(', ');
            errorMessage = errorList || errorMessage;
          }
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.statusText) {
          errorMessage = err.statusText;
        }

        console.error('Property save error:', err);
        this.swalToast.showToast(errorMessage, 'error');
      },
    });
  }

  clearData(): void {
    this.resetFormData();
  }

  resetFormData(): void {
    this.btnSubmitted = false;
    this.basicDetailForm.reset();
    this.VideoUrl.setValue('');
    this.basicDetailsData = {};
  }

  mapFormBasicDetailsData(): void {
    this.basicDetailsData = {
      status: this.ToDo.value,
      listPropertyAs: this.ListPropAs.value,
      title: this.Title.value,
      type: this.PropertyType.value,
      area: this.AreaSize.value,
      size: this.AreaUnit.value,
      currency: this.Currency.value,
      price: this.Price.value,
      description: this.Description.value || '',
    };

    if (this.propertyId) {
      this.basicDetailsData.propertyId = this.propertyId;
    }

    if (this.Developer.value && this.Developer.value !== '') {
      this.basicDetailsData.developerName = this.Developer.value;
    }

    if (this.Parking.value && this.Parking.value !== '') {
      this.basicDetailsData.parking = this.Parking.value;
    }

    if (this.Facing.value && this.Facing.value !== '') {
      this.basicDetailsData.facingDirection = this.Facing.value;
    }

    if (this.PerValueUnit.value && this.PerValueUnit.value !== '') {
      this.basicDetailsData.perValueUnit = this.PerValueUnit.value;
    }

    if (this.VideoUrl.value && this.VideoUrl.value !== '') {
      this.basicDetailsData.videoUrl = this.VideoUrl.value;
    }

    if (
      this.PropertyAgeMin.value !== null &&
      this.PropertyAgeMin.value !== undefined &&
      this.PropertyAgeMin.value !== ''
    ) {
      this.basicDetailsData.min = this.PropertyAgeMin.value;
    }

    if (
      this.PropertyAgeMax.value !== null &&
      this.PropertyAgeMax.value !== undefined &&
      this.PropertyAgeMax.value !== ''
    ) {
      this.basicDetailsData.max = this.PropertyAgeMax.value;
    }

    if (
      this.NoOfBedrooms.value !== null &&
      this.NoOfBedrooms.value !== undefined &&
      this.NoOfBedrooms.value !== ''
    ) {
      this.basicDetailsData.bedRooms = this.NoOfBedrooms.value;
    }

    if (
      this.NoOfBathrooms.value !== null &&
      this.NoOfBathrooms.value !== undefined &&
      this.NoOfBathrooms.value !== ''
    ) {
      this.basicDetailsData.bathRooms = this.NoOfBathrooms.value;
    }

    // Handle availability
    if (this.IsReadyToMove.value) {
      this.basicDetailsData.readyToMove = true;
    } else if (this.TransferDate.value) {
      this.basicDetailsData.availableDate = this.datePipe.transform(
        this.TransferDate.value,
        'yyyy-MM-dd'
      );
    }
  }

  onCheckReadyToMoveFlag(): void {
    if (this.IsReadyToMove.value) {
      this.TransferDate.setValue(null);
    }
  }

  onCompareAge(): boolean {
    if (
      this.PropertyAgeMin.value !== null &&
      this.PropertyAgeMin.value !== undefined &&
      this.PropertyAgeMax.value !== null &&
      this.PropertyAgeMax.value !== undefined &&
      this.PropertyAgeMin.value > this.PropertyAgeMax.value
    ) {
      this.swalToast.showToast('Property Age min cannot be greater than max field!', 'error');
      return true;
    }
    return false;
  }

  onChangePropertyType(event: any): void {
    this.PropertyType.setValue(event.target.value);
  }

  ngOnDestroy(): void {
    this.dataSubscription.unsubscribe();
  }

  // Form Control Getters
  get f(): { [key: string]: AbstractControl } {
    return this.basicDetailForm.controls;
  }

  get ToDo(): FormControl {
    return this.basicDetailForm.get('status') as FormControl;
  }

  get ListPropAs(): FormControl {
    return this.basicDetailForm.get('listPropAs') as FormControl;
  }

  get Title(): FormControl {
    return this.basicDetailForm.get('title') as FormControl;
  }

  get PropertyType(): FormControl {
    return this.basicDetailForm.get('type') as FormControl;
  }

  get Developer(): FormControl {
    return this.basicDetailForm.get('developerName') as FormControl;
  }

  get Parking(): FormControl {
    return this.basicDetailForm.get('parking') as FormControl;
  }

  get AreaSize(): FormControl {
    return this.basicDetailForm.get('areaSize') as FormControl;
  }

  get AreaUnit(): FormControl {
    return this.basicDetailForm.get('areaUnit') as FormControl;
  }

  get Facing(): FormControl {
    return this.basicDetailForm.get('facing') as FormControl;
  }

  get Currency(): FormControl {
    return this.basicDetailForm.get('currency') as FormControl;
  }

  get Price(): FormControl {
    return this.basicDetailForm.get('price') as FormControl;
  }

  get VideoUrl(): FormControl {
    return this.basicDetailForm.get('videoUrl') as FormControl;
  }

  get PropertyAgeMin(): FormControl {
    return this.basicDetailForm.get('propertyAgeMin') as FormControl;
  }

  get PropertyAgeMax(): FormControl {
    return this.basicDetailForm.get('propertyAgeMax') as FormControl;
  }

  get NoOfBedrooms(): FormControl {
    return this.basicDetailForm.get('noOfBedrooms') as FormControl;
  }

  get NoOfBathrooms(): FormControl {
    return this.basicDetailForm.get('noOfBathrooms') as FormControl;
  }

  get PerValueUnit(): FormControl {
    return this.basicDetailForm.get('perValueUnit') as FormControl;
  }

  get Description(): FormControl {
    return this.basicDetailForm.get('description') as FormControl;
  }

  get IsReadyToMove(): FormControl {
    return this.basicDetailForm.get('isReadyToMove') as FormControl;
  }

  get TransferDate(): FormControl {
    return this.basicDetailForm.get('transferDate') as FormControl;
  }

  onFinalSubmit(): void {
    this.swalToast.showToast('Property submitted successfully!', 'success');
    this.router.navigate([RoutePath.MY_PROPERTIES]);
  }

  getInvalidFields(): string[] {
    const invalidFields: string[] = [];
    const controls = this.basicDetailForm.controls;

    for (const name in controls) {
      if (controls[name].invalid) {
        invalidFields.push(name);
      }
    }

    return invalidFields;
  }
}
