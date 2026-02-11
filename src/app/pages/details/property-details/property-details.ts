import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ViewProperty } from '../view-property/view-property';
import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
import { LoaderService } from '../../../services/loader.service';
import { ToastService } from '../../../services/Toast-service/toast.service';

/**
 * Property Details Page Component
 * This component fetches property details by ID and passes them to the view-property component
 */
@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, ViewProperty],
  template: `
    <div class="container mt-4">
      @if (propertyData()) {
        <app-view-property [propertyData]="propertyData()"></app-view-property>
      } @else if (loading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3">Loading property details...</p>
        </div>
      } @else if (error()) {
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Error Loading Property</h4>
          <p>{{ error() }}</p>
          <hr>
          <button class="btn btn-primary" (click)="retry()">Try Again</button>
          <button class="btn btn-secondary ms-2" (click)="goBack()">Go Back</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .container {
      // max-width: 1200px;
      margin: 0 auto;
      
    }
  `]
})
export class PropertyDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(ManagePropertyService);
  private readonly loader = inject(LoaderService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // Signals for reactive state
  readonly propertyData = signal<any>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string>('');
  readonly propertyId = signal<string>('');

  ngOnInit(): void {
    // Get property ID from route parameters
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.propertyId.set(id);
          this.loadPropertyDetails(id);
        } else {
          this.error.set('No property ID provided');
        }
      });

    // Alternative: Get property ID from query parameters
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        if (id && !this.propertyId()) {
          this.propertyId.set(id);
          this.loadPropertyDetails(id);
        }
      });
  }

  /**
   * Load property details from API
   */
  private loadPropertyDetails(propertyId: string): void {
    this.loading.set(true);
    this.error.set('');
    this.loader.show();

    // Call the API service to get property details
    this.propertyService.getPropertyById(propertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          console.log('📥 Property Details API Response:', response);
          
          // Extract property data from response
          // The API response structure is: { headers: {...}, recordInfo: {...} }
          const propertyData = response?.recordInfo || response?.data || response;
          
          if (propertyData) {
            this.propertyData.set(propertyData);
            this.loading.set(false);
            this.loader.hide();
          } else {
            this.error.set('Property data not found in response');
            this.loading.set(false);
            this.loader.hide();
          }
        },
        error: (err: any) => {
          console.error('❌ Error loading property details:', err);
          
          const errorMessage = err?.error?.headers?.message 
            || err?.error?.message 
            || err?.message 
            || 'Failed to load property details';
          
          this.error.set(errorMessage);
          this.loading.set(false);
          this.loader.hide();
          this.toast.showToast(errorMessage, 'error');
        }
      });
  }

  /**
   * Retry loading property details
   */
  retry(): void {
    const id = this.propertyId();
    if (id) {
      this.loadPropertyDetails(id);
    }
  }

  /**
   * Navigate back to previous page
   */
  goBack(): void {
    // Check if there's a source in query params to go back to
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const source = params.get('source');
        if (source === 'my-properties') {
          this.router.navigate(['/my-properties']);
        } else {
          // Default fallback - go to home or properties list
          this.router.navigate(['/']);
        }
      });
  }
}

// import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { ViewProperty } from '../view-property/view-property';
// import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
// import { LoaderService } from '../../../services/loader.service';
// import { ToastService } from '../../../services/Toast-service/toast.service';
// import { SessionService } from '../../../services/Session-service/session.service';
// import { RoutePath } from '../../../core/constant/api.constant';

// /**
//  * Property Details Page Component
//  * This component fetches property details by ID and passes them to the view-property component
//  */
// @Component({
//   selector: 'app-property-details',
//   standalone: true,
//   imports: [CommonModule, ViewProperty],
//   template: `
//     <div class="property-details-page">
//       <!-- Breadcrumb Navigation -->
//       <div class="container mt-3">
//         <nav aria-label="breadcrumb">
//           <ol class="breadcrumb">
//             <li class="breadcrumb-item">
//               <a (click)="navigateToHome()" style="cursor: pointer;">Home</a>
//             </li>
//             @if (sourceRoute() === 'my-properties') {
//               <li class="breadcrumb-item">
//                 <a (click)="navigateToMyProperties()" style="cursor: pointer;">My Properties</a>
//               </li>
//             }
//             <li class="breadcrumb-item active" aria-current="page">Property Details</li>
//           </ol>
//         </nav>
//       </div>

//       <!-- Loading State -->
//       @if (loading()) {
//         <div class="container">
//           <div class="text-center py-5">
//             <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
//               <span class="visually-hidden">Loading...</span>
//             </div>
//             <p class="mt-3 text-muted">Loading property details...</p>
//           </div>
//         </div>
//       }

//       <!-- Error State -->
//       @if (error() && !loading()) {
//         <div class="container mt-4">
//           <div class="alert alert-danger" role="alert">
//             <div class="d-flex align-items-center mb-3">
//               <i class="bi bi-exclamation-triangle-fill me-2" style="font-size: 1.5rem;"></i>
//               <h4 class="alert-heading mb-0">Error Loading Property</h4>
//             </div>
//             <p class="mb-3">{{ error() }}</p>
//             <hr>
//             <div class="d-flex gap-2">
//               <button class="btn btn-primary" (click)="retry()">
//                 <i class="bi bi-arrow-clockwise me-1"></i>
//                 Try Again
//               </button>
//               <button class="btn btn-secondary" (click)="goBack()">
//                 <i class="bi bi-arrow-left me-1"></i>
//                 Go Back
//               </button>
//             </div>
//           </div>
//         </div>
//       }

