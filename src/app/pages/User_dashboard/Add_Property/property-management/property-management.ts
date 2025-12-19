import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ToastService } from '../../../../services/Toast-service/toast.service';
import { NotifierService } from '../../../../services/Notifier-service/notifier.service';
import { ManagePropertyService } from '../../../../services/ManageProperty-service/manage-property.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-property-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxSpinnerModule],
  templateUrl: './property-management.html',
  styleUrl: './property-management.scss',
})
export class PropertyManagement implements OnInit, OnDestroy {
  @Input() selectedPropertyData: any;
  
  propertyManagementForm!: FormGroup;
  private dataSubscription: Subscription = new Subscription();
  
  propertyId: any;
  btnSubmitted: boolean = false;
  errMsg: any = {};

  // Property Features Options
  propertyFeatures = [
    '24x7 Security',
    'A rooftop garden',
    'ATM',
    'Amphitheater',
    'Badminton Court',
    'Swimming Pool',
    'Gym/Fitness Center',
    'Parking Space',
    'Garden/Landscaping',
    'Security System',
    'Air Conditioning',
    'Balcony/Terrace',
    'Elevator',
    'Power Backup',
    'Water Supply',
    'Internet/WiFi Ready',
    'Clubhouse',
    'Children Play Area',
    'Jogging Track',
    'CCTV Surveillance',
    'Intercom Facility',
    'Maintenance Staff',
    'Visitor Parking',
    'Fire Safety',
    'Waste Management'
  ];

  // Property Facilities Options
  propertyFacilities = [
    'Plumbing',
    'Cleaning',
    'Wiring',
    'Maintenance'
  ];

  // Selected items arrays
  selectedFeatures: string[] = [];
  selectedFacilities: string[] = [];

  // Dropdown visibility
  showFeaturesDropdown = false;
  showFacilitiesDropdown = false;

  // Filter text
  featureFilterText = '';
  facilityFilterText = '';

  constructor(
    private fb: FormBuilder,
    private service: ManagePropertyService,
    private spinner: NgxSpinnerService,
    private notifier: NotifierService,
    private swalToast: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getNotifyData();
    
    // Set property ID - prioritize selectedPropertyData
    if (this.selectedPropertyData?.id) {
      this.propertyId = this.selectedPropertyData.id;
    }
    
    // Load existing features if available
    if (this.selectedPropertyData !== undefined && this.selectedPropertyData?.features) {
      this.selectedFeatures = [...this.selectedPropertyData.features];
      this.propertyManagementForm.patchValue({
        features: this.selectedFeatures
      });
    }
    
    // Load existing facilities if available
    if (this.selectedPropertyData !== undefined && this.selectedPropertyData?.manageFacility) {
      this.selectedFacilities = [...this.selectedPropertyData.manageFacility];
      this.propertyManagementForm.patchValue({
        facilities: this.selectedFacilities
      });
    }
    
    this.notifier.scrollToTop();
    
    // Debug log to verify property ID
    console.log('Property ID initialized:', this.propertyId);
    console.log('Selected Property Data:', this.selectedPropertyData);
  }

  initializeForm(): void {
    this.propertyManagementForm = this.fb.group({
      features: [[]],
      facilities: [[]]
    });
  }

  getNotifyData(): void {
    this.dataSubscription = this.notifier.propertyID$.subscribe((res) => {
      if (res) {
        this.propertyId = res;
        console.log('Property ID updated from notifier:', res);
      }
    });
  }

  // Property Features Methods
  toggleFeaturesDropdown(): void {
    this.showFeaturesDropdown = !this.showFeaturesDropdown;
    this.showFacilitiesDropdown = false;
  }

  onFeatureFilterChange(event: any): void {
    this.featureFilterText = event.target.value;
    this.showFeaturesDropdown = true;
  }

  get filteredFeatures(): string[] {
    if (!this.featureFilterText) {
      return this.propertyFeatures;
    }
    return this.propertyFeatures.filter(feature =>
      feature.toLowerCase().includes(this.featureFilterText.toLowerCase())
    );
  }

  get availableFeatures(): string[] {
    return this.filteredFeatures.filter(f => !this.selectedFeatures.includes(f));
  }

