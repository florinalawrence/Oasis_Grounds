import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoaderService } from '../../../services/loader.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

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
export class EditProperty implements OnInit, OnDestroy {
  propertyId: string | null = null;
  selectedPropertyData: any = null;
  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private service: ManagePropertyService,
    private loader: LoaderService,
    private swalToast: ToastService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.route.queryParams.subscribe((params) => {
        this.propertyId = params['id'] || null;

        if (this.propertyId) {
          this.loadPropertyData();
        } else {
          console.warn('⚠️ No property ID found in URL query parameters');
          this.swalToast.showToast(
            'Property ID is missing. Please select a property to edit.',
            'warning'
          );
        }
      })
    );
  }

  
  loadPropertyData(): void {
    if (!this.propertyId) {
      return;
    }

    this.loader.show();

    this.service.getPropertyDetailById(this.propertyId).subscribe({
      next: (res) => {
        console.log(' Response structure:', {
          hasRecordInfo: !!res?.recordInfo,
          hasDirectData: !!res,
          keys: res ? Object.keys(res) : [],
        });

        if (res && res.recordInfo) {
          this.selectedPropertyData = res.recordInfo;
        } else if (res) {
          this.selectedPropertyData = res;
        }

        if (this.selectedPropertyData && !this.selectedPropertyData.id) {
          this.selectedPropertyData.id = this.propertyId;
        }

        this.verifyPropertyIdConsistency();

        this.loader.hide();
      },
      error: (err) => {
        this.swalToast.showToast('Failed to load property data. Please try again.', 'error');
        this.loader.hide();
      },
    });
  }

  handlePrompt(): void {

    if (!this.propertyId) {
      return;
    }

    this.loadPropertyData();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  
  onPropertyDataUpdate(data: any): void {
    console.log('📋 Edit Property - Property data updated by child component:', data);

    this.selectedPropertyData = { ...this.selectedPropertyData, ...data };

    if (this.propertyId && !this.selectedPropertyData.id) {
      this.selectedPropertyData.id = this.propertyId;
    }

  }

 
  getPropertyId(): string | null {
    return this.propertyId;
  }

  
  private verifyPropertyIdConsistency(): void {


 
    if (this.selectedPropertyData) {
      if (!this.selectedPropertyData.id && this.propertyId) {
        this.selectedPropertyData.id = this.propertyId;
      }

      if (!this.selectedPropertyData.propertyId && this.propertyId) {
        this.selectedPropertyData.propertyId = this.propertyId;
      }
    }

  }


  
}
