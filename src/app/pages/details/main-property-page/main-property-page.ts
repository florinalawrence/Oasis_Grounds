import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { LoaderService } from '../../../services/loader.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyGallery } from '../property-gallery/property-gallery';
import { PropertyDetails } from '../property-details/property-details';
import { PropertyHeader } from '../property-header/property-header';
import { ContactAgent } from '../contact-agent/contact-agent';
import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
import { ToastService } from '../../../services/Toast-service/toast.service';

@Component({
  selector: 'app-main-property-page',
  standalone: true,
  imports: [CommonModule, PropertyGallery, PropertyDetails, PropertyHeader, ContactAgent],
  templateUrl: './main-property-page.html',
  styleUrl: './main-property-page.scss',
})
export class MainPropertyPage implements OnInit {
  
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(ManagePropertyService);
  private readonly swalToast = inject(ToastService);
  private readonly loader = inject(LoaderService);

 
  private readonly rawPropertyData = signal<any>(null);
  readonly propertyId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly navigationSource = signal<string>('all-properties');

  
  readonly propertyData = computed(() => {
    const raw = this.rawPropertyData();
    const extracted = raw?.recordInfo || raw;
    return extracted;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.propertyId.set(id);
        this.loadPropertyData(id);
      } else {
        this.swalToast.showToast('Property ID not found in URL', 'error');
        this.router.navigate(['/all-property']);
      }
    });

    // Get navigation source from query parameters
    this.route.queryParamMap.subscribe((queryParams) => {
      const source = queryParams.get('source');
      if (source) {
        this.navigationSource.set(source);
      }
    });
  }

 
  private loadPropertyData(propertyId: string): void {
    this.isLoading.set(true);
    this.loader.show();

    this.propertyService.getPropertyById(propertyId).subscribe({
      next: (response) => {
        const propertyData = response.data || response.body || response;
        this.rawPropertyData.set(propertyData);

        this.isLoading.set(false);
        this.loader.hide();
      },
      error: (error) => {
        let errorMessage = 'Failed to load property details';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.swalToast.showToast(errorMessage, 'error');
        this.isLoading.set(false);
        this.loader.hide();

        this.router.navigate(['/all-property']);
      },
    });
  }

  /**
   * Navigate to home page
   */
  goToHome(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Determine whether to show the contact section
   * Only show for public property views (from all-properties)
   * Hide for user's own properties (from my-properties)
   */
  shouldShowContactSection(): boolean {
    return this.navigationSource() !== 'my-properties';
  }
}
