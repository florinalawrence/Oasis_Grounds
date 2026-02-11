// import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-view-property',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './view-property.html',
//   styleUrl: './view-property.scss',
// })
// export class ViewProperty implements OnChanges {
//   @Input() propertyData: any = null;

//   // Property images
//   mainImage = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop';
  
//   thumbnailImages = [
//     'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
//     'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
//     'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop'
//   ];

//   // All property images for gallery (only 5 images)
//   allImages = [
//     'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
//     'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
//     'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop',
//     'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&h=800&fit=crop',
//     'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop'
//   ];

//   // Gallery modal state
//   isGalleryOpen = false;
//   currentImageIndex = 0;

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['propertyData'] && this.propertyData) {
//       this.loadPropertyImages();
//     }
//   }

//   /**
//    * Load property images from property data
//    */
//   private loadPropertyImages(): void {
//     if (this.propertyData?.images && this.propertyData.images.length > 0) {
//       // Set main image
//       this.mainImage = this.propertyData.images[0] || this.mainImage;
      
//       // Set thumbnail images (up to 3)
//       this.thumbnailImages = this.propertyData.images.slice(1, 4).concat(
//         this.thumbnailImages.slice(this.propertyData.images.slice(1, 4).length)
//       );
      
//       // Set all images for gallery (up to 5)
//       this.allImages = this.propertyData.images.slice(0, 5).concat(
//         this.allImages.slice(this.propertyData.images.slice(0, 5).length)
//       );
//     } else if (this.propertyData?.featuredImage) {
//       // Fallback to featured image if images array is not available
//       this.mainImage = this.propertyData.featuredImage;
//       this.allImages[0] = this.propertyData.featuredImage;
//     }
//   }

//   /**
//    * Get property address
//    */
//   getAddress(): string {
//     if (!this.propertyData?.addressInfo) return 'Mid., Nh944';
//     const addr = this.propertyData.addressInfo;
//     return addr.address || addr.street || 'Mid., Nh944';
//   }

//   /**
//    * Get property state
//    */
//   getState(): string {
//     return this.propertyData?.addressInfo?.state || 'Tamil Nadu';
//   }

//   /**
//    * Get property city
//    */
//   getCity(): string {
//     return this.propertyData?.addressInfo?.city || 'Nagercoil';
//   }

//   /**
//    * Get property zip code
//    */
//   getZipCode(): string {
//     return this.propertyData?.addressInfo?.zipCode || this.propertyData?.addressInfo?.postalCode || '629001';
//   }

//   /**
//    * Get property country
//    */
//   getCountry(): string {
//     return this.propertyData?.addressInfo?.country || 'India';
//   }

//   /**
//    * Get property area
//    */
//   getArea(): string {
//     if (!this.propertyData?.area) return '2,000 Sq.ft';
//     return `${this.propertyData.area} ${this.propertyData.size || 'Sq.ft'}`;
//   }

//   /**
//    * Get property age
//    */
//   getPropertyAge(): string {
//     if (!this.propertyData?.propertyAge) return '2 to 2 Yrs';
//     return this.propertyData.propertyAge;
//   }

//   /**
//    * Get availability status
//    */
//   getAvailability(): string {
//     if (!this.propertyData?.availability) return 'Ready To Move';
    
//     if (this.propertyData.availability.readyToMove) {
//       return 'Ready To Move';
//     } else if (this.propertyData.availability.availableDate) {
//       const date = new Date(this.propertyData.availability.availableDate);
//       return `Since ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
//     }
    
//     return 'Ready To Move';
//   }

//   /**
//    * Get property video URL
//    */
//   getVideoUrl(): string | null {
//     return this.propertyData?.videoUrl || null;
//   }

//   /**
//    * Change main image when clicking on thumbnail
//    */
//   changeMainImage(thumbnailSrc: string, index: number): void {
//     // Swap the main image with the clicked thumbnail
//     const tempImage = this.mainImage;
//     this.mainImage = thumbnailSrc;
//     this.thumbnailImages[index] = tempImage;
//   }

//   /**
//    * Open full gallery modal/lightbox
//    */
//   openGallery(): void {
//     this.isGalleryOpen = true;
//     this.currentImageIndex = 0;
//     document.body.style.overflow = 'hidden'; // Prevent background scrolling
//   }

//   /**
//    * Close gallery modal
//    */
//   closeGallery(): void {
//     this.isGalleryOpen = false;
//     document.body.style.overflow = 'auto'; // Restore scrolling
//   }

//   /**
//    * Navigate to previous image
//    */
//   previousImage(): void {
//     if (this.currentImageIndex > 0) {
//       this.currentImageIndex--;
//     } else {
//       this.currentImageIndex = this.allImages.length - 1; // Loop to last image
//     }
//   }

//   /**
//    * Navigate to next image
//    */
//   nextImage(): void {
//     if (this.currentImageIndex < this.allImages.length - 1) {
//       this.currentImageIndex++;
//     } else {
//       this.currentImageIndex = 0; // Loop to first image
//     }
//   }

//   /**
//    * Select specific image from thumbnails
//    */
//   selectImage(index: number): void {
//     this.currentImageIndex = index;
//   }
// }

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

  // Property images
  mainImage = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop';
  
  thumbnailImages = [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop'
  ];

  // All property images for gallery
  allImages: string[] = [];

  // Gallery modal state
  isGalleryOpen = false;
  currentImageIndex = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyData'] && this.propertyData) {
      console.log('📥 Property data received in view-property:', this.propertyData);
      this.loadPropertyImages();
    }
  }

  /**
   * Load property images from property data
   */
  // private loadPropertyImages(): void {
  //   console.log('🖼️ Loading property images from:', this.propertyData);
    
  //   // Initialize allImages array
  //   this.allImages = [];
    
  //   // Start with featured image as main image
  //   if (this.propertyData?.featuredImage) {
  //     this.mainImage = this.propertyData.featuredImage;
  //     this.allImages.push(this.propertyData.featuredImage);
  //   }

  //   // Check if there's a direct images array
  //   if (this.propertyData?.images && Array.isArray(this.propertyData.images)) {
  //     console.log('📸 Found images array:', this.propertyData.images.length, 'images');
  //     this.propertyData.images.forEach((imageUrl: string) => {
  //       if (imageUrl && !this.allImages.includes(imageUrl)) {
  //         this.allImages.push(imageUrl);
  //       }
  //     });
  //   }

  //   // Add document uploads if they are images
  //   if (this.propertyData?.documentFileUploads && Array.isArray(this.propertyData.documentFileUploads)) {
  //     console.log('📄 Found documentFileUploads:', this.propertyData.documentFileUploads.length, 'documents');
  //     const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  //     const imageUploads = this.propertyData.documentFileUploads.filter((doc: any) => 
  //       imageExtensions.includes(doc.documentType?.toLowerCase())
  //     );

  //     // Add image URLs to allImages array
  //     imageUploads.forEach((doc: any) => {
  //       if (doc.documentUrl && !this.allImages.includes(doc.documentUrl)) {
  //         this.allImages.push(doc.documentUrl);
  //       }
  //     });
  //   }

  //   // If we have images, set thumbnails (first 3 after main image)
  //   if (this.allImages.length > 1) {
  //     this.thumbnailImages = this.allImages.slice(1, 4);
      
  //     // Fill remaining thumbnails with placeholders if needed
  //     while (this.thumbnailImages.length < 3) {
  //       this.thumbnailImages.push('https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop');
  //     }
  //   }

  //   // Ensure allImages has at least the main image
  //   if (this.allImages.length === 0) {
  //     this.allImages = [this.mainImage];
  //   }

  //   console.log('🖼️ Final loaded images:', {
  //     mainImage: this.mainImage,
  //     thumbnailCount: this.thumbnailImages.length,
  //     totalImages: this.allImages.length,
  //     allImages: this.allImages
  //   });
  // }
