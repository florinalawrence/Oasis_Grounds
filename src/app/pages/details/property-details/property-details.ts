import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Property Details Component
 * Displays property location, description, stats, and video information
 */
@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-details.html',
  styleUrl: './property-details.scss'
})
export class PropertyDetails implements OnChanges {
  @Input() propertyData: any = null;
  @Input() navigationSource: string = 'all-properties';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyData'] && this.propertyData) {
    }
  }

  /**
   * Get property address
   */
  getAddress(): string {
    if (!this.propertyData?.addressInfo) return 'Mid., Nh944';
    
    const addr = this.propertyData.addressInfo;
    const parts = [
      addr.addressLine1,
      addr.addressLine2,
      addr.landMark
    ].filter(Boolean);
    
    return parts.join(', ') || 'Address not available';
  }

  /**
   * Get property state
   */
  getState(): string {
    return this.propertyData?.addressInfo?.state || 'Tamil Nadu';
  }

  /**
   * Get property city
   */
  getCity(): string {
    return this.propertyData?.addressInfo?.city || 'Nagercoil';
  }

  /**
   * Get property zip code
   */
  getZipCode(): string {
    return this.propertyData?.addressInfo?.zipCode || '629001';
  }

  /**
   * Get property country
   */
  getCountry(): string {
    return this.propertyData?.addressInfo?.country || 'India';
  }

  /**
   * Get property area
   */
  getArea(): string {
    if (!this.propertyData?.area) return '2,000 Sq.ft';
    const area = this.propertyData.area;
    const size = this.propertyData.size || 'Sq.ft';
    return `${area.toLocaleString()} ${size}`;
  }

  /**
   * Get property age
   */
  getPropertyAge(): string {
    if (!this.propertyData?.propertyAge) return '2 to 2 Yrs';
    
    const age = this.propertyData.propertyAge;
    if (age.min && age.max) {
      return `${age.min} to ${age.max} Yrs`;
    } else if (age.min) {
      return `${age.min}+ Yrs`;
    } else if (age.max) {
      return `Up to ${age.max} Yrs`;
    }
    
    return 'N/A';
  }

  /**
   * Get availability status
   */
  getAvailability(): string {
    if (!this.propertyData?.availability) return 'Ready To Move';
    
    const availability = this.propertyData.availability;
    
    if (availability.readyToMove) {
      return 'Ready To Move';
    } else if (availability.availableDate) {
      const date = new Date(availability.availableDate);
      return `Available from ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    
    return 'N/A';
  }

  /**
   * Get property video URL
   */
  getVideoUrl(): string | null {
    return this.propertyData?.videoUrl || null;
  }

  /**
   * Get property description
   */
  getDescription(): string {
    return this.propertyData?.description || 'No description available for this property.';
  }

  /**
   * Get number of bedrooms
   */
  getBedrooms(): string {
    const bedrooms = this.propertyData?.bedRooms || 
                     this.propertyData?.noOfBedRooms || 
                     this.propertyData?.bedrooms || 
                     this.propertyData?.numberOfBedrooms;
    
    if (bedrooms === undefined || bedrooms === null) return 'N/A';
    
    return bedrooms === 1 ? '1 Bedroom' : `${bedrooms} Bedrooms`;
  }

  /**
   * Get number of bathrooms
   */
  getBathrooms(): string {
    const bathrooms = this.propertyData?.bathRooms || 
                      this.propertyData?.noOfBathRooms || 
                      this.propertyData?.bathrooms || 
                      this.propertyData?.numberOfBathrooms;
    
    if (bathrooms === undefined || bathrooms === null) return 'N/A';
    
    return bathrooms === 1 ? '1 Bathroom' : `${bathrooms} Bathrooms`;
  }
}

