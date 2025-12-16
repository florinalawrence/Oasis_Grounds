import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { RoutePath } from '../../../core/constant/api.constant';
import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../services/Notifier-service/notifier.service';
import { SessionService } from '../../../services/Session-service/session.service';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { IndianNumberPipe } from '../../../shared/pipes/indianNumber.pipe';
import Swal from 'sweetalert2';
import * as currencyData from '../../../../assets/common-currency.json';
import { CommonModule } from '@angular/common';
import { CurrencyStringPipe } from '../../../shared/pipes/currencyStringConvertor.pipe';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-my-favourites',
  templateUrl: './my-favourites.html',
  styleUrls: ['./my-favourites.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgxSpinnerModule,
    NgxPaginationModule,
    IndianNumberPipe,
    CurrencyStringPipe
  ]
})
export class MyFavourites implements OnInit {
  routePath = RoutePath;
  propertyWishList: any[] = [];
  currencyDetails: any[] = [];
  totalItems: number = 0;
  totalPages: number = 0;
  page: number = 1;
  tableSize: number = 6;
  count: number = 0;
  bathroomsCount: number = 0;
  bathCount: number = 0;
  propertyId: any;

  constructor(
    private router: Router,
    private notifier: NotifierService,
    private spinner: NgxSpinnerService,
    private swalToast: ToastService,
    private session: SessionService,
    private service: ManagePropertyService
  ) {}

  @HostListener('window:beforeunload')
  onWindowScroll() {
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo(0, 0);
  }

  gotoHomePage() {
    this.router.navigateByUrl(this.routePath.HOME);
  }

  ngOnInit(): void {
    this.currencyDetails = Object.values(currencyData).map(x => x);
    this.getPropertyDetails();
  }

  getPropertyDetails() {
    this.spinner.show();
    this.service.getWishlistData().subscribe({
      next: (res: any) => {
        this.propertyWishList = res?.data || [];
        this.count = this.propertyWishList.length;
        this.spinner.hide();
      },
      error: (err: any) => {
        const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
        this.swalToast.showToast(errList, 'error');
        this.spinner.hide();
      }
    });
  }

  calculateBathCount(item: any): number {
    this.bathCount = item.bedroomInfo?.filter((data: any) => 
      data?.specification?.includes("Bathroom")
    )?.length || 0;
    return this.bathCount;
  }

  gotoViewDetail(item: any): void {
    this.router.navigateByUrl(this.routePath.PUBLISHED_PROPERTY_VIEW_URL + item.propertyId);
  }

  onEditProperty(item: any): void {
    this.router.navigate([this.routePath.EDIT_PROPERTY], { 
      queryParams: { id: item.id } 
    });
    this.scrollToTop();
  }

  removeFromWishList(item: any): void {
    Swal.fire({
      title: 'Are you sure want to remove this property from WishList?',
      text: 'You will not be able to see this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'No, keep it',
      showCloseButton: false
    }).then((result) => {
      if (result.isConfirmed) {
        const propertyId = item.propertyId;
        this.spinner.show();
        this.service.deleteWishListProperty(propertyId).subscribe({
          next: (res: any) => {
            if (res.headers?.statusCode == 200) {
              this.swalToast.showToast(res.headers.message, 'success');
              this.propertyWishList = this.propertyWishList.filter(
                wishItem => wishItem.propertyId !== propertyId
              );
              this.count = this.propertyWishList.length;
              this.spinner.hide();
            } else {
              this.swalToast.showToast(res.headers?.message || 'Error removing property', 'error');
              this.spinner.hide();
            }
          },
          error: (err: any) => {
            const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
            this.swalToast.showToast(errList, 'error');
            this.spinner.hide();
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        this.swalToast.showToast('Your wishlist data is safe.', 'info');
      }
    });
  }

  onTableDataChange(page: any): void {
    this.page = page;
    this.scrollToTop();
  }

  getCurrencySymbol(currencyCode: string): string {
    const currency = this.currencyDetails.find(c => c.code === currencyCode);
    return currency?.symbol || '₹';
  }

  formatPrice(item: any): string {
    if (!item?.price) return '';
    
    const currency = this.currencyDetails.find(c => c.code === item?.currency);
    const symbol = currency?.symbol || '₹';
    
    if (item?.currency === 'INR') {
      return item.price;
    } else {
      return item.price;
    }
  }
}