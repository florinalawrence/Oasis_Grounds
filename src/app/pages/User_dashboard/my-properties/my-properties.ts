import { 
  Component, 
  OnInit, 
  AfterViewInit, 
  HostListener,
  signal,
  inject,
  DestroyRef
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { NgxPaginationModule } from 'ngx-pagination';
import Swal from 'sweetalert2';
import { RoutePath } from '../../../core/constant/api.constant';
import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../services/Notifier-service/notifier.service';
import { SessionService } from '../../../services/Session-service/session.service';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { IndianNumberPipe } from '../../../shared/pipes/indianNumber.pipe';
import { CurrencyStringPipe } from '../../../shared/pipes/currencyStringConvertor.pipe';
import { Header } from '../../../shared/components/header/header';
import * as currencyData from '../../../../assets/common-currency.json';

interface IsearchMyProperties {
  sortFilter: string;
  pageNo: number | any;
  limit: number | any;
}

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    NgxPaginationModule,
    IndianNumberPipe,
    CurrencyStringPipe,
    Header
  ],
  templateUrl: './my-properties.html',
  styleUrls: ['./my-properties.scss']
})
export class MyProperties implements OnInit, AfterViewInit {
  // Dependency injection
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifier = inject(NotifierService);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly swalToast = inject(ToastService);
  private readonly session = inject(SessionService);
  private readonly service = inject(ManagePropertyService);
  private readonly destroyRef = inject(DestroyRef);

  // Route paths
  routePath = RoutePath;

  // Signals for reactive state
  readonly propertyList = signal<any[]>([]);
  readonly currencyDetails = signal<any[]>([]);
  readonly dataLoaded = signal<boolean>(false);
  readonly totalItems = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly page = signal<number | undefined>(undefined);
  readonly tableSize = signal<number>(10);
  readonly sortFilterValue = signal<any>('');
  readonly searchResultsCount = signal<number>(0);
  readonly searchResultsMsg = signal<any>('');
  readonly oldPaginationNo = signal<number>(1);
  readonly propertyId = signal<any>(null);

  // Search filter object
  searchFilter: IsearchMyProperties = {
    sortFilter: '',
    pageNo: 1,
    limit: 10
  };

  constructor() {
    this.subscribeToPaginationChanges();
  }

  /**
   * Subscribe to pagination number changes from notifier service
   * Matches old code exactly
   */
  private subscribeToPaginationChanges(): void {
    this.notifier.paginationNo$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
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
  }

  /**
   * Scroll to top of the page
   * Matches old code exactly
   */
  @HostListener('window:beforeunload', [])
  onWindowScroll(): void {
    this.scrollToTop();
  }

  scrollToTop(): void {
    window.scrollTo(0, 0);
  }

  ngOnInit(): void {
    // Load currency data - matches old code
    this.currencyDetails.set(Object.values(currencyData).map(x => x));
    
    // Get routing parameters
    this.getRoutingParams();
  }

  ngAfterViewInit(): void {
    // Additional initialization if needed
  }

  /**
   * Navigate to home page
   * Matches old code exactly
   */
  gotoHomePage(): void {
    this.router.navigateByUrl(this.routePath.HOME);
  }

  /**
   * Show rejection reason in popup
   * Matches old code exactly
   */
  showReason(item: any): void {
    Swal.fire({
      title: '<span style="font-size: 15px; text-align:left;padding:0px;margin:0px;">Regrettably!, we are unable to approve this property due to below reason</span>',
      html: '<div style="font-size: 14px;padding:0;margin:0;">' + (item?.rejectedReason ? item?.rejectedReason : '') + '</div>',
      icon: 'info',
      confirmButtonText: 'OK'
    });
  }

  /**
   * Check total property count and update message
   * Matches old code exactly
   */
  checkTotalPropertyCountByRoutingUrl(): string {
    const currentUrl = this.router.url;
    const parts = currentUrl.split('?');
    
    if (parts.length > 1 && this.sortFilterValue() !== '') {
      this.searchResultsMsg.set('showing based on the search');
    } else {
      this.searchResultsMsg.set('');
    }
    
    return currentUrl;
  }

  /**
   * Add query param if not empty
   * Matches old code exactly
   */
  addQueryParamIfNotEmpty(
    queryParams: { [key: string]: any }, 
    paramName: string, 
    value: any
  ): void {
    if (value !== null && value !== undefined && value !== '') {
      queryParams[paramName] = value;
    }
  }

  /**
   * Check and prepare query parameters
   * Matches old code exactly
   */
  checkQueryParamValues(): { [key: string]: any } {
    const queryParams: { [key: string]: any } = {};
    const searchFilter = this.searchFilter;
    
    this.addQueryParamIfNotEmpty(queryParams, 'sortFilter', searchFilter.sortFilter);
    this.addQueryParamIfNotEmpty(queryParams, 'pageNo', searchFilter.pageNo);
    this.addQueryParamIfNotEmpty(queryParams, 'limit', searchFilter.limit);

    // Optional fallback values for 'pageNo' and 'limit' if they are empty
    if (!queryParams['pageNo']) {
      queryParams['pageNo'] = 1;
    }
    if (!queryParams['limit']) {
      queryParams['limit'] = 10;
    }
    
    return queryParams;
  }

  /**
   * Handle status filter selection
   * Matches old code exactly
   */
  onSelectStatusFilter(event: any): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    
    this.notifier.sendPaginationNo(1);
    const queryParams: { [key: string]: any } = { ...this.checkQueryParamValues() };

    // If empty value, clear filters
    if (selectedValue === '') {
      queryParams['sortFilter'] = selectedValue;
      this.onClearAllFilters();
      return;
    }

