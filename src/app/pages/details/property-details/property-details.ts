import { Component, Input, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-details.html',
  styleUrl: './property-details.scss',
})
export class PropertyDetails {
  @Input() propertyData: any = null;

  constructor() {
    // Add an effect to debug when propertyData changes
    effect(() => {
      console.log('PropertyData received:', this.propertyData);
      console.log('Address Info:', this.propertyData?.addressInfo);
      console.log('Computed address:', this.address());
      console.log('Computed state:', this.state());
      console.log('Computed city:', this.city());
    });
  }

  // Computed properties for display
  readonly address = computed(() => {
    const addressInfo = this.propertyData?.addressInfo;
    console.log('Computing address, addressInfo:', addressInfo);
    if (!addressInfo) return 'Address not available';
    
    const parts = [];
    if (addressInfo.addressLine1) parts.push(addressInfo.addressLine1);
    if (addressInfo.addressLine2) parts.push(addressInfo.addressLine2);
    if (addressInfo.addressLine3) parts.push(addressInfo.addressLine3);
    if (addressInfo.landMark) parts.push(addressInfo.landMark);
    
    return parts.join(', ') || 'Address not available';
  });

  readonly state = computed(() => {
    return this.propertyData?.addressInfo?.state || 'State not available';
  });

  readonly city = computed(() => {
    return this.propertyData?.addressInfo?.city || 'City not available';
  });

  readonly zipCode = computed(() => {
    return this.propertyData?.addressInfo?.zipCode || 'Zip code not available';
  });

  readonly country = computed(() => {
    return this.propertyData?.addressInfo?.country || 'Country not available';
  });

  readonly totalArea = computed(() => {
    const area = this.propertyData?.area;
    const areaUnit = this.propertyData?.size || 'Sq.ft';
    return area ? `${area} ${areaUnit}` : 'Area not available';
  });

  readonly propertyAge = computed(() => {
    const ageInfo = this.propertyData?.propertyAge;
    if (!ageInfo) return 'Age not available';
    
    const min = ageInfo.min;
    const max = ageInfo.max;
    
    if (min === null && max === null) return 'Age not specified';
    if (min !== null && max !== null) return `${min} to ${max} Yrs`;
    if (min !== null) return `${min}+ Yrs`;
    if (max !== null) return `Up to ${max} Yrs`;
    
    return 'Age not available';
  });

  readonly availability = computed(() => {
    const status = this.propertyData?.status;
    const availabilityInfo = this.propertyData?.availability;
    
    if (availabilityInfo?.readyToMove) return 'Ready To Move';
    if (availabilityInfo?.availableDate) return `Available from ${new Date(availabilityInfo.availableDate).toLocaleDateString()}`;
    
    if (status === 'Sell') return 'Available for Sale';
    if (status === 'Rent') return 'Available for Rent';
    if (status === 'Lease') return 'Available for Lease';
    
    return 'Availability not specified';
  });

  readonly hasVideo = computed(() => {
    return this.propertyData?.videoUrl && this.propertyData.videoUrl.trim() !== '';
  });

  readonly videoUrl = computed(() => {
    return this.propertyData?.videoUrl || '';
  });
}