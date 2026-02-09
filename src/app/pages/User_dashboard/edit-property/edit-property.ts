import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxSpinnerService } from 'ngx-spinner';
import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { AddProperty } from '../Add_Property/add-property/add-property';
import { PropertyManagement } from '../Add_Property/property-management/property-management';
import { NearbyLocationsComponent } from '../Add_Property/nearby-locations/nearby-locations';
import { PropertyImages } from '../Add_Property/property-images/property-images';
import { DocumentAttachment } from '../Add_Property/document-attachment/document-attachment';
import { PropertyLocation } from '../Add_Property/property-location/property-location';

@Component({
  selector: 'app-edit-property',
  imports: [
    AddProperty,
    PropertyManagement,
    NearbyLocationsComponent,
    PropertyImages,
    DocumentAttachment,
    PropertyLocation,
  ],
  templateUrl: './edit-property.html',
  styleUrl: './edit-property.scss',
})
export class EditProperty implements OnInit {
  propertyId: string | null = null;
  selectedPropertyData: any = null;

  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ManagePropertyService);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly swalToast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Get property ID from query parameters
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((params) => {
      this.propertyId = params['id'] || null;
      console.log('🔧 Edit Property - Property ID from URL:', this.propertyId);

      // Load property data if we have an ID
      if (this.propertyId) {
        this.loadPropertyData();
      } else {
        console.warn('⚠️ No property ID found in URL query parameters');
        this.swalToast.showToast(
          'Property ID is missing. Please select a property to edit.',
          'warning'
        );
      }
    });
  }

  /**
   * Load property data from API
   */
  loadPropertyData(): void {
    if (!this.propertyId) {
      console.error(' Cannot load property data: No property ID available');
      return;
    }

    console.log(' Loading property data for edit-property, ID:', this.propertyId);
    this.spinner.show();

    this.service.getPropertyDetailById(this.propertyId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        console.log(' Property data loaded in edit-property:', res);
        console.log(' Response structure:', {
          hasRecordInfo: !!res?.recordInfo,
          hasDirectData: !!res,
          keys: res ? Object.keys(res) : [],
        });

        if (res && res.recordInfo) {
          this.selectedPropertyData = res.recordInfo;
          console.log(' Using res.recordInfo as selectedPropertyData');
        } else if (res) {
          this.selectedPropertyData = res;
          console.log(' Using res directly as selectedPropertyData');
        }

        // Ensure property ID is included in the data
        if (this.selectedPropertyData && !this.selectedPropertyData.id) {
          this.selectedPropertyData.id = this.propertyId;
          console.log(' Added property ID to selectedPropertyData');
        }

        // Verify property ID consistency
        this.verifyPropertyIdConsistency();

        console.log(' Final selectedPropertyData:', this.selectedPropertyData);
        this.spinner.hide();
      },
      error: (err) => {
        console.error(' Failed to load property data in edit-property:', err);
        this.swalToast.showToast('Failed to load property data. Please try again.', 'error');
        this.spinner.hide();
      },
    });
  }

  handlePrompt(): void {
    console.log('🔄 Child component triggered refresh - reloading property data');

    if (!this.propertyId) {
      console.error('❌ Cannot refresh: Property ID not available');
      return;
    }

    // Reload the property data from API
    this.loadPropertyData();
  }


  /**
   * Handle property data updates from child components
   * This ensures all components stay in sync with the same property data
   */
  onPropertyDataUpdate(data: any): void {
    console.log('📋 Edit Property - Property data updated by child component:', data);

    // Update the shared property data
    this.selectedPropertyData = { ...this.selectedPropertyData, ...data };

    // Ensure property ID is always maintained
    if (this.propertyId && !this.selectedPropertyData.id) {
      this.selectedPropertyData.id = this.propertyId;
    }

    console.log(' Updated selectedPropertyData for all components:', this.selectedPropertyData);
  }

  /**
   * Get the current property ID for child components
   */
  getPropertyId(): string | null {
    return this.propertyId;
  }

  /**
   * Verify that property ID is consistent across all data
   */
  private verifyPropertyIdConsistency(): void {
    console.log(' Verifying property ID consistency...');
    console.log('  - URL Property ID:', this.propertyId);
    console.log('  - Data Property ID:', this.selectedPropertyData?.id);
    console.log('  - Data Property ID (alternative):', this.selectedPropertyData?.propertyId);

    // Ensure all possible ID fields are consistent
    if (this.selectedPropertyData) {
      if (!this.selectedPropertyData.id && this.propertyId) {
        this.selectedPropertyData.id = this.propertyId;
        console.log(' Set selectedPropertyData.id to:', this.propertyId);
      }

      if (!this.selectedPropertyData.propertyId && this.propertyId) {
        this.selectedPropertyData.propertyId = this.propertyId;
        console.log(' Set selectedPropertyData.propertyId to:', this.propertyId);
      }
    }

    console.log(' Property ID consistency verified');
  }

  /**
   * Debug method to check property ID in all components
   */
  
}
