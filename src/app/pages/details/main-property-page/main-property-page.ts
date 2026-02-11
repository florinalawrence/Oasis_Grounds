import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PropertyGallery } from '../property-gallery/property-gallery';
import { PropertyDetails } from '../property-details/property-details';
import { PropertyHeader } from '../property-header/property-header';
import { ContactAgent } from '../contact-agent/contact-agent';
import { ViewProperty } from '../view-property/view-property';
import { CommonSpinner } from '../../../shared/components/common-spinner/common-spinner';
import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { LoaderService } from '../../../services/loader.service';

@Component({
  selector: 'app-main-property-page',
  standalone: true,
  imports: [CommonModule, PropertyGallery, PropertyDetails, PropertyHeader, ContactAgent, ViewProperty, CommonSpinner],
  templateUrl: './main-property-page.html',
  styleUrl: './main-property-page.scss',
})
export class MainPropertyPage implements OnInit {
  // Dependency injection
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(ManagePropertyService);
  private readonly swalToast = inject(ToastService);
  private readonly loader = inject(LoaderService);
  private readonly destroyRef = inject(DestroyRef); 

  // Signals for reactive state
  readonly propertyData = signal<any>(null);
  readonly propertyId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly navigationSource = signal<string>('all-properties'); 

  ngOnInit(): void {
    // Get property ID and navigation source from route parameters
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.propertyId.set(id);
        // Always make API call to get fresh property data
        this.loadPropertyData(id);
      } else {
        this.swalToast.showToast('Property ID not found in URL', 'error');
        this.router.navigate(['/home']);
      }
    });

    // Get navigation source from query parameters
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(queryParams => {
      const source = queryParams.get('source');
      console.log('🔍 Query params:', queryParams.keys);
      console.log('🔍 Source from URL:', source);
      if (source) {
        this.navigationSource.set(source);
        console.log('✅ Navigation source set to:', this.navigationSource());
      } else {
        console.log('⚠️ No source in URL, using default:', this.navigationSource());
      }
    });
  }

  /**
   * Load property data by ID
   */
  private loadPropertyData(propertyId: string): void {
    console.log('🔍 Loading property data for ID:', propertyId);
    console.log('🌐 Base API URL:', this.propertyService.baseApiUrl);
    console.log('🌐 Full API URL:', `${this.propertyService.baseApiUrl}property/view/property/${propertyId}`);
    
    this.isLoading.set(true);
    this.loader.show();

    this.propertyService.getPropertyById(propertyId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        console.log('📦 Raw API Response:', response);
        console.log('📦 Response Type:', typeof response);
        console.log('📦 Response Keys:', Object.keys(response || {}));
        
        // Handle different response structures
        let propertyData = null;
        
        // Try different possible response structures
        if (response?.recordInfo) {
          propertyData = response.recordInfo;
          console.log('✅ Using response.recordInfo');
        } else if (response?.data) {
          propertyData = response.data;
          console.log('✅ Using response.data');
        } else if (response?.body) {
          propertyData = response.body;
          console.log('✅ Using response.body');
        } else if (response && typeof response === 'object') {
          propertyData = response;
          console.log('✅ Using direct response object');
        }
        
        console.log('🏠 Final Property Data:', propertyData);
        
        if (propertyData) {
          this.propertyData.set(propertyData);
          console.log('✅ Property data set successfully');
        } else {
          console.warn('⚠️ No property data found in response');
          this.swalToast.showToast('Property data not found', 'error');
        }
        
        this.isLoading.set(false);
        this.loader.hide();
      },
      error: (error) => {
        console.error('❌ Error loading property data:', error);
        console.error('❌ Error Status:', error.status);
        console.error('❌ Error Message:', error.message);
        console.error('❌ Error Response:', error.error);
        
        let errorMessage = 'Failed to load property details';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.swalToast.showToast(errorMessage, 'error');
        this.isLoading.set(false);
        this.loader.hide();
        
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
