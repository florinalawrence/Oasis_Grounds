// import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
// import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, NavigationExtras } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { Meta, Title } from '@angular/platform-browser';
// import { UserProfilesService} from '../../../services/UserProfile-service/user-profile.service';

// interface CarouselImage {
//   id: number;
//   url: string;
//   alt: string;
//   title?: string;
//   description?: string;
// }

// interface CountryCode {
//   name: string;
//   code: string;
//   dial_code: string;
// }

// interface SearchFormData {
//   country: string;
//   propertyType: string;
//   status: string;
// }

// interface PropertyType {
//   value: string;
//   label: string;
//   icon?: string;
// }

// interface PropertyStatus {
//   value: string;
//   label: string;
//   color?: string;
// }

// @Component({
//   selector: 'app-home',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './home.html',
//   styleUrls: ['./home.scss'],
// })
// export class Home implements OnInit {
//   // Angular 20 dependency injection using inject()
//   private readonly fb = inject(FormBuilder);
//   private readonly router = inject(Router);
//   private readonly userProfileService = inject(UserProfilesService);
//   private readonly meta = inject(Meta);
//   private readonly title = inject(Title);

//   // Angular 20 signals for reactive state management
//   readonly countryCodes = signal<CountryCode[]>([]);
//   readonly isLoading = signal<boolean>(false);
//   readonly currentSlide = signal<number>(0);
//   readonly searchSubmitted = signal<boolean>(false);

//   readonly carouselImages = signal<CarouselImage[]>([
//     {
//       id: 1,
//       url: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
//       alt: 'Modern Apartments',
//       // title: 'Modern Apartments',
//       // description: 'Discover luxury living in our modern apartment complexes'
//     },
//     {
//       id: 2,
//       url: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90',
//       alt: 'Luxury Villas',
//       // title: 'Luxury Villas',
//       // description: 'Experience elegance in our premium villa collections'
//     },
//     {
//       id: 3,
//       url: 'https://img.freepik.com/premium-photo/modern-luxury-home-with-blue-siding_332679-26506.jpg',
//       alt: 'Commercial Spaces',
//       // title: 'Commercial Spaces',
//       // description: 'Prime commercial properties for your business needs'
//     },
//   ]);

//   readonly propertyTypes = signal<PropertyType[]>([
//     { value: 'Plots', label: 'Plots', icon: 'fa-map' },
//     { value: 'Apartments', label: 'Apartments', icon: 'fa-building' },
//     { value: 'Commercial', label: 'Commercial', icon: 'fa-briefcase' },
//     { value: 'Villas', label: 'Villas', icon: 'fa-home' },
//     { value: 'Row house', label: 'Row House', icon: 'fa-home' },
//     { value: 'Agricultural land', label: 'Agricultural Land', icon: 'fa-leaf' },
//     { value: 'Farmhouses', label: 'Farmhouses', icon: 'fa-tree' },
//     { value: 'Vacation homes', label: 'Vacation Homes', icon: 'fa-umbrella-beach' },
//     { value: 'Residential complex', label: 'Residential Complex', icon: 'fa-city' },
//     { value: 'Individual house', label: 'Individual House', icon: 'fa-house-user' },
//     { value: 'Shop', label: 'Shop', icon: 'fa-store' }
//   ]);

//   readonly propertyStatuses = signal<PropertyStatus[]>([
//     { value: 'Sell', label: 'For Sale', color: 'success' },
//     { value: 'Rent', label: 'For Rent', color: 'primary' }
//   ]);

//   readonly searchFilterForm = signal<FormGroup>(this.createSearchForm());

//   // Computed signals for enhanced functionality
//   readonly pageMetadata = computed(() => ({
//     title: 'JMR Real Estate - Find Your Dream Property',
//     description: 'Discover premium properties including apartments, villas, commercial spaces, and plots. Find your perfect home or investment opportunity with JMR Real Estate.',
//     keywords: 'real estate, properties, apartments, villas, commercial, plots, buy, rent, JMR Real Estate'
//   }));

//   readonly isFormValid = computed(() => this.searchFilterForm().valid);
//   readonly hasSearchCriteria = computed(() => {
//     const form = this.searchFilterForm();
//     return !!(form.get('country')?.value || form.get('propertyType')?.value || form.get('status')?.value);
//   });

