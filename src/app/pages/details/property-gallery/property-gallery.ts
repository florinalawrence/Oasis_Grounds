import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-property-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-gallery.html',
  styleUrl: './property-gallery.scss',
})
export class PropertyGallery {
  



  public currentIndex: number = 0;
  public isFullscreen: boolean = false;

  public images: string[] = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&q=80',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200&q=80'
  ];

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


