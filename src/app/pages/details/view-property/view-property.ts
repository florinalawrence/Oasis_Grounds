import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-property',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-property.html',
  styleUrl: './view-property.scss',
})
export class ViewProperty implements OnChanges {
  @Input() propertyData: any = null;
  @Input() navigationSource: string = 'all-properties';

  // Property images - will be populated from propertyData
  mainImage = 'assets/images/no_image.png';
  
  thumbnailImages: string[] = [];

  // All property images for gallery
  allImages: string[] = [];

  // Gallery modal state
  isGalleryOpen = false;
  currentImageIndex = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyData'] && this.propertyData) {
      this.loadPropertyImages();
    }
  }

 
private loadPropertyImages(): void {

    // 1️⃣ Clear everything
    this.allImages = [];
    this.thumbnailImages = [];

    // 2️⃣ Set main image from featured image
    if (this.propertyData?.featuredImage && 
        this.propertyData.featuredImage.trim() !== '' &&
        this.propertyData.featuredImage !== 'assets/images/no_image.png') {
      this.mainImage = this.propertyData.featuredImage;
    } else {
      this.mainImage = 'assets/images/no_image.png';
    }

    // Add featured image to all images if it exists
    if (this.mainImage && this.mainImage !== 'assets/images/no_image.png') {
      this.allImages.push(this.mainImage);
    }

    //  Add list of images
    if (this.propertyData?.listOfImage && Array.isArray(this.propertyData.listOfImage)) {
      this.propertyData.listOfImage.forEach((img: string) => {
        if (img && img.trim() !== '' && img !== 'assets/images/no_image.png') {
          this.thumbnailImages.push(img);
          if (!this.allImages.includes(img)) {
            this.allImages.push(img);
          }
        }
      });
    }

    //  Add document images
    if (this.propertyData?.documentFileUploads && Array.isArray(this.propertyData.documentFileUploads)) {
      this.propertyData.documentFileUploads.forEach((doc: any) => {
        if (doc?.fileUrl && doc.fileUrl.trim() !== '' && doc.fileUrl !== 'assets/images/no_image.png') {
          this.thumbnailImages.push(doc.fileUrl);
          if (!this.allImages.includes(doc.fileUrl)) {
            this.allImages.push(doc.fileUrl);
          }
        }
      });
    }

    //  If no main image but we have thumbnails, use first thumbnail as main
    if (this.mainImage === 'assets/images/no_image.png' && this.thumbnailImages.length > 0) {
      this.mainImage = this.thumbnailImages[0];
    }

    //  Ensure we have at least 3 thumbnail images for the grid (pad with placeholders if needed)
    while (this.thumbnailImages.length < 3 && this.hasImages()) {
      this.thumbnailImages.push('assets/images/no_image.png');
    }

  }



  /**
   * Get property address
   */
  getAddress(): string {
    if (!this.propertyData?.addressInfo) return 'Address not available';
    
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
    return this.propertyData?.addressInfo?.state || 'N/A';
  }

  /**
   * Get property city
   */
  getCity(): string {
    return this.propertyData?.addressInfo?.city || 'N/A';
  }

  /**
   * Get property zip code
   */
  getZipCode(): string {
    return this.propertyData?.addressInfo?.zipCode || 'N/A';
  }

  /**
   * Get property country
   */
  getCountry(): string {
    return this.propertyData?.addressInfo?.country || 'N/A';
  }

  /**
   * Get property area
   */
  getArea(): string {
    if (!this.propertyData?.area) return 'N/A';
    const area = this.propertyData.area;
    const size = this.propertyData.size || 'Sq.ft';
    return `${area.toLocaleString()} ${size}`;
  }

  /**
   * Get property age
   */
  getPropertyAge(): string {
    if (!this.propertyData?.propertyAge) return 'N/A';
    
    const age = this.propertyData.propertyAge;
    if (age.min && age.max) {
      return `${age.min} to ${age.max} Years`;
    } else if (age.min) {
      return `${age.min}+ Years`;
    } else if (age.max) {
      return `Up to ${age.max} Years`;
    }
    
    return 'N/A';
  }

  /**
   * Get availability status
   */
  getAvailability(): string {
    if (!this.propertyData?.availability) return 'N/A';
    
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
   * Get property features
   */
  getFeatures(): string[] {
    return this.propertyData?.features || [];
  }

  /**
   * Get property facilities
   */
  getFacilities(): string[] {
    return this.propertyData?.manageFacility || [];
  }

  /**
   * Get nearby locations
   */
  getNearbyLocations(): any[] {
    return this.propertyData?.propertyNearByLocation || [];
  }

  /**
   * Check if property has any images (featured image or list of images)
   */
  hasImages(): boolean {
    const hasFeaturedImage = this.propertyData?.featuredImage && 
                            this.propertyData.featuredImage.trim() !== '' &&
                            this.propertyData.featuredImage !== 'assets/images/no_image.png';
    
    const hasListImages = this.propertyData?.listOfImage && 
                         Array.isArray(this.propertyData.listOfImage) && 
                         this.propertyData.listOfImage.length > 0 &&
                         this.propertyData.listOfImage.some((img: string) => 
                           img && img.trim() !== '' && img !== 'assets/images/no_image.png'
                         );
    
    const hasDocumentImages = this.propertyData?.documentFileUploads && 
                             Array.isArray(this.propertyData.documentFileUploads) && 
                             this.propertyData.documentFileUploads.length > 0 &&
                             this.propertyData.documentFileUploads.some((doc: any) => 
                               doc?.fileUrl && doc.fileUrl.trim() !== '' && doc.fileUrl !== 'assets/images/no_image.png'
                             );

    return hasFeaturedImage || hasListImages || hasDocumentImages;
  }

  /**
   * Check if property has multiple images (more than just the main image)
   */
  hasMultipleImages(): boolean {
    return this.allImages.length > 1;
  }

 
 
changeMainImage(image: string): void {
  this.mainImage = image;
}

  /**
   * Open full gallery modal/lightbox
   */
  openGallery(): void {
    if (this.hasImages()) {
      this.isGalleryOpen = true;
      this.currentImageIndex = 0;
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Close gallery modal
   */
  closeGallery(): void {
    this.isGalleryOpen = false;
    document.body.style.overflow = 'auto';
  }

  /**
   * Navigate to previous image
   */
  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.allImages.length - 1;
    }
  }

  /**
   * Navigate to next image
   */
  nextImage(): void {
    if (this.currentImageIndex < this.allImages.length - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0;
    }
  }

  /**
   * Select specific image from thumbnails
   */
  selectImage(index: number): void {
    this.currentImageIndex = index;
  }
}