    if (selectedValue && this.searchFilter.sortFilter !== selectedValue) {
      queryParams['sortFilter'] = selectedValue;
    } else {
      delete queryParams['sortFilter'];
    }

    this.router.navigate(['/profile/my-properties'], { queryParams });
  }

  /**
   * Clear all filters
   * Matches old code exactly
   */
  onClearAllFilters(): void {
    this.searchFilter = {
      sortFilter: '',
      pageNo: 1,
      limit: 10
    };
    this.onTableDataChange(1);
    this.sortFilterValue.set('');
    this.searchResultsMsg.set('');
  }

  /**
   * Fetch property details from API with proper authentication
   */
  getPropertyDetails(): void {
    if (this.searchFilter) {
      this.sortFilterValue.set(this.searchFilter.sortFilter ? this.searchFilter.sortFilter : '');
    }

    // Check authentication before making API call
    const token = this.session.getToken();
    if (!token) {
      console.warn('⚠️ No authentication token found for my-properties');
      this.swalToast.showToast('Please login to view your properties', 'error');
      this.router.navigate([this.routePath.LOGIN]);
      return;
    }

    this.spinner.show();

    setTimeout(() => {
      // Use authenticated getPropertyDetails method with search filter data
      const data = {
        sortFilter: this.searchFilter.sortFilter,
        pageNo: this.searchFilter.pageNo,
        limit: this.tableSize()
      };
      
      this.service.getPropertyDetails(data).subscribe({
        next: (res: any) => {
          console.log('📥 My Properties API Response:', res);
          
          // Handle different response structures
          const properties = res.data || res || [];
          this.propertyList.set(properties);
          this.dataLoaded.set(true);
          
          const totalRecords = res.totalrecords || properties.length || 0;
          this.totalItems.set(totalRecords);
          this.searchResultsCount.set(totalRecords);
          
          const recordLimit = res.recordlimit || 10;
          this.tableSize.set(recordLimit);
          this.totalPages.set(Math.ceil(totalRecords / recordLimit));
          
          this.checkTotalPropertyCountByRoutingUrl();
          this.spinner.hide();
        },
        error: (err: any) => {
          console.error('❌ My Properties API Error:', err);
          console.error('❌ Error Status:', err.status);
          console.error('❌ Error Response:', err.error);
          
          if (err.status === 401) {
            this.swalToast.showToast('Session expired. Please login again.', 'error');
            this.session.removeCredentials();
            this.router.navigate([this.routePath.LOGIN]);
          } else {
            const errorMessage = err.error?.headers?.message || err.message || 'Failed to load properties';
            this.swalToast.showToast(errorMessage, 'error');
          }
          this.spinner.hide();
        }
      });
    }, 500);
  }

  /**
   * Get routing parameters and load properties
   * Matches old code exactly
   */
  getRoutingParams(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryParams) => {
        if (queryParams.get('pageNo')) {
          const pageNo: any = queryParams.get('pageNo');
          this.page.set(pageNo);
          
          this.searchFilter = {
            sortFilter: queryParams.get('sortFilter') || '',
            pageNo: this.page() ? this.page() : (this.oldPaginationNo() !== 0 && this.oldPaginationNo()) ? this.oldPaginationNo() : queryParams.get('pageNo') ? queryParams.get('pageNo') : 1,
            limit: queryParams.get('limit') || 10
          };
          
          this.getPropertyDetails();
        } else {
          if (this.oldPaginationNo() !== 0 && this.oldPaginationNo()) {
            this.searchFilter.pageNo = this.oldPaginationNo();
            this.page.set(this.oldPaginationNo());
          }
          this.getPropertyDetails();
        }
      });
  }

  /**
   * Navigate to property detail view
   * Matches old code exactly
   */
  gotoViewDetail(item: any): void {
    this.router.navigateByUrl(this.routePath.MYPROPERTIES_VIEW_URL + item.id);
  }

  /**
   * Add to wish list (placeholder from old code)
   */
  addtoWishList(index: number, item: any): void {
    // Empty method from old code
  }

  /**
   * Edit property
   * Matches old code exactly
   */
  onEditProperty(item: any): void {
    this.router.navigate([this.routePath.EDIT_PROPERTY], { 
      queryParams: { id: item.id } 
    });
    this.scrollToTop();
  }

  /**
   * Delete property with confirmation
   * Matches old code exactly
   */
  onDeleteProperty(item: any): void {
    Swal.fire({
      title: 'Are you sure want to remove this property?',
      text: 'You will not be able to recover this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      showCloseButton: false
    }).then((result) => {
      if (result.isConfirmed) {
        const propertyId = item.id;
        
        this.service.deletePropertyById(propertyId).subscribe({
          next: res => {
            if (res.headers.statusCode == 200) {
              this.swalToast.showToast(res.headers.message, 'success');
              this.spinner.hide();
              
              setTimeout(() => {
                this.getPropertyDetails();
              }, 500);
            } else {
              this.swalToast.showToast(res.headers.message, 'error');
            }
          },
          error: (err) => {
            const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
            this.swalToast.showToast(errList, 'error');
            this.spinner.hide();
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        this.swalToast.showToast('Your image is safe.', 'info');
      }
    });
  }

  /**
   * Handle pagination change
   * Matches old code exactly
   */
  onTableDataChange(page: any): void {
    this.page.set(page);
    this.searchFilter.pageNo = page;
    
    const currentUrl = this.router.url;
    const parts = currentUrl.split('?');
    
    this.notifier.sendPaginationNo(page);
    
    const queryParams = { ...this.route.snapshot.queryParams };
    queryParams['pageNo'] = page;
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    });
    
    this.scrollToTop();
  }
}

