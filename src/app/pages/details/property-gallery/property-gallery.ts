import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, signal, computed } from '@angular/core';

@Component({
  selector: 'app-property-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-gallery.html',
  styleUrl: './property-gallery.scss',
})
export class PropertyGallery implements OnChanges {
  @Input() propertyData: any = null;
  @Input() navigationSource: string = 'all-properties';

  public currentIndex: number = 0;
  public isFullscreen: boolean = false;
  public showImageViewer: boolean = false;

  // Computed signal for images from property data
  public readonly images = computed(() => {
    if (!this.propertyData) return [];
    
    const propertyImages = [];
    
    // Add featured image if available
    if (this.propertyData.featuredImage) {
      propertyImages.push(this.propertyData.featuredImage);
    }
    
    // Add other images if available
    if (this.propertyData.listOfImage && Array.isArray(this.propertyData.listOfImage)) {
      propertyImages.push(...this.propertyData.listOfImage);
    }
    
    return propertyImages;
  });

  // Computed signal to check if property has actual images
  public readonly hasPropertyImages = computed(() => {
    return this.images().length > 0;
  });

  // Computed signal to get display images (with fallback only when needed)
  public readonly displayImages = computed(() => {
    const propertyImages = this.images();
    return propertyImages.length > 0 ? propertyImages : this.defaultImages;
  });

  // Computed signal to check if we should use split layout (for my-properties)
  public readonly useSplitLayout = computed(() => {
    return this.navigationSource === 'my-properties';
  });

  // Computed signal for grid images (excluding the main image)
  public readonly gridImages = computed(() => {
    const allImages = this.displayImages();
    return allImages.slice(1); // All images except the first one
  });

  // Default fallback images
  private readonly defaultImages: string[] = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80',
  ];

  ngOnChanges(): void {
    // Reset current index when property data changes
    this.currentIndex = 0;
    console.log('🖼️ PropertyGallery received property data:', this.propertyData);
    console.log('🖼️ Navigation source:', this.navigationSource);
    console.log('🖼️ Has property images:', this.hasPropertyImages());
    console.log('🖼️ Property images:', this.images());
    console.log('🖼️ Display images:', this.displayImages());
  }

  public nextImage(): void {
    const imageList = this.displayImages();
    this.currentIndex = (this.currentIndex + 1) % imageList.length;
  }

  public prevImage(): void {
    const imageList = this.displayImages();
    this.currentIndex = (this.currentIndex - 1 + imageList.length) % imageList.length;
  }

  public selectImage(index: number): void {
    this.currentIndex = index;
  }

  public openFullscreen(): void {
    this.isFullscreen = true;
    this.showImageViewer = false;
  }

  public closeFullscreen(): void {
    this.isFullscreen = false;
    this.showImageViewer = false;
  }

  public selectImageAndView(index: number): void {
    this.currentIndex = index;
    this.showImageViewer = true;
  }

  public closeImageViewer(): void {
    this.showImageViewer = false;
  }
}
