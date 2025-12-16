import {
  AfterViewInit,
  Component,
  HostListener,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  effect,
  DestroyRef,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Meta, Title } from '@angular/platform-browser';
import { RoutePath } from '../../../core/constant/api.constant';
import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
import { SessionService } from '../../../services/Session-service/session.service';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { UserProfilesService } from '../../../services/UserProfile-service/user-profile.service';
import { CurrencyStringPipe } from '../../../shared/pipes/currencyStringConvertor.pipe';
import { CommonModule } from '@angular/common';
import { IndianNumberPipe } from '../../../shared/pipes/indianNumber.pipe';
import { NotifierService } from '../../../services/Notifier-service/notifier.service';

interface Property {
  id: string;
  title: string;
  status: 'Sell' | 'Rent';
  propertyOwnerShip: string;
  featuredImage?: string;
  bedRooms?: number;
  type?: string;
  price?: number;
  currency?: string;
  valueUnit?: string;
  area?: number;
  size?: string;
  listPropertyAs?: string;
  addressInfo?: {
    city?: string;
    state?: string;
    country?: string;
  };
  availability?: {
    readyToMove?: boolean;
    availableDate?: string;
  };
  bedroomInfo?: any[];
  isFavorite?: boolean;
}

interface Banner {
  id: number;
  imgUrl: string;
  title: string;
  description: string;
  state: string;
}

interface SearchFilter {
  searchWithCountry: string;
  type: string[];
  sortFilter: string;
  status: string;
  pageNo: number;
  limit: number;
}

interface CarouselState {
  featuredCurrentSlide: number;
  latestCurrentSlide: number;
  isDragging: boolean;
  startX: number;
  scrollLeft: number;
}

