import { Component, OnInit, OnDestroy, HostListener, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../../services/Notifier-service/notifier.service';
import { ToastService } from '../../../../services/Toast-service/toast.service';
import { Subscription } from 'rxjs';
import { RoutePath } from '../../../../core/constant/api.constant';
import { DatePipe, CommonModule } from '@angular/common';
import * as currencyData from '../../../../../assets/common-currency.json'

@Component({
  selector: 'app-add-property',
  templateUrl: './add-property.html',
  styleUrls: ['./add-property.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule],
  providers: [DatePipe]
})
export class AddProperty implements OnInit, AfterViewInit, OnDestroy {
  minDate!: any;
  isEdit: boolean = false;
  btnSubmitted: boolean = false;
  currencyDetails: any[] = [];
  propertyId: any;
  selectedPropertyData: any;
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
    availableDate: ''
  };

  private dataSubscription: Subscription = new Subscription();

  basicDetailForm: FormGroup = new FormGroup({
    status: new FormControl(''),
    listPropAs: new FormControl(''),
    userType: new FormControl(''),
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
    this.minDate = this.datePipe.transform(currentDate, 'yyyy-MM-dd');
  }

  @HostListener('window:beforeunload', [])
  onWindowScroll() {
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }

  ngOnInit() {
    const currencyCodes = (currencyData as any).default;
    this.currencyDetails = Object.values(currencyData).map(x => x);

    this.basicDetailForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(50)]],
      status: ['', [Validators.required]],
      userType: ['', Validators.required],
      listPropAs: [''],
      type: ['', [Validators.required]],
      areaSize: [null, [
        Validators.required,
        Validators.pattern("^[0-9]+(\.([0-9]{1,2}))?$")
      ]],
      areaUnit: ['', [Validators.required]],
      currency: ['', [Validators.required]],
      price: [null, [
        Validators.required,
        Validators.pattern("^[0-9]+(\.([0-9]{1,2}))?$")
      ]],
      facing: [''],
      developerName: ['', [Validators.maxLength(100)]],
      propertyAgeMin: [null, [
        Validators.pattern("^([0-9]{1,3})(\.[0-9]{1,2})?$"),
        Validators.max(100)
      ]],
      propertyAgeMax: [null, [
        Validators.pattern("^([0-9]{1,3})(\.[0-9]{1,2})?$"),
        Validators.max(100)
      ]],
      parking: [''],
      videoUrl: ['', Validators.pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)(\/.*)?$/)],
      noOfBedrooms: new FormControl(null, [Validators.pattern("^([0-9]{1,3})?$")]),
      noOfBathrooms: new FormControl(null, [Validators.pattern("^([0-9]{1,3})?$")]),
      description: ['', [Validators.maxLength(1500)]],
      perValueUnit: [''],
      isReadyToMove: [''],
      transferDate: ['']
    }, {
      validators: this.checkboxOrDateRequired()
    });

    // Watch for userType changes and update listPropAs accordingly
    this.UserType.valueChanges.subscribe(value => {
      this.updateListPropAs(value);
    });

    this.getNotifyData();
  }

  ngAfterViewInit(): void {
    // Additional initialization if needed
  }

  getNotifyData() {
    this.dataSubscription = this.notifier.userProfileData$.subscribe((res) => {
      if (res) {
        const userType = res?.userType;
        this.UserType.setValue(userType);
        this.updateListPropAs(userType);
        
        const developerName = res?.companyDetail ? res?.companyDetail.companyName : '';
        this.Developer.setValue(developerName);
      }
    });
  }

  updateListPropAs(userType: string) {
    // Map userType to listPropAs value
    // Owner -> Owner (for API)
    // Broker -> Broker
    // Developer -> Developer
    this.ListPropAs.setValue(userType);
  }

  checkboxOrDateRequired() {
    return (formGroup: FormGroup) => {
      const checkboxControl = formGroup.controls['isReadyToMove'];
      const dateControl = formGroup.controls['transferDate'];
      
      if (!checkboxControl.value && !dateControl.value) {
        return { checkboxOrDateRequired: true };
      }
      return null;
    };
  }

  onValidatePastDate() {
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

  onSubmitPropertyData() {
    this.btnSubmitted = true;
    
    if (this.btnSubmitted && this.basicDetailForm.invalid || this.onCompareAge() || this.onValidatePastDate()) {
      return;
    }
    
    this.mapFormBasicDetailsData();
    this.spinner.show();
    
    this.service.savePropertyData(this.basicDetailsData).subscribe({
      next: (res) => {
        if (res.headers.statusCode == 200) {
          this.router.navigate([RoutePath.EDIT_PROPERTY], { queryParams: { id: res.propertyId } });
          this.swalToast.showToast(res.headers.message, 'success');
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
      },
      complete: () => {
        // Completion logic if needed
      }
    });
  }

  clearData() {
    this.resetFormData();
  }

  resetFormData() {
    this.btnSubmitted = false;
    this.basicDetailForm.reset();
    this.VideoUrl.setValue("");
    this.basicDetailsData = {};
  }

  mapFormBasicDetailsData() {
    // Start with required fields
    this.basicDetailsData = {
      status: this.ToDo.value,
      listPropertyAs: this.ListPropAs.value,
      title: this.Title.value,
      type: this.PropertyType.value,
      area: this.AreaSize.value,
      size: this.AreaUnit.value,
      currency: this.Currency.value,
      price: this.Price.value
    };

    // Add propertyId if it exists
    if (this.propertyId) {
      this.basicDetailsData.propertyId = this.propertyId;
    }

    // Add optional fields only if they have valid values
    if (this.Developer.value && this.Developer.value.trim() !== '') {
      this.basicDetailsData.developerName = this.Developer.value;
    }

    if (this.Parking.value && this.Parking.value.trim() !== '') {
      this.basicDetailsData.parking = this.Parking.value;
    }

    if (this.Facing.value && this.Facing.value.trim() !== '') {
      this.basicDetailsData.facingDirection = this.Facing.value;
    }

    if (this.PerValueUnit.value && this.PerValueUnit.value.trim() !== '') {
      this.basicDetailsData.perValueUnit = this.PerValueUnit.value;
    }

    if (this.VideoUrl.value && this.VideoUrl.value.trim() !== '') {
      this.basicDetailsData.videoUrl = this.VideoUrl.value;
    }

    if (this.Description.value && this.Description.value.trim() !== '') {
      this.basicDetailsData.description = this.Description.value;
    }

    // Add numeric fields only if they have valid values
    if (this.PropertyAgeMin.value !== null && this.PropertyAgeMin.value !== undefined && this.PropertyAgeMin.value !== '') {
      this.basicDetailsData.min = this.PropertyAgeMin.value;
    }

    if (this.PropertyAgeMax.value !== null && this.PropertyAgeMax.value !== undefined && this.PropertyAgeMax.value !== '') {
      this.basicDetailsData.max = this.PropertyAgeMax.value;
    }

    if (this.NoOfBedrooms.value !== null && this.NoOfBedrooms.value !== undefined && this.NoOfBedrooms.value !== '') {
      this.basicDetailsData.bedRooms = this.NoOfBedrooms.value;
    }

    if (this.NoOfBathrooms.value !== null && this.NoOfBathrooms.value !== undefined && this.NoOfBathrooms.value !== '') {
      this.basicDetailsData.bathRooms = this.NoOfBathrooms.value;
    }

    // Handle availability
    if (this.IsReadyToMove.value) {
      this.basicDetailsData.readyToMove = this.IsReadyToMove.value;
    } else if (this.TransferDate.value) {
      this.basicDetailsData.availableDate = this.datePipe.transform(this.TransferDate.value, 'yyyy-MM-dd');
    }
  }

  onCheckReadyToMoveFlag() {
    if (this.IsReadyToMove.value) {
      this.TransferDate.setValue(null);
    }
  }

  onCompareAge() {
    if ((this.PropertyAgeMin.value !== null && this.PropertyAgeMin.value !== undefined) && 
        (this.PropertyAgeMax.value !== null && this.PropertyAgeMax.value !== undefined) && 
        (this.PropertyAgeMin.value > this.PropertyAgeMax.value)) {
      this.swalToast.showToast('Property Age min cannot be greater than max field!', 'error');
      return true;
    }
    return false;
  }

  onChangePropertyType(event: any) {
    this.PropertyType.setValue(event.target.value);
  }

  ngOnDestroy(): void {
    this.dataSubscription.unsubscribe();
  }

  // Form Control Getters
  get f(): { [key: string]: AbstractControl } {
    return this.basicDetailForm.controls;
  }

  public get ToDo(): FormControl {
    return this.basicDetailForm.get('status') as FormControl;
  }

  public get UserType(): FormControl {
    return this.basicDetailForm.get('userType') as FormControl;
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
}

