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
import { LoaderService } from '../../../services/loader.service';
import { NgxPaginationModule } from 'ngx-pagination';
import Swal from 'sweetalert2';
import { RoutePath } from '../../../core/constant/api.constant';
import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../services/Notifier-service/notifier.service';
import { SessionService } from '../../../services/Session-service/session.service';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { ConfirmationDialogService } from '../../../services/Confirmation-service/confirmation-dialog.service';
import { IndianNumberPipe } from '../../../shared/pipes/indianNumber.pipe';
import { CurrencyStringPipe } from '../../../shared/pipes/currencyStringConvertor.pipe';

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
    
    NgxPaginationModule,
    IndianNumberPipe,
    CurrencyStringPipe
  ],
  templateUrl: './my-properties.html',
  styleUrls: ['./my-properties.scss']
})
export class MyProperties implements OnInit, AfterViewInit {

  
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifier = inject(NotifierService);
  private readonly loader = inject(LoaderService);
  private readonly swalToast = inject(ToastService);
  private readonly session = inject(SessionService);
  private readonly service = inject(ManagePropertyService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly destroyRef = inject(DestroyRef);


  
  routePath = RoutePath;

  
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

 
  
  searchFilter: IsearchMyProperties = {
    sortFilter: '',
    pageNo: 1,
    limit: 10
  };

  constructor() {
    this.subscribeToPaginationChanges();
  }

 
  
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

  
  
  @HostListener('window:beforeunload', [])
  onWindowScroll(): void {
    this.scrollToTop();
  }

  scrollToTop(): void {
    window.scrollTo(0, 0);
  }

  ngOnInit(): void {
   
    
    this.currencyDetails.set(Object.values(currencyData).map(x => x));
    
    
    
    this.getRoutingParams();
  }

  ngAfterViewInit(): void {
  
    
  }

 
  gotoHomePage(): void {
    this.router.navigateByUrl(this.routePath.HOME);
  }


  
  showReason(item: any): void {
    Swal.fire({
      title: '<span style="font-size: 15px; text-align:left;padding:0px;margin:0px;">Regrettably!, we are unable to approve this property due to below reason</span>',
      html: '<div style="font-size: 14px;padding:0;margin:0;">' + (item?.rejectedReason ? item?.rejectedReason : '') + '</div>',
      icon: 'info',
      confirmButtonText: 'OK'
    });
  }


  
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

 
  
  addQueryParamIfNotEmpty(
    queryParams: { [key: string]: any }, 
    paramName: string, 
    value: any
  ): void {
    if (value !== null && value !== undefined && value !== '') {
      queryParams[paramName] = value;
    }
  }


  
  checkQueryParamValues(): { [key: string]: any } {
    const queryParams: { [key: string]: any } = {};
    const searchFilter = this.searchFilter;
    
    this.addQueryParamIfNotEmpty(queryParams, 'sortFilter', searchFilter.sortFilter);
    this.addQueryParamIfNotEmpty(queryParams, 'pageNo', searchFilter.pageNo);
    this.addQueryParamIfNotEmpty(queryParams, 'limit', searchFilter.limit);

    if (!queryParams['pageNo']) {
      queryParams['pageNo'] = 1;
    }
    if (!queryParams['limit']) {
      queryParams['limit'] = 10;
    }
    
    return queryParams;
  }


  
  onSelectStatusFilter(event: any): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    
    this.searchFilter.sortFilter = selectedValue;
    this.searchFilter.pageNo = 1; 
    
    this.sortFilterValue.set(selectedValue);
    
   
    
    this.notifier.sendPaginationNo(1);
    this.page.set(1);
    
    
    const queryParams: { [key: string]: any } = {
      pageNo: 1,
      limit: this.tableSize()
    };
    
    if (selectedValue && selectedValue !== '') {
      queryParams['sortFilter'] = selectedValue;
    }
    
   
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'replace'
    });
    

    this.getPropertyDetails();
  }


  
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

  
  getPropertyDetails(): void {
    if (this.searchFilter) {
      this.sortFilterValue.set(this.searchFilter.sortFilter ? this.searchFilter.sortFilter : '');
    }


    const token = this.session.getToken();
    if (!token) {
      console.warn('⚠️ No authentication token found for my-properties');
      this.swalToast.showToast('Please login to view your properties', 'error');
      this.router.navigate([this.routePath.LOGIN]);
      return;
    }

    this.loader.show();

    setTimeout(() => {
      const data = {
        sortFilter: this.searchFilter.sortFilter,
        pageNo: this.searchFilter.pageNo,
        limit: this.tableSize()
      };
      
      this.service.getPropertyDetails(data).subscribe({
        next: (res: any) => {
          
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
          this.loader.hide();
        },
        error: (err: any) => {
       
          
          
          if (err.status === 401) {
            this.swalToast.showToast('Session expired. Please login again.', 'error');
            this.session.removeCredentials();
            this.router.navigate([this.routePath.LOGIN]);
          } else {
            const errorMessage = err.error?.headers?.message || err.message || 'Failed to load properties';
            this.swalToast.showToast(errorMessage, 'error');
          }
          this.loader.hide();
        }
      });
    }, 500);
  }


  
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


  
  gotoViewDetail(item: any): void {
    if (item?.id) {
      this.router.navigate(['/details', item.id], {
        queryParams: { source: 'my-properties' }
      });
    } else {
      console.error('Property ID not found:', item);
      this.swalToast.showToast('Property ID not found', 'error');
    }
  }


  
  addtoWishList(index: number, item: any): void {
   
    
  }


  
  onEditProperty(item: any): void {
    this.router.navigate([this.routePath.EDIT_PROPERTY], { 
      queryParams: { id: item.id } 
    });
    this.scrollToTop();
  }


  
  async onDeleteProperty(item: any): Promise<void> {
    try {
      const confirmed = await this.confirmationDialog.confirmDelete('property');
      
      if (confirmed) {
        const propertyId = item?.id;
        
        if (!propertyId) {
          this.swalToast.showToast('Property ID not found', 'error');
          return;
        }
        
        this.loader.show();
        
        this.service.deletePropertyById(propertyId).subscribe({
          next: (res) => {
            console.log('Delete response:', res);
            
            const statusCode = res?.headers?.statusCode || res?.statusCode;
            const message = res?.headers?.message || res?.message || 'Property deleted successfully';
            
            if (statusCode === 200 || statusCode === '200') {
              this.swalToast.showToast(message, 'success');
              
              setTimeout(() => {
                this.getPropertyDetails();
              }, 500);
            } else {
              this.swalToast.showToast(message || 'Failed to delete property', 'error');
            }
            
            this.loader.hide();
          },
          error: (err) => {
            
            let errorMessage = 'Failed to delete property';
            
            if (err?.error?.message) {
              errorMessage = err.error.message;
            } else if (err?.message) {
              errorMessage = err.message;
            } else if (typeof err === 'string') {
              errorMessage = err;
            }
            
            this.swalToast.showToast(errorMessage, 'error');
            this.loader.hide();
          }
        });
      }
    } catch (error) {
      this.swalToast.showToast('Error showing confirmation dialog', 'error');
    }
  }


  
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