  selectFeature(feature: string): void {
    if (!this.selectedFeatures.includes(feature)) {
      this.selectedFeatures.push(feature);
      this.propertyManagementForm.patchValue({
        features: this.selectedFeatures
      });
    }
    this.featureFilterText = '';
    this.showFeaturesDropdown = false;
  }

  removeFeature(feature: string): void {
    this.selectedFeatures = this.selectedFeatures.filter(f => f !== feature);
    this.propertyManagementForm.patchValue({
      features: this.selectedFeatures
    });
  }

  // Property Facilities Methods
  toggleFacilitiesDropdown(): void {
    this.showFacilitiesDropdown = !this.showFacilitiesDropdown;
    this.showFeaturesDropdown = false;
  }

  onFacilityFilterChange(event: any): void {
    this.facilityFilterText = event.target.value;
    this.showFacilitiesDropdown = true;
  }

  get filteredFacilities(): string[] {
    if (!this.facilityFilterText) {
      return this.propertyFacilities;
    }
    return this.propertyFacilities.filter(facility =>
      facility.toLowerCase().includes(this.facilityFilterText.toLowerCase())
    );
  }

  get availableFacilities(): string[] {
    return this.filteredFacilities.filter(f => !this.selectedFacilities.includes(f));
  }

  selectFacility(facility: string): void {
    if (!this.selectedFacilities.includes(facility)) {
      this.selectedFacilities.push(facility);
      this.propertyManagementForm.patchValue({
        facilities: this.selectedFacilities
      });
    }
    this.facilityFilterText = '';
    this.showFacilitiesDropdown = false;
  }

  removeFacility(facility: string): void {
    this.selectedFacilities = this.selectedFacilities.filter(f => f !== facility);
    this.propertyManagementForm.patchValue({
      facilities: this.selectedFacilities
    });
  }

  // Close dropdowns when clicking outside
  closeDropdowns(): void {
    this.showFeaturesDropdown = false;
    this.showFacilitiesDropdown = false;
  }

  // Save Method - matches old code functionality
  onSave(): void {
    this.btnSubmitted = true;
    
    // Validate property ID before saving
    if (!this.propertyId) {
      this.swalToast.showToast('Property ID is missing. Please select a property first.', 'error');
      console.error('Property ID is missing:', {
        propertyId: this.propertyId,
        selectedPropertyData: this.selectedPropertyData
      });
      return;
    }
    
    const featureData = {
      propertyId: this.propertyId,
      features: this.selectedFeatures,
      managingFacility: this.selectedFacilities
    };

    console.log('Saving Property Features & Facilities:', featureData);
    
    this.spinner.show();
    
    this.service.savePropertyFeature(featureData).subscribe({
      next: (res) => {
        if (res.headers.statusCode == 200) {
          this.swalToast.showToast(res.headers.message, 'success');
          this.errMsg = null;
          this.spinner.hide();
          
          // Update form with saved data
          this.propertyManagementForm.patchValue({
            features: this.selectedFeatures,
            facilities: this.selectedFacilities
          });
        } else {
          const errorList = res.errorList;
          const errorMessages = Object.values(errorList).join(', ');
          this.swalToast.showToast(errorMessages, 'error');
          this.spinner.hide();
        }
      },
      error: (err) => {
        console.error('Error saving property features:', err);
        this.errMsg = err;
        
        // Check if error has errorList
        if (err.errorList) {
          const errorMessages = Object.values(err.errorList).join(', ');
          this.swalToast.showToast(errorMessages, 'error');
        } else {
          this.swalToast.showToast('Failed to save property features', 'error');
        }
        
        this.spinner.hide();
      }
    });
  }

  // Clear All Method - matches old code functionality
  onClearAll(): void {
    this.selectedFeatures = [];
    this.selectedFacilities = [];
    this.featureFilterText = '';
    this.facilityFilterText = '';
    this.errMsg = {};
    this.btnSubmitted = false;
    
    this.propertyManagementForm.reset({
      features: [],
      facilities: []
    });
    
    this.closeDropdowns();
  }

  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leaks
    this.dataSubscription.unsubscribe();
  }
}