//       <!-- Property View Component -->
//       @if (propertyData() && !loading() && !error()) {
//         <app-view-property [propertyData]="propertyData()"></app-view-property>
//       }
//     </div>
//   `,
//   styles: [`
//     .property-details-page {
//       min-height: 100vh;
//       background-color: #f8f9fa;
//     }

//     .breadcrumb {
//       background-color: transparent;
//       padding: 0.75rem 0;
//       margin-bottom: 0;
//     }

//     .breadcrumb-item + .breadcrumb-item::before {
//       content: "›";
//       font-size: 1.2rem;
//       color: #6c757d;
//     }

//     .breadcrumb-item a {
//       color: #667eea;
//       text-decoration: none;
//       transition: color 0.2s;
//     }

//     .breadcrumb-item a:hover {
//       color: #5568d3;
//       text-decoration: underline;
//     }

//     .breadcrumb-item.active {
//       color: #6c757d;
//     }
//   `]
// })
// export class PropertyDetails implements OnInit {
//   private readonly route = inject(ActivatedRoute);
//   private readonly router = inject(Router);
//   private readonly propertyService = inject(ManagePropertyService);
//   private readonly loader = inject(LoaderService);
//   private readonly toast = inject(ToastService);
//   private readonly session = inject(SessionService);
//   private readonly destroyRef = inject(DestroyRef);

//   // Route paths
//   routePath = RoutePath;

//   // Signals for reactive state
//   readonly propertyData = signal<any>(null);
//   readonly loading = signal<boolean>(false);
//   readonly error = signal<string>('');
//   readonly propertyId = signal<string>('');
//   readonly sourceRoute = signal<string>('');

//   ngOnInit(): void {
    
//     // Get source route from query params
//     this.route.queryParamMap
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(params => {
//         const source = params.get('source');
//         if (source) {
//           this.sourceRoute.set(source);
//         }
//       });

//     // Get property ID from route parameters (e.g., /details/:id)
//     this.route.paramMap
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(params => {
//         const id = params.get('id');
//         if (id) {
//           this.propertyId.set(id);
//           this.loadPropertyDetails(id);
//         } else {
//           // Fallback: Try to get ID from query params (e.g., /details?id=xxx)
//           this.route.queryParamMap
//             .pipe(takeUntilDestroyed(this.destroyRef))
//             .subscribe(queryParams => {
//               const queryId = queryParams.get('id');
//               if (queryId) {
//                 this.propertyId.set(queryId);
//                 this.loadPropertyDetails(queryId);
//               } else {
//                 this.error.set('No property ID provided');
//               }
//             });
//         }
//       });
//   }

//   /**
//    * Load property details from API using your existing service
//    */
//   private loadPropertyDetails(propertyId: string): void {
    
//     // Check authentication
//     const token = this.session.getToken();
//     if (!token) {
//       this.error.set('Please login to view property details');
//       this.toast.showToast('Please login to continue', 'warning');
//       this.router.navigate([this.routePath.LOGIN]);
//       return;
//     }

//     this.loading.set(true);
//     this.error.set('');
//     this.loader.show();

//     // Use your existing service method
//     this.propertyService.getPropertyById(propertyId)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (response: any) => {
          
//           // Extract property data from response
//           // Based on your API response structure: { headers: {...}, recordInfo: {...} }
//           const propertyData = response?.recordInfo || response?.data || response;
          
//           if (propertyData) {
//             this.propertyData.set(propertyData);
//             this.loading.set(false);
//             this.loader.hide();
//           } else {
//             this.error.set('Property data not found in response');
//             this.loading.set(false);
//             this.loader.hide();
//           }
//         },
//         error: (err: any) => {
          
//           // Handle different error scenarios
//           let errorMessage = 'Failed to load property details';
          
//           if (err?.message) {
//             errorMessage = err.message;
//           } else if (err?.error?.headers?.message) {
//             errorMessage = err.error.headers.message;
//           } else if (err?.error?.message) {
//             errorMessage = err.error.message;
//           }

//           // Check for authentication errors
//           if (err?.message?.includes('session') || err?.message?.includes('login')) {
//             this.session.removeCredentials();
//             this.router.navigate([this.routePath.LOGIN]);
//           }
          
//           this.error.set(errorMessage);
//           this.loading.set(false);
//           this.loader.hide();
//           this.toast.showToast(errorMessage, 'error');
//         }
//       });
//   }

//   /**
//    * Retry loading property details
//    */
//   retry(): void {
//     const id = this.propertyId();
//     if (id) {
//       this.loadPropertyDetails(id);
//     } else {
//       this.error.set('Cannot retry: No property ID available');
//     }
//   }

//   /**
//    * Navigate back to previous page
//    */
//   goBack(): void {
//     const source = this.sourceRoute();
//     console.log('⬅️ Going back to source:', source || 'home');
    
//     if (source === 'my-properties') {
//       this.router.navigate([this.routePath.MY_PROPERTIES]);
//     } else {
//       // Default fallback - go to home
//       this.router.navigate([this.routePath.HOME]);
//     }
//   }

//   /**
//    * Navigate to home page
//    */
//   navigateToHome(): void {
//     this.router.navigate([this.routePath.HOME]);
//   }

//   /**
//    * Navigate to my properties page
//    */
//   navigateToMyProperties(): void {
//     this.router.navigate([this.routePath.MY_PROPERTIES]);
//   }
// }