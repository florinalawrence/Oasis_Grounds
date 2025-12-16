import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, AbstractControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
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
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule]
})
export class NearbyLocationsComponent implements OnInit, OnDestroy {
  @Input() selectedPropertyData: any;
  
  showDdlLocations: boolean = false;
  isEditMode: boolean = false;
  editIndex: number = -1;
  nearbyDetailList: any[] = [];
  propertyId: any;
  btnSubmitted: boolean = false;
  
  private dataSubscription: Subscription = new Subscription();
  
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
    private spinner: NgxSpinnerService,
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
    if (this.DdlNearBy.value) {
      this.DdlPlace.enable();
    } else {
      this.DdlPlace.disable();
    }
    
    if (this.DdlNearBy.value === 'Location') {
      this.showDdlLocations = true;
    } else {
      this.showDdlLocations = false;
    }
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
      
      this.spinner.show();
      
      this.service.saveNearByDetails(nearbyDetail).subscribe({
        next: (res: any) => {
          if (res.headers.statusCode === 200) {
            this.swalToast.showToast(res.headers.message, 'success');
            this.clearData();
            
            this.service.getPropertyDetailById(this.propertyId).subscribe({
              next: (res: any) => {
                if (res.headers.statusCode === 200) {
                  this.selectedPropertyData = res.recordInfo;
                  this.nearbyDetailList = res.recordInfo?.propertyNearByLocation;
                  this.spinner.hide();
                } else {
                  const errorList = res.errorList;
                  const errorMessages = Object.values(errorList).join(', ');
                  this.swalToast.showToast(errorMessages, 'error');
                  this.spinner.hide();
                }
              },
              error: (err: any) => {
                const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
                this.swalToast.showToast(errList, 'error');
                this.spinner.hide();
              }
            });
          } else {
            this.swalToast.showToast(res.headers.message, 'error');
            this.spinner.hide();
          }
        },
        error: (err: any) => {
          const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
          this.swalToast.showToast(errList, 'error');
          this.spinner.hide();
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
        this.spinner.show();
        
        this.service.deleteNearByDetail(payload).subscribe({
          next: (res: any) => {
            if (res.headers.statusCode === 200) {
              this.swalToast.showToast('Nearby data removed successfully', 'success');
              this.nearbyDetailList = this.nearbyDetailList.filter(item => item?.id !== data?.id);
              this.spinner.hide();
            }
          },
          error: (err: any) => {
            let error = err;
            error = error.replace(/[{}]/g, '');
            this.swalToast.showToast(error, 'error');
            this.spinner.hide();
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