import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { LoaderService } from '../../../../services/Loader-service/loader.service';

import { FormGroup, FormControl, FormBuilder, AbstractControl, Validators, ReactiveFormsModule } from '@angular/forms';

import { NotifierService } from '../../../../services/Notifier-service/notifier.service';
import { ToastService } from '../../../../services/Toast-service/toast.service';
import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nearby-locations',
  templateUrl: './nearby-locations.html',
  styleUrls: ['./nearby-locations.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class NearbyLocationsComponent implements OnInit, OnDestroy {
  @Input() selectedPropertyData: any;
  
  isEditMode: boolean = false;
  editIndex: number = -1;
  nearbyDetailList: any[] = [];
  propertyId: any;
  btnSubmitted: boolean = false;
  selectedNearbyType: string = '';
  
  private dataSubscription: Subscription = new Subscription();

  // Nearby categories
  nearbyCategories = [
    { value: 'Transport & Connectivity', label: 'Transport & Connectivity' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Education', label: 'Education' },
    { value: 'Shopping & Essentials', label: 'Shopping & Essentials' },
    { value: 'Food & Dining', label: 'Food & Dining' },
    { value: 'Work & Business', label: 'Work & Business' },
    { value: 'Recreation & Leisure', label: 'Recreation & Leisure' },
    { value: 'Religious Places', label: 'Religious Places' },
    { value: 'Financial & Govt.Facilities', label: 'Financial & Govt.Facilities' },
    { value: 'Beauty & Personal Care', label: 'Beauty & Personal Care' },
    { value: 'Child & Family Support', label: 'Child & Family Support' },
    { value: 'Pet Services', label: 'Pet Services' }
  ];

  // Places for each category
  nearbyPlaces: { [key: string]: string[] } = {
    'Transport & Connectivity': ['Railway Station', 'Metro Station', 'Airport', 'Busstand/Busstop', 'Autostand'],
    'Healthcare': ['Hospital', 'Clinic', 'Pharmacy/Medical Shop', 'Diagnostic Center'],
    'Education': ['School', 'College', 'University', 'Daycare/Play school'],
    'Shopping & Essentials': [ 'Supermarket', 'Grocery Store', 'Malls/Shopping Centers', 'Convenience Store','Vegetable'],
    'Food & Dining': ['Restaurant', 'Cafes/coffee Shops', 'Food Court'],
    'Work & Business': ['IT Park/Tech Park','Industrial Areas','Business Centers','Coworking Spaces'],
    'Recreation & Leisure': ['Park/Gardens', 'Gym/Fitness Centers', 'Clubhouse', 'Swimming Pool', 'Stadium'],
    'Religious Places': ['Temple', 'Church', 'Mosque', 'Gurudwara', 'Spiritual Center/Ashram'],
    'Financial & Govt.Facilities': ['Bank', 'ATM', 'Post Office', 'Police Station','Fire Station','Municipal Office/RTO'],
    'Beauty & Personal Care': ['Salon/Spa',  'Beauty Parlor',  'Massage Center'],
    'Child & Family Support': ['Crecha', 'Kids Play Area', 'Perenting Clinics', 'Toy Library'],
    'Pet Services': ['Pet Clinic/Vet', 'Pet Store', 'Pet Grooming Center']
  };
  
  nearbyDetailsForm: FormGroup = new FormGroup({
    ddlNearby: new FormControl(''),
    ddlPlace: new FormControl(''),
    distance: new FormControl(''),
    distanceUnit: new FormControl(''),
  });

  constructor(
    private fb: FormBuilder,
    private service: ManagePropertyService,
    private notifier: NotifierService,
    private loader: LoaderService,
    private swalToast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.nearbyDetailsForm = this.fb.group({
      ddlNearby: ['', Validators.required],
      ddlPlace: [{ value: '', disabled: true }, Validators.required],
      distance: ['', [
        Validators.required,
        Validators.pattern("^([0-9]{1,15})(\\.[0-9]{1,2})?$")
      ]],
      distanceUnit: ['', Validators.required],
    });
    
    this.onShowListofPlaces();
    this.mapDataIntoGrid();
    this.propertyId = this.selectedPropertyData?.id;
    this.propertyId ? this.propertyId : this.getNotifyData();
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  mapDataIntoGrid() {
    if (this.selectedPropertyData?.propertyNearByLocation) {
      this.nearbyDetailList = this.selectedPropertyData.propertyNearByLocation;
    } else {
      this.nearbyDetailList = [];
    }
  }

  getNotifyData() {
    this.dataSubscription = this.notifier.propertyID$.subscribe((res) => {
      this.propertyId = res;
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.nearbyDetailsForm.controls;
  }

  public get DdlNearBy(): FormControl {
    return this.nearbyDetailsForm.get('ddlNearby') as FormControl;
  }

  public get DdlPlace(): FormControl {
    return this.nearbyDetailsForm.get('ddlPlace') as FormControl;
  }

  public get Distance(): FormControl {
    return this.nearbyDetailsForm.get('distance') as FormControl;
  }

  public get DistanceUnit(): FormControl {
    return this.nearbyDetailsForm.get('distanceUnit') as FormControl;
  }

  onShowListofPlaces() {
    this.selectedNearbyType = this.DdlNearBy.value;
    
    if (this.selectedNearbyType) {
      this.DdlPlace.enable();
     
      
      this.DdlPlace.setValue('');
    } else {
      this.DdlPlace.disable();
    }
  }

  getPlacesForSelectedType(): string[] {
    return this.nearbyPlaces[this.selectedNearbyType] || [];
  }

  onSubmitNearByData() {
    this.btnSubmitted = true;
    
    if (this.nearbyDetailsForm.invalid) {
      return;
    }
    
    const nearByData = {
      location: this.DdlPlace.value,
      distance: this.Distance.value,
      nearByType: this.DdlNearBy.value,
      distanceUnit: this.DistanceUnit.value,
    };

    if (this.isEditMode) {
      this.nearbyDetailList[this.editIndex] = nearByData;
      this.isEditMode = false;
      this.saveNearByData();
    } else {
      this.nearbyDetailList.push(nearByData);
      this.saveNearByData();
    }
    
    this.clearData();
  }

  saveNearByData() {
    if (this.nearbyDetailList?.length > 0) {
      const nearbyDetail = {
        nearbyLocationInfo: this.nearbyDetailList,
        propertyId: this.propertyId
      };
      
      this.loader.show();
      
      this.service.saveNearByDetails(nearbyDetail).subscribe({
        next: (res: any) => {
          if (res.headers.statusCode === "200") {
            this.swalToast.showToast(res.headers.message, 'success');
            this.clearData();
            
            this.service.getPropertyDetailById(this.propertyId).subscribe({
              next: (res: any) => {
                if (res.headers.statusCode === "200") {
                  this.selectedPropertyData = res.recordInfo;
                  this.nearbyDetailList = res.recordInfo?.propertyNearByLocation;
                  this.loader.hide();
                } else {
                  const errorList = res.errorList;
                  const errorMessages = Object.values(errorList).join(', ');
                  this.swalToast.showToast(errorMessages, 'error');
                  this.loader.hide();
                }
              },
              error: (err: any) => {
                const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
                this.swalToast.showToast(errList, 'error');
                this.loader.hide();
              }
            });
          } else {
            this.swalToast.showToast(res.headers.message, 'error');
            this.loader.hide();
          }
        },
        error: (err: any) => {
          const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
          this.swalToast.showToast(errList, 'error');
          this.loader.hide();
        }
      });
    }
  }

  onEditNearbyData(i: number, data: any) {
    this.isEditMode = true;
    this.editIndex = i;
    this.DdlNearBy.setValue(data.nearByType);
    this.onShowListofPlaces();
    this.DdlPlace.setValue(data.location);
    this.Distance.setValue(data.distance);
    this.DistanceUnit.setValue(data.distanceUnit);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  removeNearByData(data: any) {
    const payload = {
      propertyId: this.propertyId,
      id: data?.id
    };
    
    Swal.fire({
      title: 'Are you sure want to remove this nearby data?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      showCloseButton: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.loader.show();
        
        this.service.deleteNearByDetail(payload).subscribe({
          next: (res: any) => {
            if (res.headers.statusCode === "200") {
              this.swalToast.showToast('Nearby data removed successfully', 'success');
              this.nearbyDetailList = this.nearbyDetailList.filter(item => item?.id !== data?.id);
              this.loader.hide();
            }
          },
          error: (err: any) => {
            let error = err;
            error = error.replace(/[{}]/g, '');
            this.swalToast.showToast(error, 'error');
            this.loader.hide();
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        this.swalToast.showToast('Your data is safe.', 'info');
      }
    });
  }

  clearData() {
    this.btnSubmitted = false;
    this.isEditMode = false;
    this.editIndex = -1;
    this.DdlPlace.disable();
    this.nearbyDetailsForm.reset();
  }
}