//   readonly searchFormData = computed(() => {
//     const form = this.searchFilterForm();
//     return {
//       country: form.get('country')?.value || '',
//       propertyType: form.get('propertyType')?.value || '',
//       status: form.get('status')?.value || ''
//     } as SearchFormData;
//   });

//   readonly totalImages = computed(() => this.carouselImages().length);
//   readonly currentImage = computed(() => this.carouselImages()[this.currentSlide()] || null);

//   // effects for side effects
//   private readonly carouselEffect = effect(() => {
//     // Auto-advance carousel every 5 seconds
//     const interval = setInterval(() => {
//       this.nextSlide();
//     }, 5000);

//     // Cleanup function
//     return () => clearInterval(interval);
//   });

//   ngOnInit(): void {
//     this.setupPageMetadata();
//     this.scrollToTop();
//     this.loadCountryCodes();
//   }

//   /**
//    * Setup page metadata for SEO (Angular 20 feature)
//    */
//   private setupPageMetadata(): void {
//     const metadata = this.pageMetadata();
    
//     this.title.setTitle(metadata.title);
//     this.meta.updateTag({ name: 'description', content: metadata.description });
//     this.meta.updateTag({ name: 'keywords', content: metadata.keywords });
//     this.meta.updateTag({ property: 'og:title', content: metadata.title });
//     this.meta.updateTag({ property: 'og:description', content: metadata.description });
//     this.meta.updateTag({ property: 'og:type', content: 'website' });
//     this.meta.updateTag({ name: 'robots', content: 'index, follow' });
//   }

//   /**
//    * Create reactive search form with validation
//    */
//   private createSearchForm(): FormGroup {
//     return this.fb.group({
//       country: [''],
//       propertyType: [''],
//       status: ['']
//     });
//   }

//   /**
//    * Load country codes data
//    */
//   private loadCountryCodes(): void {
//     this.isLoading.set(true);
//     try {
//       const codes = this.userProfileService.getCountryCodes();
//       this.countryCodes.set(codes);
//     } catch (error) {
//       console.error('Error loading country codes:', error);
//     } finally {
//       this.isLoading.set(false);
//     }
//   }

//   /**
//    * Scroll to top of page
//    */
//   private scrollToTop(): void {
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   }

//   /**
//    * Navigate to next carousel slide
//    */
//   nextSlide(): void {
//     const current = this.currentSlide();
//     const total = this.totalImages();
//     this.currentSlide.set((current + 1) % total);
//   }

//   /**
//    * Navigate to previous carousel slide
//    */
//   previousSlide(): void {
//     const current = this.currentSlide();
//     const total = this.totalImages();
//     this.currentSlide.set(current === 0 ? total - 1 : current - 1);
//   }

//   /**
//    * Navigate to specific carousel slide
//    */
//   goToSlide(index: number): void {
//     if (index >= 0 && index < this.totalImages()) {
//       this.currentSlide.set(index);
//     }
//   }

//   // Form getters (type-safe)
//   get country(): FormControl {
//     return this.searchFilterForm().get('country') as FormControl;
//   }

//   get propertyType(): FormControl {
//     return this.searchFilterForm().get('propertyType') as FormControl;
//   }

//   get status(): FormControl {
//     return this.searchFilterForm().get('status') as FormControl;
//   }

//   // Handle form changes with enhanced functionality
//   onChangeCountry(event: Event): void {
//     const target = event.target as HTMLSelectElement;
//     this.country.setValue(target.value);
//     this.trackSearchInteraction('country', target.value);
//   }

//   onChangePropertyType(event: Event): void {
//     const target = event.target as HTMLSelectElement;
//     this.propertyType.setValue(target.value);
//     this.trackSearchInteraction('propertyType', target.value);
//   }

//   onChangeStatus(event: Event): void {
//     const target = event.target as HTMLSelectElement;
//     this.status.setValue(target.value);
//     this.trackSearchInteraction('status', target.value);
//   }

//   /**
//    * Track search interactions for analytics
//    */
//   private trackSearchInteraction(field: string, value: string): void {
//     console.log(`Search filter changed: ${field} = ${value}`);
//     // Could integrate with analytics service here
//   }

//   /**
//    * Submit search form with enhanced navigation
//    */
//   onSubmitSearchData(): void {
//     this.searchSubmitted.set(true);
    
