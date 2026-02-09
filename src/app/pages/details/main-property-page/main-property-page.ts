import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PropertyGallery } from '../property-gallery/property-gallery';
import { PropertyDetails } from '../property-details/property-details';
import { PropertyHeader } from '../property-header/property-header';
import { ContactAgent } from '../contact-agent/contact-agent';
import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
import { ToastService } from '../../../services/Toast-service/toast.service';

@Component({
  selector: 'app-main-property-page',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, PropertyGallery, PropertyDetails, PropertyHeader, ContactAgent],
  templateUrl: './main-property-page.html',
  styleUrl: './main-property-page.scss',
})
export class MainPropertyPage implements OnInit {
  // Dependency injection
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(ManagePropertyService);
  private readonly swalToast = inject(ToastService);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly destroyRef = inject(DestroyRef);

  // Signals for reactive state
  readonly propertyData = signal<any>(null);
  readonly propertyId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly navigationSource = signal<string>('all-properties'); // Default to all-properties

  ngOnInit(): void {
    // Get property ID and navigation source from route parameters
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.propertyId.set(id);
        this.loadPropertyData(id);
      } else {
        this.swalToast.showToast('Property ID not found in URL', 'error');
        this.router.navigate(['/home']);
      }
    });

    // Get navigation source from query parameters
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(queryParams => {
      const source = queryParams.get('source');
      if (source) {
        this.navigationSource.set(source);
        console.log('🧭 Navigation source:', source);
      }
    });
  }

  /**
   * Load property data by ID
   */
  private loadPropertyData(propertyId: string): void {
    this.isLoading.set(true);
    this.spinner.show();

    console.log('🔍 Loading property data for ID:', propertyId);

    this.propertyService.getPropertyById(propertyId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        console.log('✅ Property data loaded:', response);
        
        // Handle different response structures
        const propertyData = response.data || response.body || response;
        this.propertyData.set(propertyData);
        
        this.isLoading.set(false);
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error loading property data:', error);
        
        let errorMessage = 'Failed to load property details';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.swalToast.showToast(errorMessage, 'error');
        this.isLoading.set(false);
        this.spinner.hide();
        
        // Navigate back to home or properties page
        this.router.navigate(['/home']);
      }
    });
  }

  /**
   * Navigate to home page
   */
  goToHome(): void {
    this.router.navigate(['/home']);
  }
}