private loadPropertyImages(): void {

  // 1️⃣ Clear everything
  this.allImages = [];

  // 2️⃣ Set main image
  if (this.propertyData?.featuredImage) {
    this.mainImage = this.propertyData.featuredImage;
  }

  // 3️⃣ Add MAIN image first
  if (this.mainImage && !this.allImages.includes(this.mainImage)) {
    this.allImages.push(this.mainImage);
  }

  // 4️⃣ Add THUMBNAIL images
  this.thumbnailImages.forEach(img => {
    if (img && !this.allImages.includes(img)) {
      this.allImages.push(img);
    }
  });

  console.log('🟢 FINAL allImages (popup):', this.allImages);
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
   * Change main image when clicking on thumbnail
   */
  // changeMainImage(thumbnailSrc: string, index: number): void {
  //   const tempImage = this.mainImage;
  //   this.mainImage = thumbnailSrc;
  //   this.thumbnailImages[index] = tempImage;
    
  //   // Update the allImages array as well
  //   const mainImageIndex = this.allImages.indexOf(tempImage);
  //   const thumbnailIndex = this.allImages.indexOf(thumbnailSrc);
  //   if (mainImageIndex !== -1 && thumbnailIndex !== -1) {
  //     this.allImages[mainImageIndex] = thumbnailSrc;
  //     this.allImages[thumbnailIndex] = tempImage;
  //   }
  // }
changeMainImage(image: string): void {
  this.mainImage = image;
}

  /**
   * Open full gallery modal/lightbox
   */
  openGallery(): void {
    this.isGalleryOpen = true;
    this.currentImageIndex = 0;
    document.body.style.overflow = 'hidden';
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