//     if (!this.hasSearchCriteria()) {
//       // Navigate to all properties if no criteria selected
//       this.router.navigate(['all-property']);
//       return;
//     }

//     const formData = this.searchFormData();
//     const queryParams: NavigationExtras = {
//       queryParams: {
//         searchWithCountry: formData.country,
//         type: formData.propertyType,
//         status: formData.status,
//         pageNo: 1,
//         limit: 10,
//       },
//     };

//     console.log('Search submitted with params:', queryParams.queryParams);
//     this.router.navigate(['all-property'], queryParams);
//   }

//   /**
//    * Search by city with enhanced parameters
//    */
//   onSearchByCity(cityValue: string): void {
//     if (!cityValue.trim()) return;

//     const queryParams: NavigationExtras = {
//       queryParams: {
//         city: cityValue.trim(),
//         pageNo: 1,
//         limit: 10,
//       },
//     };
    
//     console.log('City search:', cityValue);
//     this.router.navigate(['all-property'], queryParams);
//   }

//   /**
//    * Search by country with enhanced parameters
//    */
//   onSearchByCountry(countryValue: string): void {
//     if (!countryValue.trim()) return;

//     const queryParams: NavigationExtras = {
//       queryParams: {
//         searchWithCountry: countryValue.trim(),
//         pageNo: 1,
//         limit: 10,
//       },
//     };
    
//     console.log('Country search:', countryValue);
//     this.router.navigate(['all-property'], queryParams);
//   }

//   /**
//    * Clear search form
//    */
//   onClearSearch(): void {
//     this.searchFilterForm().reset();
//     this.searchSubmitted.set(false);
//     console.log('Search form cleared');
//   }

//   /**
//    * Handle carousel image click
//    */
//   onCarouselImageClick(image: CarouselImage): void {
//     console.log('Carousel image clicked:', image.alt);
//     // Could navigate to specific property category or open modal
//   }
// }



// import { Component, OnInit, inject, signal, computed, effect, DestroyRef } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, NavigationExtras } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { Meta, Title } from '@angular/platform-browser';
// import { UserProfilesService } from '../../../services/UserProfile-service/user-profile.service';
// import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service'; // Added

// interface CarouselImage {
//   id: number;
//   url: string;
//   alt: string;
//   title?: string;
//   description?: string;
// }

// interface CountryCode {
//   name: string;
//   code: string;
//   dial_code: string;
// }

// interface SearchFormData {
//   country: string;
//   propertyType: string;
//   status: string;
// }

// interface PropertyType {
//   value: string;
//   label: string;
//   icon?: string;
// }

// interface PropertyStatus {
//   value: string;
//   label: string;
//   color?: string;
// }

// @Component({
//   selector: 'app-home',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './home.html',
//   styleUrls: ['./home.scss'],
// })
// export class Home implements OnInit {
//   // Angular 20 dependency injection using inject()
//   private readonly fb = inject(FormBuilder);
//   private readonly router = inject(Router);
//   private readonly userProfileService = inject(UserProfilesService);
//   private readonly propertyService = inject(ManagePropertyService); // Added
//   private readonly meta = inject(Meta);
//   private readonly title = inject(Title);
//   private readonly destroyRef = inject(DestroyRef);

//   // FIX: Create form instance directly, not as a signal of FormGroup
//   searchFilterForm: FormGroup;

//   // Angular 20 signals for reactive state management
//   readonly countryCodes = signal<CountryCode[]>([]);
//   readonly isLoading = signal<boolean>(false);
//   readonly currentSlide = signal<number>(0);
//   readonly searchSubmitted = signal<boolean>(false);

//   readonly carouselImages = signal<CarouselImage[]>([
//     {
//       id: 1,
//       url: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
//       alt: 'Modern Apartments',
//     },
//     {
//       id: 2,
//       url: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90',
//       alt: 'Luxury Villas',
//     },
//     {
//       id: 3,
//       url: 'https://img.freepik.com/premium-photo/modern-luxury-home-with-blue-siding_332679-26506.jpg',
//       alt: 'Commercial Spaces',
//     },
//   ]);

