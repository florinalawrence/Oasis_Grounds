import { Component, OnInit, AfterViewInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../services/Notifier-service/notifier.service';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { RoutePath } from '../../../core/constant/api.constant';
import { CurrencyStringPipe } from '../../../shared/pipes/currencyStringConvertor.pipe';
import { IndianNumberPipe } from '../../../shared/pipes/indianNumber.pipe';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TitleCasePipe,
    DatePipe,
    CurrencyStringPipe,
    IndianNumberPipe
  ],
  templateUrl: './properties.html',
  styleUrls: ['./properties.scss']
})
export class Properties implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly service = inject(ManagePropertyService);
  private readonly notifier = inject(NotifierService);
  private readonly swalToast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // Convert to signals
  jmrPropertyList = signal<any[]>([]);
  propertyList = signal<any[]>([]);
  currencyDetails = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  searchFilterForm: FormGroup;

  constructor() {
    this.searchFilterForm = this.fb.group({
      country: new FormControl(''),
      propertyType: new FormControl(''),
      status: new FormControl(''),
    });
  }

  ngOnInit(): void {
    this.currencyDetails.set(this.service.getCurrencyData());
    this.getPropertyDetails();
  }

  ngAfterViewInit(): void {
   
  }

  // Method to fetch properties
  getPropertyDetails() {
    this.isLoading.set(true);
    this.spinner.show();
    this.service.getPropertyDetailsByFilter({
      searchWithCountry: "",
      type: [],
      sortFilter: "",
      status: "",
      pageNo: 1,
      limit: 100,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        const jmrProperties = res?.data.filter((item: any) => item.propertyOwnerShip == 'Jmr Owned Property');
        this.jmrPropertyList.set(jmrProperties);
        this.propertyList.set(res?.data);
        this.isLoading.set(false);
        this.spinner.hide();
      },
      error: err => {
        this.swalToast.showToast(err, 'error');
        this.isLoading.set(false);
        this.spinner.hide();
      }
    });
  }

  // For the "Featured" properties
  hasFeaturedProperties(): boolean {
    return this.jmrPropertyList() && this.jmrPropertyList().length > 0;
  }

  // For the "Latest" properties
  hasLatestProperties(): boolean {
    return this.propertyList() && this.propertyList().length > 0;
  }

  // Check if featured properties can scroll (more than 3 items)
  canScrollFeatured(): boolean {
    return this.jmrPropertyList().length > 3;
  }

  // Check if latest properties can scroll (more than 3 items)
  canScrollLatest(): boolean {
    return this.propertyList().length > 3;
  }

  // Method to navigate to property details page
  gotoViewDetail(item: any) {
    if (item?.id) {
      this.router.navigate(['/details', item.id], {
        queryParams: { source: 'home' }
      });
    }
  }

  // Handle image error (fallback image)
  onImageError(event: any) {
    event.target.src = 'assets/images/no_image.png';
  }

  // Handle search by city
  onSearchByCity(cityValue: any) {
    this.router.navigate(['properties/browse'], {
      queryParams: { city: cityValue, pageNo: 1, limit: 10 },
    });
  }

  // Handle search by country
  onSearchByCountry(cityValue: any) {
    this.router.navigate(['properties/browse'], {
      queryParams: { searchWithCountry: cityValue, pageNo: 1, limit: 10 },
    });
  }

  // Submit search form data
  onSubmitSearchData() {
    this.router.navigate(['properties/browse'], {
      queryParams: {
        searchWithCountry: this.searchFilterForm.value.country,
        type: this.searchFilterForm.value.propertyType,
        status: this.searchFilterForm.value.status,
        pageNo: 1,
        limit: 10,
      },
    });
  }
}