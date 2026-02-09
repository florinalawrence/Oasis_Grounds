import {
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
  OnInit,
  AfterViewInit,
  HostListener,
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
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagePropertyService } from '../../services/ManageProperty-service/manage-property.service';
import { ToastService } from '../../services/Toast-service/toast.service';
import { SessionService } from '../../services/Session-service/session.service';
import { NotifierService } from '../../services/Notifier-service/notifier.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipEditedEvent, MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NgxPaginationModule } from 'ngx-pagination';
import { CurrencyStringPipe } from '../../shared/pipes/currencyStringConvertor.pipe';
import { IndianNumberPipe } from '../../shared/pipes/indianNumber.pipe';
import { Meta, Title } from '@angular/platform-browser';

interface Property {
  propertyId: string;
  propertyName: string;
  propertyType: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  areaUnit: string;
  city: string;
  state: string;
  country: string;
  featuredImage?: string;
  images?: string[];
  description?: string;
  status?: string;
  listPropertyAs?: string;
  propertyOwnerShip?: string;
  availability?: {
    readyToMove: boolean;
    availableDate: string | null;
  };
  addressInfo?: {
    city: string;
    state: string;
    country: string;
    addressLine1?: string;
    landMark?: string;
  };
  id?: string;
  title?: string;
  type?: string;
  bedRooms?: string | number;
  bathRooms?: string | number;
  size?: string;
  listOfImage?: string[];
  postedBy?: string;
}

interface ISearchPropertyDetails {
  searchWithCountry: string;
  searchWithZipcode: number[];
  searchWithState: string;
  type: string[];
  status: string;
  sortFilter: string;
  minArea: string;
  maxArea: string;
  size: string;
  minPrice: string;
  maxPrice: string;
  city: string[];
  minAge: string;
  maxAge: string;
  pageNo: number;
  limit: number;
}

@Component({
  selector: 'app-all-property',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
    MatFormFieldModule,
    NgxPaginationModule,
    CurrencyStringPipe,
    IndianNumberPipe,
  ],
  templateUrl: './all-property.html',
  styleUrls: ['./all-property.scss'],
})
export class AllProperty implements OnInit, AfterViewInit, OnDestroy {

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly notifier = inject(NotifierService);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly swalToast = inject(ToastService);
  private readonly session = inject(SessionService);
  readonly propertyService = inject(ManagePropertyService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

 
  readonly isLoading = signal(false);
  readonly isLoadingProperties = signal(false);
  readonly dataLoaded = signal(false);
  readonly selectedSort = signal('default');
  readonly isSorting = signal(false);
  readonly priceRangeValue = signal(5000000);
  readonly minPrice = signal(0);
  readonly maxPrice = signal(10000000);
  readonly canShowClearAll = signal(false);
  readonly userProfileData = signal<boolean>(false);
  readonly canAddWishList = signal(false);


  readonly properties = signal<Property[]>([]);
  readonly featuredProperties = signal<Property[]>([]);
  readonly latestProperties = signal<Property[]>([]);
  readonly filteredProperties = signal<Property[]>([]);
  readonly randomProperty = signal<Property[]>([]);
  readonly propertyList = signal<any[]>([]);
  readonly wishList = signal<any[]>([]);
  readonly countryCodes = signal<any[]>([]);
  readonly currencyDetails = signal<any[]>([]);
  readonly states = signal<any[]>([]);
  readonly propertyTypes = signal<string[]>([]);
  readonly cities = signal<string[]>([]);


  readonly totalItems = signal(0);
  readonly totalPages = signal(0);
  readonly page = signal(1);
  readonly tableSize = signal(12);
  readonly oldPaginationNo = signal(1);
  readonly count = signal(0);
  readonly searchResultsCount = signal(0);
  readonly searchResultsMsg = signal('');
  readonly cityMatchCount = signal(0);

  // Computed signals
  readonly pageMetadata = computed(() => ({
    title: `All Properties - Find Your Dream Property`,
    description: `Browse through our extensive collection of properties for sale and rent. Find apartments, villas, plots and more with advanced search filters.`,
    keywords: 'properties, real estate, apartments, villas, plots, buy, rent, property search'
  }));

  // Panel visibility signals
  readonly panelStatusVisible = signal(false);
  readonly panelTypeVisible = signal(false);
  readonly panelLocationVisible = signal(false);
  readonly panelRangeVisible = signal(false);

  readonly canShowPanelByQueryParam = computed(() => ({
    status: this.panelStatusVisible(),
    range: this.panelRangeVisible(),
    loc: this.panelLocationVisible(),
    type: this.panelTypeVisible(),
  }));

  // Legacy properties (keeping for compatibility with template)
  sortFilterValue: any;
  propertyDataCount: any;
  addOnCityBlur = true;
  readonly separatorKeysCodesForCity = [ENTER, COMMA] as const;

  // Forms
  locSearchForm: FormGroup;
  rangeSearchForm: FormGroup;

  // Search filters
  searchFilter: ISearchPropertyDetails = {
    searchWithCountry: '',
    searchWithZipcode: [],
    searchWithState: '',
    type: [],
    status: '',
    sortFilter: '',
    minArea: '',
    maxArea: '',
    size: '',
    minPrice: '',
    maxPrice: '',
    city: [],
    minAge: '',
    maxAge: '',
    pageNo: 1,
    limit: 10,
  };

  @ViewChild('cityInput') cityInput!: ElementRef<HTMLInputElement>;
  @ViewChild('chipSet') chipSet!: any;
  chipGrid: any;

  constructor() {
    this.locSearchForm = this.fb.group({
      country: new FormControl(''),
      city: new FormControl(''),
      state: new FormControl(''),
    });

    this.rangeSearchForm = this.fb.group({
      areaMin: new FormControl(''),
      areaMax: new FormControl(''),
      areaSize: new FormControl(''),
      priceMin: new FormControl(''),
      priceMax: new FormControl(''),
      ageMin: new FormControl(''),
      ageMax: new FormControl(''),
    });
  }

  ngOnInit() {
    // Setup page metadata for SEO
    this.setupPageMetadata();
    
    // Initialize data using signals
    this.countryCodes.set(this.propertyService.getCountryCodes());
    this.states.set(this.propertyService.getStates());
    this.currencyDetails.set(this.propertyService.getCurrencyData());

    // Clear route URL if exists
    if (localStorage.getItem('routeUrl')) {
      localStorage.setItem('routeUrl', '');
    }

    this.getRoutingParams();
    this.getNotifyData();

    // Initialize pagination
    this.notifier.paginationNo$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res: number) => {
      if (res) {
        this.oldPaginationNo.set(res);
        this.searchFilter.pageNo = res;
        this.page.set(res);
      } else {
        this.page.set(1);
        this.oldPaginationNo.set(1);
        this.searchFilter.pageNo = 1;
      }
    });