//   readonly propertyTypes = signal<PropertyType[]>([
//     { value: 'Plots', label: 'Plots' },
//     { value: 'Apartments', label: 'Apartments' },
//     { value: 'Commercial', label: 'Commercial' },
//     { value: 'Villas', label: 'Villas' },
//     { value: 'Row house', label: 'Row House' },
//     { value: 'Agricultural land', label: 'Agricultural Land' },
//     { value: 'Farmhouses', label: 'Farmhouses' },
//     { value: 'Vacation homes', label: 'Vacation Homes' },
//     { value: 'Residential complex', label: 'Residential Complex' },
//     { value: 'Individual house', label: 'Individual House' },
//     { value: 'Shop', label: 'Shop' }
//   ]);

//   readonly propertyStatuses = signal<PropertyStatus[]>([
//     { value: 'Sell', label: 'For Sale' },
//     { value: 'Rent', label: 'For Rent' }
//   ]);

//   // Computed signals for enhanced functionality
//   readonly pageMetadata = computed(() => ({
//     title: 'JMR Real Estate - Find Your Dream Property',
//     description: 'Discover premium properties including apartments, villas, commercial spaces, and plots. Find your perfect home or investment opportunity with JMR Real Estate.',
//     keywords: 'real estate, properties, apartments, villas, commercial, plots, buy, rent, JMR Real Estate'
//   }));

//   // FIX: Access form directly, not through signal
//   readonly isFormValid = computed(() => this.searchFilterForm.valid);
//   readonly hasSearchCriteria = computed(() => {
//     const form = this.searchFilterForm;
//     return !!(form.get('country')?.value || form.get('propertyType')?.value || form.get('status')?.value);
//   });

//   readonly searchFormData = computed(() => {
//     const form = this.searchFilterForm;
//     return {
//       country: form.get('country')?.value || '',
//       propertyType: form.get('propertyType')?.value || '',
//       status: form.get('status')?.value || ''
//     } as SearchFormData;
//   });

//   readonly totalImages = computed(() => this.carouselImages().length);
//   readonly currentImage = computed(() => this.carouselImages()[this.currentSlide()] || null);

//   // FIX: Proper carousel effect with cleanup
//   private carouselInterval: any;

//   constructor() {
//     // Initialize form directly
//     this.searchFilterForm = this.createSearchForm();
//   }

//   ngOnInit(): void {
//     this.setupPageMetadata();
//     this.scrollToTop();
//     this.loadCountryCodes();
//     this.startCarousel();
//   }

//   ngOnDestroy(): void {
//     this.stopCarousel();
//   }

//   /**
//    * Setup page metadata for SEO
//    */
//   private setupPageMetadata(): void {
//     const metadata = this.pageMetadata();
    
//     this.title.setTitle(metadata.title);
//     this.meta.updateTag({ name: 'description', content: metadata.description });
//     this.meta.updateTag({ name: 'keywords', content: metadata.keywords });
//   }

//   /**
//    * Create reactive search form with validation
//    */
//   private createSearchForm(): FormGroup {
//     return this.fb.group({
//       country: [''],
//       propertyType: [''],
//       status: ['']
//     });
//   }

//   /**
//    * Load country codes data - FIXED: Use correct service
//    */
//   private loadCountryCodes(): void {
//     this.isLoading.set(true);
//     try {
//       // FIX: Use propertyService instead of userProfileService
//       const codes = this.propertyService.getCountryCodes();
//       this.countryCodes.set(codes);
//     } catch (error) {
//       console.error('Error loading country codes:', error);
//     } finally {
//       this.isLoading.set(false);
//     }
//   }

//   /**
//    * Scroll to top of page
//    */
//   private scrollToTop(): void {
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   }

//   /**
//    * Start carousel
//    */
//   private startCarousel(): void {
//     this.carouselInterval = setInterval(() => {
//       this.nextSlide();
//     }, 5000);
//   }

//   /**
//    * Stop carousel
//    */
//   private stopCarousel(): void {
//     if (this.carouselInterval) {
//       clearInterval(this.carouselInterval);
//     }
//   }

//   /**
//    * Navigate to next carousel slide
//    */
//   nextSlide(): void {
//     const current = this.currentSlide();
//     const total = this.totalImages();
//     this.currentSlide.set((current + 1) % total);
//   }

