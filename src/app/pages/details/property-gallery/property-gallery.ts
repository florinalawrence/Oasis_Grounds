import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-property-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-gallery.html',
  styleUrl: './property-gallery.scss',
})
export class PropertyGallery implements OnChanges {
  @Input() propertyData: any = null;

  public currentIndex: number = 0;
  public isFullscreen: boolean = false;
  public images: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyData'] && this.propertyData) {
      console.log('📥 Property data received in property-gallery:', this.propertyData);
      this.loadPropertyImages();
    }
  }

  /**
   * Load property images from property data
   */
  private loadPropertyImages(): void {
    console.log('🖼️ Loading property images for gallery from:', this.propertyData);

    // Clear existing images
    this.images = [];

    // Add featured image first if available
    if (this.propertyData?.featuredImage && 
        this.propertyData.featuredImage.trim() !== '' &&
        this.propertyData.featuredImage !== 'assets/images/no_image.png') {
      this.images.push(this.propertyData.featuredImage);
    }

    // Add list of images
    if (this.propertyData?.listOfImage && Array.isArray(this.propertyData.listOfImage)) {
      this.propertyData.listOfImage.forEach((img: string) => {
        if (img && img.trim() !== '' && img !== 'assets/images/no_image.png' && !this.images.includes(img)) {
          this.images.push(img);
        }
      });
    }

    // Add document images
    if (this.propertyData?.documentFileUploads && Array.isArray(this.propertyData.documentFileUploads)) {
      this.propertyData.documentFileUploads.forEach((doc: any) => {
        if (doc?.fileUrl && doc.fileUrl.trim() !== '' && doc.fileUrl !== 'assets/images/no_image.png' && !this.images.includes(doc.fileUrl)) {
          this.images.push(doc.fileUrl);
        }
      });
    }

    // If no images available, use placeholder
    if (this.images.length === 0) {
      this.images = ['assets/images/no_image.png'];
    }

    // Reset current index if it's out of bounds
    if (this.currentIndex >= this.images.length) {
      this.currentIndex = 0;
    }

    console.log('🖼️ Gallery images loaded:', this.images);
  }

  /**
   * Check if gallery has valid images (not just placeholders)
   */
  hasValidImages(): boolean {
    return this.images.length > 0 && 
           this.images.some(img => img !== 'assets/images/no_image.png');
  }

  public nextImage(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  public prevImage(): void {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  public selectImage(index: number): void {
    this.currentIndex = index;
  }

  public openFullscreen(): void {
    this.isFullscreen = true;
  }

  public closeFullscreen(): void {
    this.isFullscreen = false;
  }
}