@Component({
  selector: 'app-properties',
  templateUrl: './properties.html',
  styleUrls: ['./properties.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgxSpinnerModule,
    CurrencyStringPipe,
    IndianNumberPipe,
  ],
})
export class Properties implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('carouselWrapper') carouselWrapper!: ElementRef;
  @ViewChild('carouselWrapper2') carouselWrapper2!: ElementRef;

  // Angular 20 dependency injection using inject()
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly notifier = inject(NotifierService);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly swalToast = inject(ToastService);
  private readonly session = inject(SessionService);
  private readonly service = inject(ManagePropertyService);
  private readonly route = inject(ActivatedRoute);
  private readonly profile = inject(UserProfilesService);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  // Destroy subject for manual subscription cleanup
  private readonly destroy$ = new Subject<void>();

  // Angular 20 signals for reactive state management
  readonly isLoading = signal<boolean>(false);
  readonly isInitialized = signal<boolean>(false);
  readonly userProfileData = signal<any>(null);

  readonly jmrPropertyList = signal<Property[]>([]);
  readonly propertyList = signal<Property[]>([]);
  readonly countryCodes = signal<any[]>([]);
  readonly currencyDetails = signal<any[]>([]);

  readonly bannerList = signal<Banner[]>([
    {
      id: 1,
      imgUrl: 'assets/images/slider/slide-bg/house3.jpg',
      title: 'Kanyakumari Properties',
      description: 'Kanyakumari',
      state: 'Tamilnadu',
    },
    {
      id: 2,
      imgUrl: 'assets/images/slider/slide-bg/house1.jpg',
      title: 'Chennai Properties',
      description: 'Chennai',
      state: 'Tamilnadu',
    },
    {
      id: 3,
      imgUrl: 'assets/images/slider/slide-bg/house2.jpg',
      title: 'Chennai Properties',
      description: 'Chennai',
      state: 'Tamilnadu',
    },
  ]);

  readonly searchFilterForm = signal<FormGroup>(this.createSearchForm());
  readonly carouselState = signal<CarouselState>({
    featuredCurrentSlide: 0,
    latestCurrentSlide: 0,
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });

  readonly searchFilter = signal<SearchFilter>({
    searchWithCountry: '',
    type: [],
    sortFilter: '',
    status: '',
    pageNo: 1,
    limit: 100,
  });

  readonly paginationData = signal({
    totalItems: 0,
    totalPages: 0,
    page: undefined as number | undefined,
    tableSize: 7,
    count: 0,
  });

  // Computed signals for enhanced functionality
  readonly pageMetadata = computed(() => ({
    title: 'Properties - JMR Real Estate | Premium Properties for Sale & Rent',
    description: 'Browse our extensive collection of premium properties including apartments, villas, commercial spaces, and plots. Find your perfect property with JMR Real Estate.',
    keywords: 'properties, real estate, apartments, villas, commercial, plots, buy, rent, featured properties, latest properties'
  }));

  readonly isUserLoggedIn = computed(() => 
    !!this.session.getToken()
  );

  readonly hasFeaturedProperties = computed(() => this.jmrPropertyList().length > 0);
  readonly hasLatestProperties = computed(() => this.propertyList().length > 0);
  readonly totalFeaturedProperties = computed(() => this.jmrPropertyList().length);
  readonly totalLatestProperties = computed(() => this.propertyList().length);

  readonly canScrollFeatured = computed(() => this.totalFeaturedProperties() >= 3);
  readonly canScrollLatest = computed(() => this.totalLatestProperties() >= 3);

  readonly isFormValid = computed(() => this.searchFilterForm().valid);
  readonly hasSearchCriteria = computed(() => {
    const form = this.searchFilterForm();
    return !!(form.get('country')?.value || form.get('propertyType')?.value || form.get('status')?.value);
  });

  // Constants
  readonly routePath = RoutePath;

  // Angular 20 effects for side effects
  private readonly userProfileEffect = effect(() => {
    if (this.isUserLoggedIn()) {
      // Add a small delay to ensure token is properly stored
      setTimeout(() => {
        const token = localStorage.getItem('AccessToken');
        if (token) {
          console.log('🎯 Properties: Token confirmed, loading profile...');
          this.loadUserProfile();
        } else {
          console.warn('⚠️ Properties: User appears logged in but no token found, retrying...');
          // Retry after a longer delay
          setTimeout(() => {
            const retryToken = localStorage.getItem('AccessToken');
            if (retryToken) {
              console.log('🔄 Properties: Token found on retry, loading profile...');
              this.loadUserProfile();
            } else {
              console.error('❌ Properties: Still no token found after retry');
            }
          }, 1000);
        }
      }, 100);
    }
  });

  private readonly notifierEffect = effect(() => {
    this.setupNotifierSubscription();
  }, { allowSignalWrites: true });

  @HostListener('window:beforeunload')
  onWindowScroll() {
    this.scrollToTop();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateCarouselIndicators();
  }

  ngOnInit(): void {
    console.log('🏠 Properties Component Initializing...');
    console.log('🌐 Production API URL:', this.service.baseApiUrl);
    console.log('🔍 Full API Endpoint:', `${this.service.baseApiUrl}public/browse/property/open/search`);
    this.setupPageMetadata();
    this.initializeData();
    this.scrollToTop();
    
    // Start loading properties immediately
    this.loadInitialProperties();
  }



  ngAfterViewInit(): void {
    // Initialize carousel after view is ready
    setTimeout(() => {
      this.setupCarousel();
      this.updateCarouselIndicators();
    }, 100);
  }

  /**
   * Load initial properties with fallback to random properties
   */
  loadInitialProperties(): void {
    console.log('Loading initial properties from API...');
    
    // First try to load with current filter
    this.getPropertyDetails();
    
    // If 
    // re loaded after 3 seconds, try loading random properties
    setTimeout(() => {
      if (this.propertyList().length === 0 && !this.isLoading()) {
        console.log('No properties found with filter, trying random properties...');
        this.loadRandomProperties();
      }
    }, 3000);
  }

  /**
   * Load random properties from Production API as fallback
   */
  private loadRandomProperties(): void {
    console.log('🎲 Loading Random Properties from Production API...');
    this.isLoading.set(true);
    this.spinner.show();
    
    console.log('🔗 Production Random API URL:', `${this.service.baseApiUrl}public/browse/property/random`);
    
    this.service.getRandomPropertyData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.log('🎲 Random properties from production API response:', res);
          
          // Check different possible response structures for random properties from production
          let propertyData = [];
          
          if (res && res.data && Array.isArray(res.data)) {
            propertyData = res.data;
            console.log('✅ Found random properties in res.data from production API');
          } else if (res && Array.isArray(res)) {
            propertyData = res;
            console.log('✅ Random properties response is direct array from production API');
          } else if (res && res.properties && Array.isArray(res.properties)) {
            propertyData = res.properties;
            console.log('✅ Found random properties in res.properties from production API');
          } else if (res && res.result && Array.isArray(res.result)) {
            propertyData = res.result;
            console.log('✅ Found random properties in res.result from production API');
          } else if (res && res.recordInfo && Array.isArray(res.recordInfo)) {
            propertyData = res.recordInfo;
            console.log('✅ Found random properties in res.recordInfo from production API');
          }
          
          if (propertyData.length > 0) {
            console.log('🏠 Sample random property from production API:', propertyData[0]);
            
            // Validate property data
            const validProperties = propertyData.filter((item: any) => this.validatePropertyData(item));
            console.log(`✅ Valid random properties from production API: ${validProperties.length}/${propertyData.length}`);
            
            // Filter JMR owned properties for featured section
            const jmrProperties: Property[] = validProperties.filter(
              (item: any) => item.propertyOwnerShip === 'Jmr Owned Property'
            ) || [];
            
            this.jmrPropertyList.set(jmrProperties);
            this.propertyList.set(validProperties);
            
            console.log(`🎉 Loaded ${validProperties.length} random properties from production API (${jmrProperties.length} featured)`);
            
            // Update pagination data
            this.paginationData.set({
              totalItems: validProperties.length,
              count: validProperties.length,
              tableSize: validProperties.length,
              totalPages: 1,
              page: 1
            });

            setTimeout(() => {
              this.updateCarouselIndicators();
            }, 200);
            
            this.isLoading.set(false);
            this.spinner.hide();
            this.swalToast.showToast(`🎲 Loaded ${validProperties.length} random properties from production API!`, 'success');
          } else {
            console.warn('📭 No random properties available from production API');
            this.isLoading.set(false);
            this.spinner.hide();
            // this.swalToast.showToast('No properties available from production API.', 'warning');
            // Create some mock data for testing
            // this.createMockPropertyData();
          }
        },
        error: (err) => {
          console.error('❌ Error loading random properties from production API:', err);
          this.isLoading.set(false);
          this.spinner.hide();
          // this.swalToast.showToast('Failed to load properties. Please try again later.', 'error');
          // Create mock data as last resort
          // this.createMockPropertyData();
        }
      });
  }

  /**
   * Create mock property data for testing when API fails
   */
  // private createMockPropertyData(): void {
  //   console.log('Creating mock property data for testing...');
    
  //   const mockProperties: Property[] = [
  //     {
  //       id: 'mock-1',
  //       title: 'Luxury Villa in Chennai',
  //       status: 'Sell',
  //       propertyOwnerShip: 'Jmr Owned Property',
  //       featuredImage: 'assets/images/properties/sample1.jpg',
  //       bedRooms: 3,
  //       type: 'Villa',
  //       price: 5000000,
  //       currency: 'INR',
  //       area: 2500,
  //       size: 'sq ft',
  //       listPropertyAs: 'Owner',
  //       addressInfo: {
  //         city: 'Chennai',
  //         state: 'Tamil Nadu',
  //         country: 'India'
  //       },
  //       availability: {
  //         readyToMove: true
  //       }
  //     },
  //     {
  //       id: 'mock-2',
  //       title: 'Modern Apartment in Bangalore',
  //       status: 'Rent',
  //       propertyOwnerShip: 'Individual',
  //       featuredImage: 'assets/images/properties/sample2.jpg',
  //       bedRooms: 2,
  //       type: 'Apartment',
  //       price: 25000,
  //       currency: 'INR',
  //       valueUnit: 'month',
  //       area: 1200,
  //       size: 'sq ft',
  //       listPropertyAs: 'Agent',
  //       addressInfo: {
  //         city: 'Bangalore',
  //         state: 'Karnataka',
  //         country: 'India'
  //       },
  //       availability: {
  //         readyToMove: false,
  //         availableDate: '2024-02-01'
  //       }
  //     }
  //   ];

  //   const jmrProperties = mockProperties.filter(item => item.propertyOwnerShip === 'Jmr Owned Property');
    
  //   this.jmrPropertyList.set(jmrProperties);
  //   this.propertyList.set(mockProperties);
    
  //   this.paginationData.set({
  //     totalItems: mockProperties.length,
  //     count: mockProperties.length,
  //     tableSize: mockProperties.length,
  //     totalPages: 1,
  //     page: 1
  //   });

  //   this.isLoading.set(false);
  //   this.spinner.hide();
    
  //   console.log('✅ Mock data created successfully');
  //   this.swalToast.showToast('Loaded sample property data for testing', 'info');
  // }

  /**
   * Setup page metadata for SEO (Angular 20 feature)
   */
  private setupPageMetadata(): void {
    const metadata = this.pageMetadata();
    
    this.title.setTitle(metadata.title);
    this.meta.updateTag({ name: 'description', content: metadata.description });
    this.meta.updateTag({ name: 'keywords', content: metadata.keywords });
    this.meta.updateTag({ property: 'og:title', content: metadata.title });
    this.meta.updateTag({ property: 'og:description', content: metadata.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
  }

  /**
   * Initialize component data
   */
  private initializeData(): void {
    console.log('Initializing properties component data...');
    
    // Load static data
    this.currencyDetails.set(this.service.getCurrencyData());
    this.countryCodes.set(this.service.getCountryCodes());
    
    console.log('Loaded currency details:', this.currencyDetails().length);
    console.log('Loaded country codes:', this.countryCodes().length);
    
    // Set default search filter for API
    this.searchFilter.set({
      searchWithCountry: '',
      type: [],
      sortFilter: '',
      status: '',
      pageNo: 1,
      limit: 100,
    });
    
    this.isInitialized.set(true);
    console.log('Properties component initialization complete');
  }

  /**
   * Check API connectivity
   */
  private checkApiConnectivity(): void {
    console.log('Checking API connectivity...');
    console.log('Base API URL:', this.service.baseApiUrl);
    
    // You could add a simple ping endpoint check here if available
    // For now, we'll rely on the property loading to test connectivity
  }

  /**
   * Create reactive search form with validation
   */
  private createSearchForm(): FormGroup {
    return this.fb.group({
      country: [''],
      propertyType: [''],
      status: ['']
    });
  }

  /**
   * Load user profile data
   */
  private loadUserProfile(): void {
    console.log('🔄 Properties: Starting to load user profile...');
    console.log('🔑 Properties: Current token in localStorage:', localStorage.getItem('AccessToken') ? 'EXISTS' : 'NOT FOUND');
    
    this.isLoading.set(true);
    this.spinner.show();
    
    this.profile.loadUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          console.log('✅ Properties: Profile loaded successfully:', res);
          const userProfiles = res.recordInfo;
          this.userProfileData.set(userProfiles);
          this.notifier.notifyUserData(userProfiles);
          this.isLoading.set(false);
          this.spinner.hide();
        },
        error: (err: any) => {
          console.error('❌ Properties: Profile loading failed:', err);
          console.error('❌ Properties: Error details:', err.message);
          // this.swalToast.showToast(err, 'error');
          this.isLoading.set(false);
          this.spinner.hide();
        },
      });
  }

  /**
   * Setup notifier subscription
   */
  private setupNotifierSubscription(): void {
    this.notifier.userProfileData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.userProfileData.set(res);
      });
  }

  // Form getters (type-safe)
  get f(): { [key: string]: AbstractControl } {
    return this.searchFilterForm().controls;
  }

  public get PropertyType(): FormControl {
    return this.searchFilterForm().get('propertyType') as FormControl;
  }

  public get Country(): FormControl {
    return this.searchFilterForm().get('country') as FormControl;
  }

  public get Status(): FormControl {
    return this.searchFilterForm().get('status') as FormControl;
  }

  /**
   * Navigate to property detail view
   */
  gotoViewDetail(item: Property): void {
    if (!item?.id) return;
    
    console.log('Navigating to property detail:', item.id);
    this.router.navigateByUrl(this.routePath.PUBLISHED_PROPERTY_VIEW_URL + item.id);
  }

  /**
   * Debug methods for API testing
   */
  getApiEnvironment(): string {
    return 'Production Database';
  }

  getApiUrl(): string {
    return this.service.baseApiUrl || 'Not configured';
  }

  getTotalPropertiesCount(): number {
    return this.propertyList().length;
  }

  getFeaturedPropertiesCount(): number {
    return this.jmrPropertyList().length;
  }

  testApiConnection(): void {
    console.log('🔗 Testing Production API Connection...');
    console.log('API Base URL:', this.service.baseApiUrl);
    
    const testEndpoint = `${this.service.baseApiUrl}public/browse/property/open/search`;
    console.log('Test Endpoint:', testEndpoint);
    
    this.swalToast.showToast('Testing production API connection... Check console for details', 'info');
    
    // Test with minimal filter
    const testFilter = {
      searchWithCountry: '',
      type: [],
      sortFilter: '',
      status: '',
      pageNo: 1,
      limit: 5,
    };
    
    this.service.getPropertyDetailsByFilter(testFilter).subscribe({
      next: (response) => {
        console.log('✅ API Connection Test - SUCCESS');
        console.log('Response:', response);
        console.log('Response Type:', typeof response);
        console.log('Response Keys:', response ? Object.keys(response) : 'No keys');
        
        let propertyCount = 0;
        if (response?.data && Array.isArray(response.data)) {
          propertyCount = response.data.length;
        } else if (response && Array.isArray(response)) {
          propertyCount = response.length;
        } else if (response?.recordInfo && Array.isArray(response.recordInfo)) {
          propertyCount = response.recordInfo.length;
        }
        
        // this.swalToast.showToast(
        //   `✅ API Connected! Found ${propertyCount} properties in production database`, 
        //   'success'
        // );
      },
      error: (error) => {
        console.error('❌ API Connection Test - FAILED');
        console.error('Error:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        
        let errorMsg = 'API connection failed';
        if (error.status === 0) {
          errorMsg = 'Cannot reach production API server';
        } else if (error.status === 404) {
          errorMsg = 'API endpoint not found';
        } else if (error.status === 500) {
          errorMsg = 'Production API server error';
        }
        
        // this.swalToast.showToast(`❌ ${errorMsg}`, 'error');
      }
    });
  }

  logApiDebugInfo(): void {
    console.log('📊 === DEVELOPMENT API DEBUG INFO ===');
    console.log('Environment:', this.getApiEnvironment());
    console.log('API Base URL:', this.getApiUrl());
    console.log('Current Properties Count:', this.getTotalPropertiesCount());
    console.log('Featured Properties Count:', this.getFeaturedPropertiesCount());
    console.log('Is Loading:', this.isLoading());
    console.log('Current Property List:', this.propertyList());
    console.log('Current JMR Property List:', this.jmrPropertyList());
    console.log('Pagination Data:', this.paginationData());
    console.log('=================================');
    
    this.swalToast.showToast('Debug info logged to console', 'info');
  }

  /**
   * Load property details from Production API
   */
  getPropertyDetails(): void {
    console.log('🔄 Fetching Properties from Production API...');
    this.isLoading.set(true);
    this.spinner.show();
    
    const filter = this.searchFilter();
    console.log('🌐 Production API Base URL:', this.service.baseApiUrl);
    console.log('📡 API Endpoint:', 'public/browse/property/open/search');
    console.log('🔗 Full Production API URL:', `${this.service.baseApiUrl}public/browse/property/open/search`);
    console.log('🔍 Request Filter:', filter);
    
    this.service.getPropertyDetailsByFilter(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.log('📥 Production API Response Received');
          console.log('📊 Raw Production API Response:', res);
          console.log('🔍 Response Type:', typeof res);
          console.log('🗂️ Response Keys:', res ? Object.keys(res) : 'No keys');
          
          // Check different possible response structures from production API
          let propertyData = [];
          
          if (res && res.data && Array.isArray(res.data)) {
            propertyData = res.data;
            console.log('✅ Found property data in res.data from production API');
          } else if (res && Array.isArray(res)) {
            propertyData = res;
            console.log('✅ Response is direct array from production API');
          } else if (res && res.properties && Array.isArray(res.properties)) {
            propertyData = res.properties;
            console.log('✅ Found property data in res.properties from production API');
          } else if (res && res.result && Array.isArray(res.result)) {
            propertyData = res.result;
            console.log('✅ Found property data in res.result from production API');
          } else if (res && res.recordInfo && Array.isArray(res.recordInfo)) {
            propertyData = res.recordInfo;
            console.log('✅ Found property data in res.recordInfo from production API');
          } else {
            console.warn('⚠️ No valid property data found in production API response structure:', res);
            console.log('🔄 Trying random properties from production API...');
            this.loadRandomProperties();
            return;
          }

          console.log(`📈 Found ${propertyData.length} properties in production API response`);
          
          if (propertyData.length > 0) {
            console.log('🏠 Sample property from production API:', propertyData[0]);
            
            // Validate property data
            const validProperties = propertyData.filter((item: any) => this.validatePropertyData(item));
            console.log(`✅ Valid properties from production API: ${validProperties.length}/${propertyData.length}`);

            // Filter JMR owned properties for featured section
            const jmrProperties: Property[] = validProperties.filter(
              (item: any) => item.propertyOwnerShip === 'Jmr Owned Property'
            ) || [];
            
            // Set property data from production API
            this.jmrPropertyList.set(jmrProperties);
            this.propertyList.set(validProperties);
            
            console.log(`🎉 Successfully loaded ${validProperties.length} properties from production API (${jmrProperties.length} featured)`);
            
            // Update pagination data
            this.paginationData.set({
              totalItems: res.totalrecords || res.total || validProperties.length,
              count: res.totalrecords || res.total || validProperties.length,
              tableSize: res.recordlimit || res.limit || 10,
              totalPages: Math.ceil((res.totalrecords || res.total || validProperties.length) / (res.recordlimit || res.limit || 10)),
              page: res.currentPage || 1
            });

            // Update carousel indicators after data loads
            setTimeout(() => {
              this.updateCarouselIndicators();
            }, 200);

            this.isLoading.set(false);
            this.spinner.hide();

            // Show success message for production data
            this.swalToast.showToast(`🎉 Loaded ${validProperties.length} properties from production database!`, 'success');
          } else {
            console.log('📭 No properties found in production API response, trying random properties...');
            this.loadRandomProperties();
          }
        },
        error: (err) => {
          console.error('❌ Production API Error');
          console.error('🚨 Error loading properties from production API:', err);
          this.handlePropertyLoadError(err);
        },
      });
  }

  /**
   * Handle empty property data response
   */
  private handleEmptyPropertyData(): void {
    this.jmrPropertyList.set([]);
    this.propertyList.set([]);
    this.paginationData.set({
      totalItems: 0,
      count: 0,
      tableSize: 7,
      totalPages: 0,
      page: undefined
    });
    this.isLoading.set(false);
    this.spinner.hide();
    this.swalToast.showToast('📭 No properties found in development database', 'info');
  }

  /**
   * Handle property loading errors
   */
  private handlePropertyLoadError(err: any): void {
    console.error('Property API Error Details:', {
      status: err.status,
      statusText: err.statusText,
      message: err.message,
      error: err.error
    });

    let errorMessage = 'Failed to load properties. Please try again.';
    
    if (err.status === 0) {
      errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (err.status === 404) {
      errorMessage = 'Property service is currently unavailable.';
    } else if (err.status === 500) {
      errorMessage = 'Server error occurred while loading properties.';
    } else if (err.error?.headers?.message) {
      errorMessage = err.error.headers.message;
    }

    this.swalToast.showToast(errorMessage, 'error');
    this.handleEmptyPropertyData();
  }

  /**
   * Load properties with custom filter
   */
  loadPropertiesWithFilter(customFilter: Partial<SearchFilter>): void {
    const currentFilter = this.searchFilter();
    const newFilter = { ...currentFilter, ...customFilter };
    
    console.log('Loading properties with custom filter:', newFilter);
    this.searchFilter.set(newFilter);
    this.getPropertyDetails();
  }

  /**
   * Toggle options visibility
   */
  toggleOptions(event: Event): void {
    event.preventDefault();
    const optionHideElements = document.querySelectorAll('.option-hide');
    optionHideElements.forEach((element) => element.classList.toggle('hidden'));
  }

  /**
   * Calculate bathroom count from bedroom info
   */
  calculateBathCount(item: Property): number {
    if (!item?.bedroomInfo) return 0;
    
    return item.bedroomInfo.filter((data: any) =>
      data?.specification?.includes('Bathroom')
    )?.length || 0;
  }

  /**
   * Handle property type change
   */
  onChangePropertyType(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.PropertyType.setValue(target.value);
    this.trackSearchInteraction('propertyType', target.value);
  }

  /**
   * Handle status change
   */
  onChangeStatus(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.Status.setValue(target.value);
    this.trackSearchInteraction('status', target.value);
  }

  /**
   * Track search interactions for analytics
   */
  private trackSearchInteraction(field: string, value: string): void {
    console.log(`Search filter changed: ${field} = ${value}`);
    // Could integrate with analytics service here
  }

  /**
   * Search by city with enhanced validation
   */
  onSearchByCity(cityValue: string): void {
    if (!cityValue?.trim()) {
      this.swalToast.showToast('Please enter a valid city name', 'warning');
      return;
    }

    const queryParams: NavigationExtras = {
      queryParams: {
        city: cityValue.trim(),
        pageNo: 1,
        limit: 10,
      },
    };
    
    console.log('City search:', cityValue);
    this.router.navigate(['properties/browse'], queryParams);
  }

  /**
   * Search by country with enhanced validation
   */
  onSearchByCountry(countryValue: string): void {
    if (!countryValue?.trim()) {
      this.swalToast.showToast('Please select a valid country', 'warning');
      return;
    }

    const queryParams: NavigationExtras = {
      queryParams: {
        searchWithCountry: countryValue.trim(),
        pageNo: 1,
        limit: 10,
      },
    };
    
    console.log('Country search:', countryValue);
    this.router.navigate(['properties/browse'], queryParams);
  }

  /**
   * Submit search form with enhanced validation
   */
  onSubmitSearchData(): void {
    if (!this.hasSearchCriteria()) {
      this.router.navigate(['properties/browse']);
      return;
    }

    const queryParams: NavigationExtras = {
      queryParams: {
        searchWithCountry: this.Country.value || '',
        type: this.PropertyType.value || '',
        status: this.Status.value || '',
        pageNo: 1,
        limit: 10,
      },
    };
    
    console.log('Search submitted with params:', queryParams.queryParams);
    this.router.navigate(['properties/browse'], queryParams);
  }

  /**
   * Clear search form
   */
  onClearSearch(): void {
    this.searchFilterForm().reset();
    console.log('Search form cleared');
  }

  /**
   * Setup carousel functionality
   */
  setupCarousel(): void {
    // Setup drag functionality for carousels
    this.setupDragCarousel('carouselWrapper', 'latest');
    this.setupDragCarousel('carouselWrapper2', 'featured');
  }

  /**
   * Setup drag functionality for specific carousel
   */
  setupDragCarousel(wrapperId: string, type: 'featured' | 'latest'): void {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const container = wrapper.querySelector('.property-cards-container');
    if (!container) return;

    container.addEventListener('mousedown', (e: any) => this.startDrag(e, container, type));
    container.addEventListener('mousemove', (e: any) => this.drag(e, container, type));
    container.addEventListener('mouseup', () => this.endDrag(type));
    container.addEventListener('mouseleave', () => this.endDrag(type));

    // Touch events for mobile
    container.addEventListener('touchstart', (e: any) => this.startDrag(e, container, type));
    container.addEventListener('touchmove', (e: any) => this.drag(e, container, type));
    container.addEventListener('touchend', () => this.endDrag(type));
  }

  /**
   * Start drag operation
   */
  startDrag(e: any, container: Element, type: 'featured' | 'latest'): void {
    const currentState = this.carouselState();
    this.carouselState.set({
      ...currentState,
      isDragging: true,
      startX: (e.pageX || e.touches[0].pageX) - container.getBoundingClientRect().left,
      scrollLeft: container.scrollLeft
    });
  }

  /**
   * Handle drag movement
   */
  drag(e: any, container: Element, type: 'featured' | 'latest'): void {
    const state = this.carouselState();
    if (!state.isDragging) return;
    
    e.preventDefault();
    const x = (e.pageX || e.touches[0].pageX) - container.getBoundingClientRect().left;
    const walk = (x - state.startX) * 2;
    container.scrollLeft = state.scrollLeft - walk;
  }

  /**
   * End drag operation
   */
  endDrag(type: 'featured' | 'latest'): void {
    const currentState = this.carouselState();
    this.carouselState.set({
      ...currentState,
      isDragging: false
    });
    this.updateCurrentSlide(type);
  }

  /**
   * Update current slide position
   */
  updateCurrentSlide(type: 'featured' | 'latest'): void {
    const wrapperId = type === 'featured' ? 'carouselWrapper2' : 'carouselWrapper';
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const container = wrapper.querySelector('.property-cards-container');
    if (!container) return;

    const cardWidth = container.querySelector('.property-card')?.clientWidth || 0;
    const scrollPosition = container.scrollLeft;
    const newSlide = Math.round(scrollPosition / (cardWidth + 20));

    const currentState = this.carouselState();
    if (type === 'featured') {
      this.carouselState.set({
        ...currentState,
        featuredCurrentSlide: newSlide
      });
    } else {
      this.carouselState.set({
        ...currentState,
        latestCurrentSlide: newSlide
      });
    }

    this.updateCarouselIndicators();
  }

  /**
   * Scroll to specific card
   */
  scrollToCard(index: number, type: 'featured' | 'latest'): void {
    const wrapperId = type === 'featured' ? 'carouselWrapper2' : 'carouselWrapper';
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const container = wrapper.querySelector('.property-cards-container');
    if (!container) return;

    const cards = container.querySelectorAll('.property-card');
    if (cards[index]) {
      const cardWidth = cards[0].clientWidth;
      const gap = 20;
      const scrollPosition = index * (cardWidth + gap);

      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });

      const currentState = this.carouselState();
      if (type === 'featured') {
        this.carouselState.set({
          ...currentState,
          featuredCurrentSlide: index
        });
      } else {
        this.carouselState.set({
          ...currentState,
          latestCurrentSlide: index
        });
      }

      this.updateCarouselIndicators();
    }
  }

  /**
   * Update carousel indicators (placeholder for future implementation)
   */
  updateCarouselIndicators(): void {
    // Implementation for carousel indicators if needed
  }

  /**
   * Toggle favorite status for property
   */
  toggleFavorite(item: Property): void {
    if (item.isFavorite === undefined) {
      item.isFavorite = false;
    }
    item.isFavorite = !item.isFavorite;
    
    console.log(`Property ${item.id} favorite status: ${item.isFavorite}`);
    // Could integrate with favorites service here
  }

  /**
   * Scroll to top of page
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Helper methods for template (Enhanced with better type safety)
  
  /**
   * Get CSS class for property status
   */
  getPropertyStatusClass(item: Property): string {
    return item?.status === 'Sell' ? 'for-sale' : 'for-rent';
  }

  /**
   * Get display text for property status
   */
  getPropertyStatusText(item: Property): string {
    return item?.status === 'Sell' ? 'For Sale' : 'For Rent';
  }

  /**
   * Get CSS class for availability status
   */
  getAvailabilityClass(item: Property): string {
    return item?.availability?.readyToMove ? 'success' : 'warning';
  }

  /**
   * Get formatted availability text
   */
  getAvailabilityText(item: Property): string {
    if (!item?.availability) return 'NA';

    if (item.availability.readyToMove) {
      return 'Ready To Move';
    } else if (item.availability.availableDate) {
      const date = new Date(item.availability.availableDate);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return `Since ${formattedDate}`;
    } else {
      return 'NA';
    }
  }

  /**
   * Get formatted location text
   */
  getLocationText(item: Property): string {
    if (!item?.addressInfo) return '';

    const locationParts = [];
    if (item.addressInfo.city) locationParts.push(item.addressInfo.city);
    if (item.addressInfo.country === 'India' && item.addressInfo.state) {
      locationParts.push(item.addressInfo.state);
    }
    if (item.addressInfo.country) locationParts.push(item.addressInfo.country);

    return locationParts.join(', ');
  }

  /**
   * Get formatted price with currency
   */
  getFormattedPrice(item: Property): string {
    if (!item?.price) return '';

    const currencyDetails = this.currencyDetails();
    const currency = currencyDetails.find((c) => c.code === item.currency);
    if (!currency) return '';

    const price =
      item.currency === 'INR'
        ? this.formatCurrencyString(item.price, 2)
        : this.formatIndianNumber(item.price, 2);

    const unit = item?.valueUnit ? `/${item.valueUnit}` : '';

    return `${currency.symbol}${price}${unit}`;
  }

  /**
   * Format currency string
   */
  private formatCurrencyString(value: any, decimals: number): string {
    return new CurrencyStringPipe().transform(value, decimals);
  }

  /**
   * Format Indian number system
   */
  private formatIndianNumber(value: any, decimals: number): string {
    return new IndianNumberPipe().transform(value as string | number) as string;
  }

  /**
   * Get formatted area text
   */
  getFormattedArea(item: Property): string {
    if (!item?.area) return '';
    const formattedArea = this.formatIndianNumber(item.area, 0);
    return `${formattedArea} ${item.size || ''}`.trim();
  }

  /**
   * Check if property is featured
   */
  isFeaturedProperty(item: Property): boolean {
    return item?.propertyOwnerShip === 'Jmr Owned Property';
  }

  /**
   * Get BHK text for property
   */
  getBHKText(item: Property): string {
    if (!item?.bedRooms) return '';
    return `${item.bedRooms} BHK ${item.type || ''}`.trim();
  }

  /**
   * Handle property card click for analytics
   */
  onPropertyCardClick(item: Property): void {
    console.log('Property card clicked:', item.id);
    // Could add analytics tracking here
  }

  /**
   * Handle property image error
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/no_image.png';
    console.warn('Property image failed to load:', img.getAttribute('data-original-src') || img.src);
  }

  /**
   * Validate property data from API
   */
  private validatePropertyData(property: any): boolean {
    if (!property) {
      console.warn('Property data is null or undefined');
      return false;
    }

    const requiredFields = ['id', 'title'];
    const missingFields = requiredFields.filter(field => !property[field]);
    
    if (missingFields.length > 0) {
      console.warn('Property missing required fields:', missingFields, property);
      return false;
    }

    return true;
  }

  /**
   * Get property API status for debugging
   */
  getPropertyApiStatus(): string {
    const totalProperties = this.propertyList().length;
    const featuredProperties = this.jmrPropertyList().length;
    const isLoading = this.isLoading();
    
    return `🌐 Production API Status: ${isLoading ? 'Loading from production database...' : 'Loaded from production database'} | Total: ${totalProperties} | Featured: ${featuredProperties}`;
  }

  /**
   * Log property data for debugging
   */
  logPropertyData(): void {
    console.group('Property Data Debug Info');
    console.log('Total Properties:', this.propertyList().length);
    console.log('Featured Properties:', this.jmrPropertyList().length);
    console.log('Search Filter:', this.searchFilter());
    console.log('Pagination Data:', this.paginationData());
    console.log('Currency Details:', this.currencyDetails().length);
    console.log('Country Codes:', this.countryCodes().length);
    console.log('Is Loading:', this.isLoading());
    console.log('Is Initialized:', this.isInitialized());
    
    if (this.propertyList().length > 0) {
      console.log('Sample Property:', this.propertyList()[0]);
    }
    
    console.groupEnd();
  }

  /**
   * Refresh property data from Production API
   */
  refreshProperties(): void {
    console.log('🔄 Refreshing properties from Production API...');
    this.getPropertyDetails();
  }

  /**
   * Force load properties from Production API
   */
  forceLoadProperties(): void {
    console.log('🚀 Force loading properties from Production API...');
    this.isLoading.set(false); // Reset loading state
    this.spinner.hide(); // Hide any existing spinner
    
    // Clear existing data
    this.propertyList.set([]);
    this.jmrPropertyList.set([]);
    
    // Try loading with fresh state
    this.getPropertyDetails();
  }

  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