//   /**
//    * Navigate to previous carousel slide
//    */
//   previousSlide(): void {
//     const current = this.currentSlide();
//     const total = this.totalImages();
//     this.currentSlide.set(current === 0 ? total - 1 : current - 1);
//   }

//   /**
//    * Navigate to specific carousel slide
//    */
//   goToSlide(index: number): void {
//     if (index >= 0 && index < this.totalImages()) {
//       this.currentSlide.set(index);
//     }
//   }

//   // Form getters (type-safe) - FIXED: Access form directly
//   get country(): FormControl {
//     return this.searchFilterForm.get('country') as FormControl;
//   }

//   get propertyType(): FormControl {
//     return this.searchFilterForm.get('propertyType') as FormControl;
//   }

//   get status(): FormControl {
//     return this.searchFilterForm.get('status') as FormControl;
//   }

//   // Handle form changes with enhanced functionality
//   onChangeCountry(event: Event): void {
//     const target = event.target as HTMLSelectElement;
//     this.country.setValue(target.value);
//     this.trackSearchInteraction('country', target.value);
//   }

//   onChangePropertyType(event: Event): void {
//     const target = event.target as HTMLSelectElement;
//     this.propertyType.setValue(target.value);
//     this.trackSearchInteraction('propertyType', target.value);
//   }

//   onChangeStatus(event: Event): void {
//     const target = event.target as HTMLSelectElement;
//     this.status.setValue(target.value);
//     this.trackSearchInteraction('status', target.value);
//   }

//   /**
//    * Track search interactions for analytics
//    */
//   private trackSearchInteraction(field: string, value: string): void {
//     console.log(`Search filter changed: ${field} = ${value}`);
//   }

//   /**
//    * Submit search form with enhanced navigation - FIXED
//    */
//   onSubmitSearchData(): void {
//     this.searchSubmitted.set(true);
    
//     console.log('Form submitted:', this.searchFilterForm.value);
//     console.log('Form valid:', this.searchFilterForm.valid);

//     // Get form values directly
//     const formData = this.searchFilterForm.value;
    
//     // Build query parameters
//     const queryParams: NavigationExtras = {
//       queryParams: {
//         searchWithCountry: formData.country || '',
//         type: formData.propertyType || '',
//         status: formData.status || '',
//         pageNo: 1,
//         limit: 10,
//       },
//     };

//     console.log('Navigating with params:', queryParams.queryParams);
    
//     // FIX: Use correct route path - adjust based on your routing
//     this.router.navigate(['/properties/browse'], queryParams).then(success => {
//       if (success) {
//         console.log('Navigation successful');
//       } else {
//         console.error('Navigation failed');
//       }
//     }).catch(error => {
//       console.error('Navigation error:', error);
//     });
//   }

//   /**
//    * Search by city with enhanced parameters
//    */
//   onSearchByCity(cityValue: string): void {
//     if (!cityValue.trim()) return;

//     const queryParams: NavigationExtras = {
//       queryParams: {
//         city: cityValue.trim(),
//         pageNo: 1,
//         limit: 10,
//       },
//     };
    
//     console.log('City search:', cityValue);
//     this.router.navigate(['/properties/browse'], queryParams);
//   }

//   /**
//    * Search by country with enhanced parameters
//    */
//   onSearchByCountry(countryValue: string): void {
//     if (!countryValue.trim()) return;

//     const queryParams: NavigationExtras = {
//       queryParams: {
//         searchWithCountry: countryValue.trim(),
//         pageNo: 1,
//         limit: 10,
//       },
//     };
    
//     console.log('Country search:', countryValue);
//     this.router.navigate(['/properties/browse'], queryParams);
//   }

//   /**
//    * Clear search form
//    */
//   onClearSearch(): void {
//     this.searchFilterForm.reset();
//     this.searchSubmitted.set(false);
//     console.log('Search form cleared');
//   }

//   /**
//    * Handle carousel image click
//    */
//   onCarouselImageClick(image: CarouselImage): void {
//     console.log('Carousel image clicked:', image.alt);
//   }
// }


import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, NavigationExtras } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';

// Interfaces
interface CarouselImage {
  id: number;
  url: string;
  alt: string;
  title?: string;
  description?: string;
}

interface CountryCode {
  name: string;
  code: string;
  dial_code: string;
}

