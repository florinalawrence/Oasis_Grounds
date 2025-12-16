import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, OnDestroy, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../../services/Notifier-service/notifier.service';
import { ToastService } from '../../../../services/Toast-service/toast.service';
import { Observable, Subscription, map, startWith } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import * as amenitiesData from '../../../../../assets/amenities.json'
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-amenities',
  templateUrl: './amenities.html',
  styleUrls: ['./amenities.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatOptionModule,
    AsyncPipe
  ]
})
export class Amenities implements OnInit, AfterViewInit, OnDestroy {
  @Input() selectedPropertyData: any;
  
  amenityList: Array<any> = (amenitiesData as any).default;
  private dataSubscription: Subscription = new Subscription();
  
  separatorKeysCodesForFacility: number[] = [ENTER, COMMA];
  separatorKeysCodesForAmenity: number[] = [ENTER, COMMA];
  
  facilityCtrl = new FormControl('');
  amenityCtrl = new FormControl('');
  
  filteredFacilities!: Observable<string[]>;
  filteredAmenities!: Observable<string[]>;
  
  amenities: string[] = [];
  facilities: string[] = [];
  
  amenityMatchCount: number = 0;
  facilityMatchCount: number = 0;
  
  allFacilities: string[] = ['Plumbing', 'Cleaning', 'Wiring', 'Maintenance'];
  
  @ViewChild('amenityInput') amenityInput!: ElementRef<HTMLInputElement>;
  @ViewChild('facilityInput') facilityInput!: ElementRef<HTMLInputElement>;
  
  btnSubmitted: boolean = false;
  propertyId: any;
  errMsg: any = {};

  constructor(
    private service: ManagePropertyService,
    private spinner: NgxSpinnerService,
    private notifier: NotifierService,
    private swalToast: ToastService
  ) {
    this.filteredFacilities = this.facilityCtrl.valueChanges.pipe(
      startWith(null),
      map((facility: string | null) => (facility ? this._filterFacility(facility) : this.allFacilities.slice())),
    );
    
    this.filteredAmenities = this.amenityCtrl.valueChanges.pipe(
      startWith(null),
      map((amenity: string | null) => (amenity ? this._filterAmenity(amenity) : this.amenityList.slice())),
    );
  }

  ngOnInit() {
    this.getNotifyData();
    this.propertyId = this.propertyId ?? this.selectedPropertyData?.id;
    
    if (this.selectedPropertyData?.features) {
      this.amenities = this.selectedPropertyData.features;
    }
    
    if (this.selectedPropertyData?.manageFacility) {
      this.facilities = this.selectedPropertyData.manageFacility;
    }
    
    this.notifier.scrollToTop();
  }

  ngAfterViewInit(): void {
    // Initialization after view init if needed
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  getNotifyData() {
    this.dataSubscription = this.notifier.propertyID$.subscribe((res) => {
      this.propertyId = res;
    });
  }

  // Facility methods
  selectedFacility(event: MatAutocompleteSelectedEvent): void {
    const value = (event.option.viewValue || '').trim();
    this.facilityMatchCount = this.facilities.filter(i => i === value).length;
    
    if (value && this.facilityMatchCount === 0) {
      this.facilityMatchCount = 0;
      this.facilities.push(value);
    }
    
    this.facilityInput.nativeElement.value = '';
    this.facilityCtrl.setValue(null);
  }

  addFacility(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    this.facilityMatchCount = this.facilities.filter(i => i === value).length;
    
    if (value && this.facilityMatchCount === 0) {
      this.facilities.push(value);
    }
    
    event.chipInput!.clear();
    this.facilityCtrl.setValue(null);
  }

  removeFacility(facility: string): void {
    const index = this.facilities.indexOf(facility);
    if (index >= 0) {
      this.facilities.splice(index, 1);
    }
    this.facilityCtrl.setValue(null);
  }

  private _filterFacility(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allFacilities.filter(facility => 
      facility.toLowerCase().includes(filterValue)
    );
  }

  // Amenity methods
  selectedAmenity(event: MatAutocompleteSelectedEvent): void {
    const value = (event.option.viewValue || '').trim();
    this.amenityMatchCount = this.amenities.filter(i => i === value).length;
    
    if (value && this.amenityMatchCount === 0) {
      this.amenityMatchCount = 0;
      this.amenities.push(value);
    }
    
    this.amenityInput.nativeElement.value = '';
    this.amenityCtrl.setValue(null);
  }

  addAmenity(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    const amenity = this.amenityList.find(item => item.value === value);

    if (amenity && this.amenities.indexOf(amenity.value) === -1) {
      this.amenities.push(amenity.value);
    }
    
    event.chipInput!.clear();
    this.amenityCtrl.setValue(null);
  }

  removeAmenity(amenity: string): void {
    const index = this.amenities.indexOf(amenity);
    if (index >= 0) {
      this.amenities.splice(index, 1);
    }
    this.amenityCtrl.setValue(null);
  }

  private _filterAmenity(value: any): string[] {
    const filterValue = value.toLowerCase();
    return this.amenityList.filter((amenity: any) => 
      amenity.toLowerCase().includes(filterValue)
    );
  }

  // Form submission
  onSubmitFeatureData() {
    this.btnSubmitted = true;
    
    const featureData = {
      propertyId: this.propertyId,
      features: this.amenities,
      managingFacility: this.facilities
    };
    
    this.spinner.show();
    
    this.service.savePropertyFeature(featureData).subscribe({
      next: (res) => {
        if (res.headers.statusCode === 200) {
          this.swalToast.showToast(res.headers.message, 'success');
          this.errMsg = null;
          this.facilityMatchCount = 0;
          this.amenityMatchCount = 0;
          this.spinner.hide();
        } else {
          const errorList = res.errorList;
          const errorMessages = Object.values(errorList).join(', ');
          this.swalToast.showToast(errorMessages, 'error');
          this.spinner.hide();
        }
      },
      error: (err) => {
        this.errMsg = err;
        this.spinner.hide();
      }
    });
  }

  clearData() {
    this.resetFormData();
    this.facilities = [];
    this.amenities = [];
    this.amenityMatchCount = 0;
    this.facilityMatchCount = 0;
    this.errMsg = {};
  }

  resetFormData() {
    this.btnSubmitted = false;
  }
}