    // Load wishlist if logged in
    if (localStorage.getItem('AccessToken')) {
      this.getWishList();
    }
  }

  ngAfterViewInit() {
    this.getRandomFeaturedProperty();

    // Small delay to ensure DOM is fully rendered
    setTimeout(() => {
      this.initializeCarousels();
      this.initializePriceRange();
    }, 100);
  }

 
  private setupPageMetadata(): void {
    const metadata = this.pageMetadata();
    
    this.title.setTitle(metadata.title);
    this.meta.updateTag({ name: 'description', content: metadata.description });
    this.meta.updateTag({ name: 'keywords', content: metadata.keywords });
    this.meta.updateTag({ property: 'og:title', content: metadata.title });
    this.meta.updateTag({ property: 'og:description', content: metadata.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  // New component methods
  loadProperties() {
    this.isLoading.set(true);
    this.spinner.show();

    this.propertyService.getRandomPropertyData().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        if (response?.data) {
          this.properties.set(response.data);
          this.filteredProperties.set([...response.data]);

          // Split properties for featured and latest sections
          const midPoint = Math.ceil(response.data.length / 2);
          this.featuredProperties.set(response.data.slice(0, midPoint));
          this.latestProperties.set(response.data.slice(midPoint));

          this.isLoading.set(false);
          this.spinner.hide();

          // No carousels to initialize
        }
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        // this.swalToast.showToast('Failed to load properties', 'error');
        this.isLoading.set(false);
        this.spinner.hide();
      },
    });
  }

  searchProperties(filters?: any) {
    this.isLoading.set(true);
    this.spinner.show();

    // Merge filters with existing search filter, giving priority to new filters
    const searchData = {
      ...this.searchFilter,
      ...filters,
      minPrice: filters?.minPrice || this.searchFilter.minPrice || this.minPrice().toString(),
      maxPrice: filters?.maxPrice || this.searchFilter.maxPrice || this.priceRangeValue().toString(),
      city: filters?.city || this.searchFilter.city || [],
    };

    // Remove empty values
    Object.keys(searchData).forEach((key) => {
      if (
        searchData[key as keyof typeof searchData] === '' ||
        searchData[key as keyof typeof searchData] === null ||
        searchData[key as keyof typeof searchData] === undefined
      ) {
        delete searchData[key as keyof typeof searchData];
      }
    });

    this.propertyService.getPropertyDetailsByFilter(searchData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        if (response?.data) {
          this.filteredProperties.set(response.data);
          this.totalItems.set(response.totalrecords);
          this.count.set(response.totalrecords);
          this.tableSize.set(response.recordlimit);
          this.totalPages.set(Math.ceil(response.totalrecords / response.recordlimit));
          this.checkTotalPropertyCountByRoutingUrl();
          this.searchResultsCount.set(response.totalrecords);
        }
        this.isLoading.set(false);
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error searching properties:', error);
        // this.swalToast.showToast('Failed to search properties', 'error');
        this.isLoading.set(false);
        this.spinner.hide();
      },
    });
  }

  navigateToDetails(propertyId?: string) {
    if (propertyId) {
      this.router.navigate(['/details', propertyId], {
        queryParams: { source: 'all-properties' }
      });
    }
  }

  // Old component methods
  getRandomFeaturedProperty() {
    this.propertyService.getRandomPropertyData().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.randomProperty.set(res?.recordInfo || []);
      },
      error: (err: any) => {
        const errList = err;
        // this.swalToast.showToast(errList, 'error');
      },
    });
  }

  getRoutingParams() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((queryParams) => {
      if (queryParams.get('pageNo')) {
        const pageNo: any = queryParams.get('pageNo');
        this.notifier.sendPaginationNo(pageNo);

        const minArea: any = queryParams.get('minArea') ? Number(queryParams.get('minArea')) : 0;
        const maxArea: any = queryParams.get('maxArea') ? Number(queryParams.get('maxArea')) : 0;
        const minPrice: any = queryParams.get('minPrice') ? Number(queryParams.get('minPrice')) : 0;
        const maxPrice: any = queryParams.get('maxPrice') ? Number(queryParams.get('maxPrice')) : 0;
        const state: any = queryParams.get('searchWithState')
          ? queryParams.get('searchWithState')
          : '';
        const country: any = queryParams.get('searchWithCountry')
          ? queryParams.get('searchWithCountry')
          : '';

        const queryParamZipValue = queryParams.get('searchWithZipcode');
        let searchWithZipcode: number[] = [];

        let propertyTypeQueryParam = queryParams.get('type');
        let typeArray: string[] = [];

        if (state) {
          this.State.setValue(state);
        }
        if (country) {
          this.Country.setValue(country);
        }
        if (propertyTypeQueryParam) {
          typeArray = propertyTypeQueryParam.split(',');
          this.propertyTypes.set(typeArray);
        }

        let cityQueryParam = queryParams.get('city');
        let cityArray: string[] = [];
        if (cityQueryParam) {
          cityArray = cityQueryParam.split(',');
          this.cities.set(cityArray);
        }

        if (queryParamZipValue) {
          searchWithZipcode = queryParamZipValue.split(',').map(Number).filter(Number.isFinite);
        }

        this.page.set(pageNo);
        this.searchFilter = {
          searchWithCountry: queryParams.get('searchWithCountry') || '',
          searchWithZipcode: searchWithZipcode || [],
          searchWithState: state || '',
          type: typeArray || [],
          status: queryParams.get('status') || '',
          minArea: minArea.toString() || '',
          maxArea: maxArea.toString() || '',
          size: queryParams.get('size') || '',
          minPrice: minPrice.toString() || '',
          maxPrice: maxPrice.toString() || '',
          minAge: queryParams.get('minAge') || '',
          maxAge: queryParams.get('maxAge') || '',
          sortFilter: queryParams.get('sortFilter') || '',
          city: cityArray || [],
          pageNo:
            this.page() || (this.oldPaginationNo() !== 0 && this.oldPaginationNo())
              ? this.oldPaginationNo()
              : queryParams.get('pageNo')
              ? Number(queryParams.get('pageNo'))
              : 1,
          limit: queryParams.get('limit') ? Number(queryParams.get('limit')) : 10,
        };

        this.showPanelByQueryParamWhenPageRefresh();
        this.getPropertyDetails();
      } else {
        if (this.oldPaginationNo() !== 0 && this.oldPaginationNo()) {
          this.searchFilter.pageNo = this.oldPaginationNo();
          this.page.set(this.oldPaginationNo());
        }
        this.getPropertyDetails();
      }
    });

    // Check for clear all link visibility
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.canShowClearAll.set(
        !!params['searchWithCountry'] ||
        !!params['searchWithZipcode'] ||
        !!params['searchWithState'] ||
        !!params['type'] ||
        !!params['status'] ||
        !!params['sortFilter'] ||
        !!params['minArea'] ||
        !!params['maxArea'] ||
        !!params['size'] ||
        !!params['minPrice'] ||
        !!params['maxPrice'] ||
        !!params['city'] ||
        !!params['minAge'] ||
        !!params['maxAge']);
    });
  }

  showPanelByQueryParamWhenPageRefresh() {
    this.panelStatusVisible.set(!!this.searchFilter.status);
    this.panelTypeVisible.set(this.searchFilter.type.length > 0);
    this.panelLocationVisible.set(
      !!this.searchFilter.searchWithCountry ||
      !!this.searchFilter.searchWithState ||
      this.searchFilter.city.length > 0
    );
    this.panelRangeVisible.set(
      !!this.searchFilter.minArea ||
      !!this.searchFilter.maxArea ||
      !!this.searchFilter.size ||
      !!this.searchFilter.minAge ||
      !!this.searchFilter.maxAge ||
      !!this.searchFilter.minPrice ||
      !!this.searchFilter.maxPrice
    );
  }

  getWishList() {
    // TODO: Implement wishlist functionality when service method is available
    // this.dataSubscription = this.propertyService.getWishlistData().subscribe((res: any) => {
    //   if (res?.headers?.statusCode == 200) {
    //     this.wishList = res?.data || [];
    //   }
    // });
  }

  getNotifyData() {
    this.notifier.userProfileData$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res: boolean) => {
      this.userProfileData.set(res ? res : this.session.getToken() ? true : false);
    });
  }

  getPropertyDetails() {
    console.log('🔄 Fetching Properties from Production API...');
    this.spinner.show();
    this.isLoading.set(true);
    this.isLoadingProperties.set(true);
    this.dataLoaded.set(false);

    console.log('🌐 Production API Base URL:', this.propertyService.baseApiUrl);
    console.log('🔍 Search Filter:', this.searchFilter);

    if (this.searchFilter) {
      this.Country.setValue(this.searchFilter?.searchWithCountry || '');
      this.State.setValue(this.searchFilter?.searchWithState || '');
      this.AreaMin.setValue(this.searchFilter?.minArea || '');
      this.AreaMax.setValue(this.searchFilter.maxArea || '');
      this.PriceMin.setValue(this.searchFilter.minPrice || '');
      this.PriceMax.setValue(this.searchFilter.maxPrice || '');
      this.AreaSize.setValue(this.searchFilter.size || '');
      this.AgeMin.setValue(this.searchFilter.minAge || '');
      this.AgeMax.setValue(this.searchFilter.maxAge || '');
      this.sortFilterValue = this.searchFilter.sortFilter || 'Default';
      this.selectedSort.set(this.searchFilter.sortFilter || 'default');
    }

    this.propertyList.set([]);
    this.filteredProperties.set([]);
    this.propertyService.getPropertyDetailsByFilter(this.searchFilter).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        console.log(' Production API Response:', res);
        console.log(' Response Type:', typeof res);
        console.log(' Response Keys:', res ? Object.keys(res) : 'No keys');

        // Handle different response structures from production API
        let propertyData = [];
        
        if (res && res.data && Array.isArray(res.data)) {
          propertyData = res.data;
          console.log(' Found property data in res.data from production API');
        } else if (res && Array.isArray(res)) {
          propertyData = res;
          console.log('Response is direct array from production API');
        } else if (res && res.properties && Array.isArray(res.properties)) {
          propertyData = res.properties;
          console.log(' Found property data in res.properties from production API');
        } else if (res && res.result && Array.isArray(res.result)) {
          propertyData = res.result;
          console.log(' Found property data in res.result from production API');
        } else if (res && res.recordInfo && Array.isArray(res.recordInfo)) {
          propertyData = res.recordInfo;
          console.log(' Found property data in res.recordInfo from production API');
        } else {
          console.warn(' No valid property data found in production API response');
          propertyData = [];
        }

        this.propertyList.set(propertyData);

        if (propertyData.length > 0) {
          console.log(`Found ${propertyData.length} properties in development API`);
          console.log('Sample property from development API:', propertyData[0]);

          // FIXED MAPPING - matching the API response structure
          this.filteredProperties.set(this.propertyList().map((property) => ({
            propertyId: property.id,
            propertyName: property.title,
            propertyType: property.type,
            price: property.price,
            currency: property.currency || 'INR',
            bedrooms: property.bedRooms ? parseInt(property.bedRooms as string) : 0,
            bathrooms: property.bathRooms ? parseInt(property.bathRooms as string) : 0,
            area: property.area,
            areaUnit: property.size || 'Sq.Ft',
            city: property.addressInfo?.city || '',
            state: property.addressInfo?.state || '',
            country: property.addressInfo?.country || '',
            featuredImage: property.featuredImage,
            images: property.listOfImage || [],
            description: property.description,
            status: property.status,
            // Add these fields from API
            listPropertyAs: property.listPropertyAs,
            availability: property.availability,
            addressInfo: property.addressInfo,
            propertyOwnerShip: property.propertyOwnerShip,
          })));

          // Update pagination data
          this.totalItems.set(res.totalrecords || res.total || propertyData.length);
          this.count.set(res.totalrecords || res.total || propertyData.length);
          this.tableSize.set(res.recordlimit || res.limit || 10);
          this.totalPages.set(Math.ceil(this.totalItems() / this.tableSize()));
          this.searchResultsCount.set(res.totalrecords || res.total || propertyData.length);

          // Apply sorting if a sort filter is active
          const currentSort = this.selectedSort();
          if (currentSort && currentSort !== 'default') {
            console.log(" Applying sort filter after loading:', currentSort");
            this.applySorting(currentSort);
          } else {
            // Split for featured and latest sections (default behavior)
            const midPoint = Math.ceil(this.filteredProperties().length / 2);
            this.featuredProperties.set(this.filteredProperties().slice(0, midPoint));
            this.latestProperties.set(this.filteredProperties().slice(midPoint));
          }

          console.log(`Successfully loaded ${propertyData.length} properties from production API`);
          // this.swalToast.showToast(`Loaded ${propertyData.length} properties from production database`, 'success');
        } else {
          console.log('📭 No properties found in production API response');
          this.filteredProperties.set([]);
          this.featuredProperties.set([]);
          this.latestProperties.set([]);
          
          // Set empty pagination data
          this.totalItems.set(0);
          this.count.set(0);
          this.tableSize.set(10);
          this.totalPages.set(0);
          this.searchResultsCount.set(0);

          // this.swalToast.showToast('📭 No properties found in production database', 'info');
        }

        this.dataLoaded.set(true);
        this.propertyDataCount = res;
        this.checkTotalPropertyCountByRoutingUrl();

        this.spinner.hide();
        this.isLoading.set(false);
        this.isLoadingProperties.set(false);

        // Reinitialize carousels
        setTimeout(() => {
          this.initializeCarousels();
        }, 100);
      },
      error: (err: any) => {
        console.error(' Production API Error:', err);
        console.error(' Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });

        let errorMessage = 'Failed to load properties from production API';
        
        if (err.status === 0) {
          errorMessage = 'Unable to connect to production API server';
        } else if (err.status === 404) {
          errorMessage = 'Production API endpoint not found';
        } else if (err.status === 500) {
          errorMessage = 'Production API server error';
        } else if (err.error?.headers?.message) {
          errorMessage = err.error.headers.message;
        }

        // this.swalToast.showToast(errorMessage, 'error');
        
        // Set empty state
        this.propertyList.set([]);
        this.filteredProperties.set([]);
        this.featuredProperties.set([]);
        this.latestProperties.set([]);
        this.totalItems.set(0);
        this.count.set(0);
        this.searchResultsCount.set(0);
        this.dataLoaded.set(true);
        
        this.spinner.hide();
        this.isLoading.set(false);
        this.isLoadingProperties.set(false);
      },
    });
  }

  getLocationText(item: any): string {
    if (!item?.addressInfo && !item?.city) return '';

    const locationParts = [];

    // Try addressInfo first (nested structure)
    if (item.addressInfo) {
      if (item.addressInfo.city) locationParts.push(item.addressInfo.city);
      if (item.addressInfo.country === 'India' && item.addressInfo.state) {
        locationParts.push(item.addressInfo.state);
      }
      if (item.addressInfo.country) locationParts.push(item.addressInfo.country);
    }
    // Fallback to flat structure
    else {
      if (item.city) locationParts.push(item.city);
      if (item.country === 'India' && item.state) {
        locationParts.push(item.state);
      }
      if (item.country) locationParts.push(item.country);
    }

    return locationParts.join(', ');
  }

  getAvailabilityText(item: any): string {
    if (!item?.availability) return 'N/A';

    if (item.availability.readyToMove) {
      return 'Ready To Move';
    } else if (item.availability.availableDate) {
      const date = new Date(item.availability.availableDate);
      const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
      const formattedDate = date.toLocaleDateString('en-US', options);
      return `Since ${formattedDate}`;
    } else {
      return 'N/A';
    }
  }

  getAvailabilityClass(item: any): string {
    return item?.availability?.readyToMove ? 'success' : 'warning';
  }

  getFormattedArea(item: any): string {
    if (!item?.area) return 'N/A';

    // Use your IndianNumberPipe
    const pipe = new IndianNumberPipe();
    const formattedArea = pipe.transform(item.area);
    return `${formattedArea} ${item.areaUnit || item.size || 'Sq.Ft'}`.trim();
  }

  getPostedByText(item: any): string {
    return item?.listPropertyAs || 'Individual';
  }

  getBHKText(item: any): string {
    if (!item?.bedrooms && !item?.bedRooms) return '';
    const bedrooms = item.bedrooms || item.bedRooms;
    return `${bedrooms} BHK ${item.propertyType || item.type || ''}`.trim();
  }

  getFormattedPrice(item: any): string {
    if (!item?.price) return '';

    const currency = this.currencyDetails().find((c: any) => c.code === item.currency);
    if (!currency) return `${item.currency || '₹'}${item.price}`;

    let formattedPrice = '';
    if (item.currency === 'INR') {
      const pipe = new CurrencyStringPipe();
      formattedPrice = pipe.transform(item.price) as string;
    } else {
      const pipe = new IndianNumberPipe();
      formattedPrice = pipe.transform(item.price) as string;
    }

    return `${currency.symbol}${formattedPrice}`;
  }

   onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Set fallback image
    img.src = 'assets/images/no_image.png';
    console.warn('Property image failed to load, using fallback image');
  }

  // Form getters
  get f(): { [key: string]: AbstractControl } {
    return this.locSearchForm.controls;
  }

  get fa(): { [key: string]: AbstractControl } {
    return this.rangeSearchForm.controls;
  }

  get State(): FormControl {
    return this.locSearchForm.get('state') as FormControl;
  }

  get Country(): FormControl {
    return this.locSearchForm.get('country') as FormControl;
  }

  get AreaMin(): FormControl {
    return this.rangeSearchForm.get('areaMin') as FormControl;
  }

  get AreaMax(): FormControl {
    return this.rangeSearchForm.get('areaMax') as FormControl;
  }

  get AreaSize(): FormControl {
    return this.rangeSearchForm.get('areaSize') as FormControl;
  }

  get PriceMin(): FormControl {
    return this.rangeSearchForm.get('priceMin') as FormControl;
  }

  get PriceMax(): FormControl {
    return this.rangeSearchForm.get('priceMax') as FormControl;
  }

  get AgeMin(): FormControl {
    return this.rangeSearchForm.get('ageMin') as FormControl;
  }

  get AgeMax(): FormControl {
    return this.rangeSearchForm.get('ageMax') as FormControl;
  }

  // Event handlers
  onChangeCountry(event: any) {
    const value = event.target.value;
    this.Country.setValue(value);
    this.State.setValue(null);
    this.cityMatchCount.set(0);
    this.searchFilter.searchWithState = '';
    this.searchFilter.city = [];
    this.cities.set([]);
  }

  onSelectStateChange(event: any) {
    const state = event.target.value;
    this.State.setValue(state);
    this.cityMatchCount.set(0);
    this.searchFilter.city = [];
    this.cities.set([]);
  }

  onSelectSortFilter(event: any) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.selectedSort.set(selectedValue);
    this.notifier.sendPaginationNo(1);

    const queryParams: { [key: string]: any } = { ...this.checkQueryParamValues() };

    if (selectedValue && selectedValue !== 'default') {
      queryParams['sortFilter'] = selectedValue;
      this.searchFilter.sortFilter = selectedValue;
    } else {
      delete queryParams['sortFilter'];
      this.searchFilter.sortFilter = '';
    }

    // Update URL with new sort parameter
    const navigationExtras: NavigationExtras = {
      queryParams,
    };
    this.router.navigate(['properties/browse'], navigationExtras);
    
    // Apply sorting to current properties instead of refetching
    this.applySorting(selectedValue);
    
    console.log('🔄 Applied sorting:', selectedValue);
  }

  /**
   * Apply sorting to the filtered properties
   */
  private applySorting(sortType: string): void {
    this.isSorting.set(true);
    
    const currentProperties = [...this.filteredProperties()];
    
    if (!currentProperties.length) {
      console.log('⚠️ No properties to sort');
      this.isSorting.set(false);
      return;
    }

    let sortedProperties: Property[] = [];

    switch (sortType) {
      case 'newest':
        sortedProperties = currentProperties.sort((a, b) => {
          // Use property ID as proxy for creation order (higher IDs are typically newer)
          const idA = parseInt(a.propertyId?.toString() || '0');
          const idB = parseInt(b.propertyId?.toString() || '0');
          return idB - idA; // Newest first (higher ID first)
        });
        break;

      case 'oldest':
        sortedProperties = currentProperties.sort((a, b) => {
          // Use property ID as proxy for creation order (lower IDs are typically older)
          const idA = parseInt(a.propertyId?.toString() || '0');
          const idB = parseInt(b.propertyId?.toString() || '0');
          return idA - idB; // Oldest first (lower ID first)
        });
        break;

      case 'highest':
        sortedProperties = currentProperties.sort((a, b) => {
          const priceA = parseFloat(a.price?.toString() || '0');
          const priceB = parseFloat(b.price?.toString() || '0');
          return priceB - priceA; // Highest price first
        });
        break;

      case 'lowest':
        sortedProperties = currentProperties.sort((a, b) => {
          const priceA = parseFloat(a.price?.toString() || '0');
          const priceB = parseFloat(b.price?.toString() || '0');
          return priceA - priceB; // Lowest price first
        });
        break;



      case 'default':
      default:
        // Keep original order or sort by ID
        sortedProperties = currentProperties.sort((a, b) => {
          const idA = parseInt(a.propertyId?.toString() || '0');
          const idB = parseInt(b.propertyId?.toString() || '0');
          return idB - idA; // Default: newest by ID
        });
        break;
    }

    // Update the filtered properties with sorted data
    this.filteredProperties.set(sortedProperties);

    // Update featured and latest sections with sorted data
    const midPoint = Math.ceil(sortedProperties.length / 2);
    this.featuredProperties.set(sortedProperties.slice(0, midPoint));
    this.latestProperties.set(sortedProperties.slice(midPoint));

    console.log(` Sorted ${sortedProperties.length} properties by: ${sortType}`);
    
    // Add a small delay to show sorting feedback
    setTimeout(() => {
      this.isSorting.set(false);
    }, 300);
  }

  /**
   * Get user-friendly description of current sort
   */
  getSortDescription(): string {
    const sortType = this.selectedSort();
    const sortDescriptions: { [key: string]: string } = {
      'default': 'Default order',
      'newest': 'Newest items first',
      'oldest': 'Oldest items first',
      'highest': 'Highest price first',
      'lowest': 'Lowest price first'
    };
    
    return sortDescriptions[sortType] || 'Default order';
  }

  onPriceRangeChange(event: any) {
    const value = parseInt(event.target.value);
    this.priceRangeValue.set(value);
    this.searchFilter.maxPrice = value.toString();
    this.updatePriceDisplay();
  }

  searchByStatus(searchText: string) {
    this.page.set(1);
    this.oldPaginationNo.set(1);
    this.searchFilter.pageNo = 1;
    this.notifier.sendPaginationNo(this.page());

    const queryParams: { [key: string]: any } = { ...this.checkQueryParamValues() };

    if (searchText && this.searchFilter.status !== searchText) {
      this.panelStatusVisible.set(true);
      queryParams['status'] = searchText;
      this.searchFilter.status = searchText;
    } else {
      this.panelStatusVisible.set(false);
      delete queryParams['status'];
      this.searchFilter.status = '';
    }

    const navigationExtras: NavigationExtras = {
      queryParams,
    };
    this.router.navigate(['properties/browse'], navigationExtras);
  }

  searchByPropertyType(searchText: string) {
    this.page.set(1);
    this.oldPaginationNo.set(1);
    this.searchFilter.pageNo = 1;
    this.notifier.sendPaginationNo(this.page());

    const queryParams: { [key: string]: any } = { ...this.checkQueryParamValues() };

    if (!this.propertyTypes().includes(searchText)) {
      const currentTypes = [...this.propertyTypes()];
      currentTypes.push(searchText);
      this.propertyTypes.set(currentTypes);
      queryParams['type'] = this.propertyTypes().join(',');
      this.searchFilter.type = [...this.propertyTypes()];
      this.panelTypeVisible.set(true);
    } else {
      const currentTypes = this.propertyTypes().filter((i) => i !== searchText);
      this.propertyTypes.set(currentTypes);
      queryParams['type'] = this.propertyTypes().join(',');
      this.searchFilter.type = [...this.propertyTypes()];

      if (this.propertyTypes().length == 0) {
        this.panelTypeVisible.set(false);
        delete queryParams['type'];
        this.searchFilter.type = [];
      }
    }

    const navigationExtras: NavigationExtras = {
      queryParams,
    };
    this.router.navigate(['properties/browse'], navigationExtras);
  }

  onSubmitLocationSearch() {
    this.page.set(1);
    this.oldPaginationNo.set(1);
    this.searchFilter.pageNo = 1;
    this.notifier.sendPaginationNo(this.page());

    const cityQueryParam = this.cities().join(',');
    const queryParams: { [key: string]: any } = { ...this.checkQueryParamValues() };

    if (this.Country.value) {
      queryParams['searchWithCountry'] = this.Country.value;
      this.searchFilter.searchWithCountry = this.Country.value;
    }

    if (this.State.value) {
      queryParams['searchWithState'] = this.State.value;
      this.searchFilter.searchWithState = this.State.value;
    }

    if (cityQueryParam) {
      queryParams['city'] = cityQueryParam;
      this.searchFilter.city = [...this.cities()];
    }

    const navigationExtras: NavigationExtras = {
      queryParams,
    };
    this.router.navigate(['properties/browse'], navigationExtras);
    this.scrollToTop();
  }

  onSubmitRangeSearch() {
    this.page.set(1);
    this.oldPaginationNo.set(1);
    this.searchFilter.pageNo = 1;
    this.notifier.sendPaginationNo(this.page());

    const queryParams: { [key: string]: any } = { ...this.checkQueryParamValues() };

    const addQueryParamIfNotEmpty = (
      paramName: string,
      value: any,
      filterKey: keyof ISearchPropertyDetails
    ) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams[paramName] = value;
        (this.searchFilter as any)[filterKey] = value.toString();
      } else {
        delete queryParams[paramName];
        (this.searchFilter as any)[filterKey] = '';
      }
    };

    addQueryParamIfNotEmpty('minArea', this.AreaMin.value, 'minArea');
    addQueryParamIfNotEmpty('maxArea', this.AreaMax.value, 'maxArea');
    addQueryParamIfNotEmpty('size', this.AreaSize.value, 'size');
    addQueryParamIfNotEmpty('minAge', this.AgeMin.value, 'minAge');
    addQueryParamIfNotEmpty('maxAge', this.AgeMax.value, 'maxAge');
    addQueryParamIfNotEmpty('maxPrice', this.PriceMax.value, 'maxPrice');
    addQueryParamIfNotEmpty('minPrice', this.PriceMin.value, 'minPrice');

    const navigationExtras: NavigationExtras = {
      queryParams,
    };
    this.router.navigate(['properties/browse'], navigationExtras);
  }

  onClearAllFilters() {
    this.rangeSearchForm.reset();
    this.locSearchForm.reset();
    this.onClearRangeFilter();
    this.onClearLocationFilter();

    this.panelTypeVisible.set(false);
    this.panelLocationVisible.set(false);
    this.panelStatusVisible.set(false);
    this.panelRangeVisible.set(false);

    this.cities.set([]);
    this.propertyTypes.set([]);
    this.selectedSort.set('default');

    this.searchFilter = {
      searchWithCountry: '',
      searchWithZipcode: [],
      searchWithState: '',
      type: [],
      status: '',
      sortFilter: '',
      minArea: '',
      maxArea: '',
      size: '',
      minPrice: '',
      maxPrice: '',
      city: [],
      minAge: '',
      maxAge: '',
      pageNo: 1,
      limit: 10,
    };

    this.onTableDataChange(1);
    this.router.navigateByUrl('properties');
  }

  onClearLocationFilter() {
    const queryParams: { [key: string]: any } = { ...this.checkQueryParamValues() };

    if (
      (this.Country.value && this.searchFilter.searchWithCountry == this.Country.value) ||
      (this.State.value && this.searchFilter.searchWithState == this.State.value) ||
      (this.cities().length > 0 &&
        JSON.stringify(this.searchFilter.city) == JSON.stringify(this.cities()))
    ) {
      this.locSearchForm.reset();
      this.panelLocationVisible.set(false);
      this.cities.set([]);

      delete queryParams['searchWithCountry'];
      delete queryParams['searchWithState'];
      delete queryParams['city'];

      this.searchFilter.searchWithCountry = '';
      this.searchFilter.searchWithState = '';
      this.searchFilter.city = [];
    } else {
      this.locSearchForm.reset();
      this.cities.set([]);
    }

    const navigationExtras: NavigationExtras = {
      queryParams,
    };
    this.router.navigate(['properties/browse'], navigationExtras);
  }

  onClearRangeFilter() {
    const queryParams: { [key: string]: any } = { ...this.checkQueryParamValues() };

    const hasRangeFilter =
      (this.AreaMin.value && this.searchFilter.minArea == this.AreaMin.value) ||
      (this.AreaMax.value && this.searchFilter.maxArea == this.AreaMax.value) ||
      (this.AreaSize.value && this.searchFilter.size == this.AreaSize.value) ||
      (this.PriceMin.value && this.searchFilter.minPrice == this.PriceMin.value) ||
      (this.PriceMax.value && this.searchFilter.maxPrice == this.PriceMax.value) ||
      (this.AgeMin.value && this.searchFilter.minAge == this.AgeMin.value) ||
      (this.AgeMax.value && this.searchFilter.maxAge == this.AgeMax.value);

    if (hasRangeFilter) {
      this.rangeSearchForm.reset();

      delete queryParams['minArea'];
      delete queryParams['maxArea'];
      delete queryParams['size'];
      delete queryParams['minAge'];
      delete queryParams['maxAge'];
      delete queryParams['minPrice'];
      delete queryParams['maxPrice'];

      this.searchFilter.minArea = '';
      this.searchFilter.maxArea = '';
      this.searchFilter.size = '';
      this.searchFilter.minAge = '';
      this.searchFilter.maxAge = '';
      this.searchFilter.minPrice = '';
      this.searchFilter.maxPrice = '';

      this.panelRangeVisible.set(false);
    }

    const navigationExtras: NavigationExtras = {
      queryParams,
    };
    this.router.navigate(['properties/browse'], navigationExtras);
  }

  // Pagination
  onTableDataChange(page: any) {
    this.page.set(page);
    this.searchFilter.pageNo = this.page();
    this.notifier.sendPaginationNo(page);

    const queryParams = { ...this.route.snapshot.queryParams };
    queryParams['pageNo'] = page;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
    });

    this.scrollToTop();
  }

  // City chips functionality
  addCity(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    this.cityMatchCount.set(this.cities().filter((i) => i == value).length);

    if (value && this.cityMatchCount() == 0) {
      const currentCities = [...this.cities()];
      currentCities.push(value);
      this.cities.set(currentCities);
      this.searchFilter.city = [...this.cities()];
    }

    event.chipInput!.clear();
  }

  removeCity(city: any): void {
    const index = this.cities().indexOf(city);

    if (index >= 0) {
      const currentCities = [...this.cities()];
      currentCities.splice(index, 1);
      this.cities.set(currentCities);
      this.searchFilter.city = [...this.cities()];
      this.announcer.announce(`Removed ${city}`);
    }
  }

  editCity(city: any, event: MatChipEditedEvent) {
    const value = event.value.trim();

    if (!value) {
      this.removeCity(city);
      return;
    }

    const index = this.cities().indexOf(city);
    if (index >= 0) {
      const currentCities = [...this.cities()];
      currentCities[index] = value;
      this.cities.set(currentCities);
      this.searchFilter.city = [...this.cities()];
    }
  }

  // Wishlist functionality - Add this method to ManagePropertyService
  addToFavorites(item: any) {
    const local = localStorage.getItem('isLoggedIn');
    if (local == 'false' || !this.userProfileData()) {
      const url = this.router.url;
      const currentUrlWithQueryParams = url.substring(url.indexOf('properties'));
      localStorage.setItem('routeUrl', currentUrlWithQueryParams);
      this.router.navigate(['/login']);
    } else {
      const wishListData = {
        propertyId: item?.propertyId || item?.id,
      };

      // Add this method to your ManagePropertyService
      this.propertyService.savePropertyToWishList(wishListData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res: any) => {
          if (res?.headers?.statusCode == 200) {
            // this.swalToast.showToast(res?.headers?.message, 'success');
            this.getWishList();
            this.checkFavoriteData(item?.propertyId || item?.id);
            this.spinner.hide();
          } else {
            const errorList = res.errorList;
            const errorMessages = Object.values(errorList).join(', ');
            // this.swalToast.showToast(errorMessages, 'error');
            this.spinner.hide();
          }
        },
        error: (err: any) => {
          const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
          // this.swalToast.showToast(errList, 'error');
          this.spinner.hide();
        },
      });
    }
  }

  removeFromWishList(item: any) {
    if (localStorage.getItem('isLoggedIn') == 'false' || !this.userProfileData()) {
      this.route.url.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((urlSegments) => {
        const currentUrl = urlSegments.map((segment) => segment.path).join('/');
        localStorage.setItem('routeUrl', currentUrl);
        this.router.navigate(['/login']);
      });
    } else {
      const propertyId = item?.propertyId || item?.id;
      // Add this method to your ManagePropertyService
      this.propertyService.deleteWishListProperty(propertyId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res: any) => {
          if (res.headers.statusCode == 200) {
            // this.swalToast.showToast(res.headers.message, 'success');
            this.getWishList();
            this.checkFavoriteData(item?.propertyId || item?.id);
            this.spinner.hide();
          } else {
            // this.swalToast.showToast(res.headers.message, 'error');
          }
        },
        error: (err: any) => {
          const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
          // this.swalToast.showToast(errList, 'error');
          this.spinner.hide();
        },
      });
    }
  }

  checkFavoriteData(data: any) {
    if (localStorage.getItem('AccessToken')) {
      const matchCount = this.wishList().filter(
        (item) => item.propertyId === (data?.propertyId || data?.id)
      ).length;
      this.canAddWishList.set(matchCount > 0);
    }
    return this.canAddWishList();
  }


  // Helper methods
  checkQueryParamValues() {
    const queryParams: { [key: string]: any } = {};
    const searchFilter = this.searchFilter;

    const addQueryParamIfNotEmpty = (paramName: string, value: any) => {
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        value !== 0 &&
        (Array.isArray(value) ? value.length > 0 : true)
      ) {
        queryParams[paramName] = value;
      }
    };

    addQueryParamIfNotEmpty('searchWithCountry', searchFilter.searchWithCountry);
    addQueryParamIfNotEmpty('searchWithState', searchFilter.searchWithState);
    addQueryParamIfNotEmpty('type', searchFilter.type.join(','));
    addQueryParamIfNotEmpty('status', searchFilter.status);
    addQueryParamIfNotEmpty('minArea', searchFilter.minArea);
    addQueryParamIfNotEmpty('maxArea', searchFilter.maxArea);
    addQueryParamIfNotEmpty('size', searchFilter.size);
    addQueryParamIfNotEmpty('minAge', searchFilter.minAge);
    addQueryParamIfNotEmpty('maxAge', searchFilter.maxAge);
    addQueryParamIfNotEmpty('maxPrice', searchFilter.maxPrice);
    addQueryParamIfNotEmpty('minPrice', searchFilter.minPrice);
    addQueryParamIfNotEmpty('sortFilter', searchFilter.sortFilter);
    addQueryParamIfNotEmpty('city', searchFilter.city.join(','));
    addQueryParamIfNotEmpty('pageNo', searchFilter.pageNo);
    addQueryParamIfNotEmpty('limit', searchFilter.limit);

    if (!queryParams['pageNo']) {
      queryParams['pageNo'] = 1;
    }
    if (!queryParams['limit']) {
      queryParams['limit'] = 10;
    }

    return queryParams;
  }

  checkTotalPropertyCountByRoutingUrl() {
    const currentUrl = this.router.url;
    const parts = currentUrl.split('?');

    if (parts.length > 1) {
      const afterQuestionMark = parts[1];
      const queryParams = afterQuestionMark.split('&');

      for (const param of queryParams) {
        const [key, _] = param.split('=');
        if (key !== 'pageNo' && key !== 'limit') {
          this.searchResultsMsg.set('showing based on the search');
          break;
        } else {
          this.searchResultsMsg.set('');
        }
      }
    } else {
      this.searchResultsMsg.set('');
    }

    return currentUrl;
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }

  // New component price range methods
  initializePriceRange() {
    const priceSlider = document.querySelector('.price-range-slider') as HTMLInputElement;
    const priceMinDisplay = document.querySelector('.price-min') as HTMLElement;
    const priceMaxDisplay = document.querySelector('.price-max') as HTMLElement;

    if (priceSlider && priceMinDisplay && priceMaxDisplay) {
      priceSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        this.priceRangeValue.set(value);
        this.updatePriceDisplay(value, priceMinDisplay, priceMaxDisplay);
        this.updateSliderBackground(priceSlider, value);
      });

      this.updatePriceDisplay(this.priceRangeValue(), priceMinDisplay, priceMaxDisplay);
      this.updateSliderBackground(priceSlider, this.priceRangeValue());
    }
  }

  updatePriceDisplay(value?: number, minDisplay?: HTMLElement, maxDisplay?: HTMLElement) {
    // Get elements from DOM if not provided
    const priceMinDisplay = minDisplay || (document.querySelector('.price-min') as HTMLElement);
    const priceMaxDisplay = maxDisplay || (document.querySelector('.price-max') as HTMLElement);

    if (priceMinDisplay && priceMaxDisplay) {
      priceMinDisplay.textContent = this.formatPrice(this.minPrice());
      priceMaxDisplay.textContent = this.formatPrice(value || this.priceRangeValue());
    }
  }

  updateSliderBackground(slider: HTMLInputElement, value: number) {
    const percentage = ((value - this.minPrice()) / (this.maxPrice() - this.minPrice())) * 100;
    slider.style.background = `linear-gradient(to right, #0d6efd 0%, #0d6efd ${percentage}%, #e9ecef ${percentage}%, #e9ecef 100%)`;
  }

  formatPrice(price: number): string {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    } else if (price >= 1000) {
      return `₹${(price / 1000).toFixed(0)}K`;
    } else {
      return `₹${price}`;
    }
  }

  getPriceRange(): { min: number; max: number } {
    return {
      min: this.minPrice(),
      max: this.priceRangeValue(),
    };
  }

  // Carousel methods
  initializeCarousels() {
    const featuredPrev = document.getElementById('featuredPrev');
    const featuredNext = document.getElementById('featuredNext');
    const featuredCarousel = document.getElementById('featuredCarousel') as HTMLElement;

    if (featuredPrev && featuredNext && featuredCarousel) {
      this.setupCarousel(featuredPrev, featuredNext, featuredCarousel);
    }

    const latestPrev = document.getElementById('latestPrev');
    const latestNext = document.getElementById('latestNext');
    const latestCarousel = document.getElementById('latestCarousel') as HTMLElement;

    if (latestPrev && latestNext && latestCarousel) {
      this.setupCarousel(latestPrev, latestNext, latestCarousel);
    }
  }

  setupCarousel(prevBtn: HTMLElement, nextBtn: HTMLElement, carouselTrack: HTMLElement) {
    let currentIndex = 0;
    const cards = carouselTrack.querySelectorAll('.property-card');
    const totalCards = cards.length;

    const getVisibleCards = () => {
      const width = window.innerWidth;
      if (width < 768) return 1;
      if (width < 1200) return 2;
      return 3;
    };

    const getCardWidth = () => {
      const firstCard = cards[0] as HTMLElement;
      if (firstCard) {
        return firstCard.offsetWidth;
      }
      return 300;
    };

    const getGap = () => {
      const width = window.innerWidth;
      if (width < 768) return 15;
      if (width < 1200) return 20;
      return 25;
    };

    const updateButtons = () => {
      const visibleCards = getVisibleCards();
      const maxIndex = Math.max(0, totalCards - visibleCards);

      if (currentIndex <= 0) {
        prevBtn.classList.add('disabled');
      } else {
        prevBtn.classList.remove('disabled');
      }

      if (currentIndex >= maxIndex) {
        nextBtn.classList.add('disabled');
      } else {
        nextBtn.classList.remove('disabled');
      }
    };

    const scroll = (direction: 'next' | 'prev') => {
      const visibleCards = getVisibleCards();
      const maxIndex = Math.max(0, totalCards - visibleCards);
      const cardWidth = getCardWidth();
      const gap = getGap();
      const scrollAmount = cardWidth + gap;

      if (direction === 'next' && currentIndex < maxIndex) {
        currentIndex++;
      } else if (direction === 'prev' && currentIndex > 0) {
        currentIndex--;
      }

      carouselTrack.style.transform = `translateX(-${currentIndex * scrollAmount}px)`;
      updateButtons();
    };

    prevBtn.addEventListener('click', () => scroll('prev'));
    nextBtn.addEventListener('click', () => scroll('next'));

    updateButtons();

    let resizeTimeout: any;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        currentIndex = 0;
        carouselTrack.style.transform = `translateX(0)`;
        updateButtons();
      }, 250);
    });
  }

  @HostListener('window:beforeunload')
  onWindowScroll() {
    this.scrollToTop();
  }

  ngOnDestroy(): void {
    // Cleanup handled automatically by takeUntilDestroyed
  }
}