interface SearchFormData {
  country: string;
  propertyType: string;
  status: string;
}

interface PropertyType {
  value: string;
  label: string;
  icon?: string;
}

interface PropertyStatus {
  value: string;
  label: string;
  color?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  // Angular 20 dependency injection
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly propertyService = inject(ManagePropertyService);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  // Form instance
  searchFilterForm!: FormGroup;

  // Signals for reactive state
  readonly countryCodes = signal<CountryCode[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly currentSlide = signal<number>(0);
  readonly searchSubmitted = signal<boolean>(false);

  readonly carouselImages = signal<CarouselImage[]>([
    {
      id: 1,
      url: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
      alt: 'Modern Apartments',
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90',
      alt: 'Luxury Villas',
    },
    {
      id: 3,
      url: 'https://img.freepik.com/premium-photo/modern-luxury-home-with-blue-siding_332679-26506.jpg',
      alt: 'Commercial Spaces',
    },
  ]);

  readonly propertyTypes = signal<PropertyType[]>([
    { value: 'Plots', label: 'Plots', icon: 'fa-map' },
    { value: 'Apartments', label: 'Apartments', icon: 'fa-building' },
    { value: 'Commercial', label: 'Commercial', icon: 'fa-briefcase' },
    { value: 'Villas', label: 'Villas', icon: 'fa-home' },
    { value: 'Row house', label: 'Row House', icon: 'fa-home' },
    { value: 'Agricultural land', label: 'Agricultural Land', icon: 'fa-leaf' },
    { value: 'Farmhouses', label: 'Farmhouses', icon: 'fa-tree' },
    { value: 'Vacation homes', label: 'Vacation Homes', icon: 'fa-umbrella-beach' },
    { value: 'Residential complex', label: 'Residential Complex', icon: 'fa-city' },
    { value: 'Individual house', label: 'Individual House', icon: 'fa-house-user' },
    { value: 'Shop', label: 'Shop', icon: 'fa-store' }
  ]);

  readonly propertyStatuses = signal<PropertyStatus[]>([
    { value: 'Sell', label: 'For Sale', color: 'success' },
    { value: 'Rent', label: 'For Rent', color: 'primary' }
  ]);

  // Computed signals
  readonly pageMetadata = computed(() => ({
    title: 'JMR Real Estate - Find Your Dream Property',
    description: 'Discover premium properties including apartments, villas, commercial spaces, and plots. Find your perfect home or investment opportunity with JMR Real Estate.',
    keywords: 'real estate, properties, apartments, villas, commercial, plots, buy, rent, JMR Real Estate'
  }));

  readonly isFormValid = computed(() => this.searchFilterForm.valid);
  readonly hasSearchCriteria = computed(() => {
    const form = this.searchFilterForm;
    return !!(form.get('country')?.value || form.get('propertyType')?.value || form.get('status')?.value);
  });

  readonly searchFormData = computed(() => {
    const form = this.searchFilterForm;
    return {
      country: form.get('country')?.value || '',
      propertyType: form.get('propertyType')?.value || '',
      status: form.get('status')?.value || ''
    } as SearchFormData;
  });

  readonly totalImages = computed(() => this.carouselImages().length);
  readonly currentImage = computed(() => this.carouselImages()[this.currentSlide()] || null);

  // Carousel interval
  private carouselInterval: any;

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupPageMetadata();
    this.scrollToTop();
    this.loadCountryCodes();
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  /**
   * Initialize search form
   */
  private initializeForm(): void {
    this.searchFilterForm = this.fb.group({
      country: new FormControl(''),
      propertyType: new FormControl(''),
      status: new FormControl(''),
    });
  }

  /**
   * Load country codes from service
   */
  private loadCountryCodes(): void {
    this.isLoading.set(true);
    try {
      const codes = this.propertyService.getCountryCodes();
      this.countryCodes.set(codes);
    } catch (error) {
      console.error('Error loading country codes:', error);
      this.countryCodes.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Setup page metadata for SEO
   */
  private setupPageMetadata(): void {
    const metadata = this.pageMetadata();
    
    this.title.setTitle(metadata.title);
    this.meta.updateTag({ name: 'description', content: metadata.description });
    this.meta.updateTag({ name: 'keywords', content: metadata.keywords });
  }

  /**
   * Scroll to top of page
   */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Start carousel auto-rotation
   */
  private startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  /**
   * Stop carousel auto-rotation
   */
  private stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  /**
   * Navigate to next carousel slide
   */
  nextSlide(): void {
    const current = this.currentSlide();
    const total = this.totalImages();
    this.currentSlide.set((current + 1) % total);
  }

  /**
   * Navigate to previous carousel slide
   */
  previousSlide(): void {
    const current = this.currentSlide();
    const total = this.totalImages();
    this.currentSlide.set(current === 0 ? total - 1 : current - 1);
  }

  /**
   * Navigate to specific carousel slide
   */
  goToSlide(index: number): void {
    if (index >= 0 && index < this.totalImages()) {
      this.currentSlide.set(index);
    }
  }

  // Form control getters
  get f(): { [key: string]: FormControl } {
    return this.searchFilterForm.controls as { [key: string]: FormControl };
  }

  get Country(): FormControl {
    return this.searchFilterForm.get('country') as FormControl;
  }

  get PropertyType(): FormControl {
    return this.searchFilterForm.get('propertyType') as FormControl;
  }

  get Status(): FormControl {
    return this.searchFilterForm.get('status') as FormControl;
  }

  // ⭐⭐⭐ ADDED: Event handlers for dropdown changes ⭐⭐⭐
  onChangeCountry(event: any): void {
    const target = event.target as HTMLSelectElement;
    this.Country.setValue(target.value);
    this.trackSearchInteraction('country', target.value);
  }

  onChangePropertyType(event: any): void {
    const target = event.target as HTMLSelectElement;
    this.PropertyType.setValue(target.value);
    this.trackSearchInteraction('propertyType', target.value);
  }

  onChangeStatus(event: any): void {
    const target = event.target as HTMLSelectElement;
    this.Status.setValue(target.value);
    this.trackSearchInteraction('status', target.value);
  }

  /**
   * Track search interactions for debugging
   */
  private trackSearchInteraction(field: string, value: string): void {
    console.log(`Search filter changed: ${field} = ${value}`);
  }

  /**
   * Submit search form
   */
  onSubmitSearchData(): void {
    this.searchSubmitted.set(true);
    
    console.log('Form submitted:', this.searchFilterForm.value);
    console.log('Form valid:', this.searchFilterForm.valid);

    // Get form values
    const queryParams: NavigationExtras = {
      queryParams: {
        searchWithCountry: this.Country.value || '',
        type: this.PropertyType.value || '',
        status: this.Status.value || '',
        pageNo: 1,
        limit: 10,
      },
    };

    console.log('Navigating with params:', queryParams.queryParams);
    
    this.router.navigate(['/properties/browse'], queryParams).then(success => {
      if (success) {
        console.log('Navigation successful');
      } else {
        console.error('Navigation failed');
      }
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }

  /**
   * Search by city
   */
  onSearchByCity(cityValue: string): void {
    if (!cityValue.trim()) return;

    const queryParams: NavigationExtras = {
      queryParams: {
        city: cityValue.trim(),
        pageNo: 1,
        limit: 10,
      },
    };
    
    console.log('City search:', cityValue);
    this.router.navigate(['/properties/browse'], queryParams);
  }

  /**
   * Search by country
   */
  onSearchByCountry(countryValue: string): void {
    if (!countryValue.trim()) return;

    const queryParams: NavigationExtras = {
      queryParams: {
        searchWithCountry: countryValue.trim(),
        pageNo: 1,
        limit: 10,
      },
    };
    
    console.log('Country search:', countryValue);
    this.router.navigate(['/properties/browse'], queryParams);
  }

  /**
   * Clear search form
   */
  onClearSearch(): void {
    this.searchFilterForm.reset();
    this.searchSubmitted.set(false);
    console.log('Search form cleared');
  }

  /**
   * Handle carousel image click
   */
  onCarouselImageClick(image: CarouselImage): void {
    console.log('Carousel image clicked:', image.alt);
  }

  /**
   * Debug method to check form values
   */
  debugFormValues(): void {
    console.log('Current form values:', {
      country: this.Country.value,
      propertyType: this.PropertyType.value,
      status: this.Status.value,
      formValid: this.searchFilterForm.valid,
      formValues: this.searchFilterForm.value
    });
  }
}