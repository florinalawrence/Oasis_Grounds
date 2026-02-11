import { Component, Input, OnInit, OnChanges, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule, Router } from '@angular/router';
import { Location } from '@angular/common';

interface BreadcrumbItem {
  label: string;
  route?: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-property-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './property-header.html',
  styleUrl: './property-header.scss',
})
export class PropertyHeader implements OnInit, OnChanges {
  @Input() propertyData: any = null;
  @Input() navigationSource: string = 'all-properties';

  // Dependency injection
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  // Signals for reactive state
  readonly breadcrumbs = signal<BreadcrumbItem[]>([]);

  ngOnInit(): void {
    this.updateBreadcrumbs();
  }

  ngOnChanges(): void {
    console.log('📥 Property data received in property-header:', this.propertyData);
    this.updateBreadcrumbs();
  }

  /**
   * Update breadcrumbs based on navigation source
   */
  private updateBreadcrumbs(): void {
    let breadcrumbItems: BreadcrumbItem[] = [];

    switch (this.navigationSource) {
      case 'my-properties':
        breadcrumbItems = [
          { label: 'Home', route: '/home' },
          { label: 'My Properties', route: '/user-dashboard/my-property' },
          { label: 'View Property', isActive: true }
        ];
        break;
      case 'home':
        breadcrumbItems = [
          { label: 'Home', route: '/home' },
          { label: 'View Property', isActive: true }
        ];
        break;
      case 'all-properties':
      default:
        // Default for all-properties or any other source
        breadcrumbItems = [
          { label: 'Home', route: '/home' },
          { label: 'All Properties', route: '/all-property' },
          { label: 'View Property', isActive: true }
        ];
        break;
    }

    this.breadcrumbs.set(breadcrumbItems);
    console.log('🧭 Updated breadcrumbs for source:', this.navigationSource, breadcrumbItems);
  }

  /**
   * Get property title for display
   */
  getPropertyTitle(): string {
    // Try different possible title fields
    return this.propertyData?.title || 
           this.propertyData?.propertyTitle || 
           this.propertyData?.name || 
           this.propertyData?.propertyName ||
           'Property Details';
  }

  /**
   * Get property location for display
   */
  getPropertyLocation(): string {
    const address = this.propertyData?.addressInfo;
    if (!address) return 'Location not available';

    const parts = [];
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);

    return parts.join(', ') || 'Location not available';
  }

  /**
   * Get property price for display
   */
  getPropertyPrice(): string {
    // Try different possible price fields
    const price = this.propertyData?.price || 
                  this.propertyData?.propertyPrice || 
                  this.propertyData?.amount;
    
    if (!price) return 'Price not available';
    
    const currency = this.propertyData?.currency || 'INR';
    
    // Format price based on currency
    if (currency === 'INR') {
      return `₹${this.formatIndianNumber(price)}`;
    } else {
      return `${currency} ${price}`;
    }
  }

  /**
   * Get property status (Sell/Rent/Lease)
   */
  getPropertyStatus(): string {
    const status = this.propertyData?.status || 
                   this.propertyData?.propertyStatus || 
                   this.propertyData?.type;
    
    if (status === 'Sell' || status === 'Sale') return 'For Sale';
    if (status === 'Rent') return 'For Rent';
    if (status === 'Lease') return 'For Lease';
    return 'Available';
  }

  /**
   * Format number in Indian style (lakhs, crores)
   */
  private formatIndianNumber(num: number): string {
    if (num >= 10000000) {
      return (num / 10000000).toFixed(2) + ' Cr';
    } else if (num >= 100000) {
      return (num / 100000).toFixed(2) + ' L';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + ' K';
    }
    return num.toString();
  }

  /**
   * Go back to previous page
   */
  goBack(): void {
    switch (this.navigationSource) {
      case 'my-properties':
        this.router.navigate(['/user-dashboard/my-property']);
        break;
      case 'home':
        this.router.navigate(['/home']);
        break;
      case 'all-properties':
      default:
        this.router.navigate(['/all-property']);
        break;
    }
  }
}
