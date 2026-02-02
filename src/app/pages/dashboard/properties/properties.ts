import { Component, OnInit, AfterViewInit, signal } from '@angular/core';

import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ManagePropertyService } from '../../../services/ManageProperty-service/manage-property.service';
import { NotifierService } from '../../../services/Notifier-service/notifier.service';
import { ToastService } from '../../../services/Toast-service/toast.service';
import { Subscription } from 'rxjs';

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
    IndianNumberPipe,
  ],
  templateUrl: './properties.html',
  styleUrls: ['./properties.scss'],
})
export class Properties implements OnInit, AfterViewInit {
  // Convert to signals
  jmrPropertyList = signal<any[]>([]);
  propertyList = signal<any[]>([]);
  currencyDetails = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  searchFilterForm: FormGroup;
  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private router: Router,

    private service: ManagePropertyService,
    private notifier: NotifierService,
    private swalToast: ToastService,
  ) {
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

  ngAfterViewInit(): void {}

  // Method to fetch properties
  getPropertyDetails() {
    this.isLoading.set(true);

    this.service
      .getPropertyDetailsByFilter({
        searchWithCountry: '',
        type: [],
        sortFilter: '',
        status: '',
        pageNo: 1,
        limit: 100,
      })
      .subscribe({
        next: (res) => {
          const jmrProperties = res?.data.filter(
            (item: any) => item.propertyOwnerShip == 'Jmr Owned Property',
          );
          this.jmrPropertyList.set(jmrProperties);
          this.propertyList.set(res?.data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.swalToast.showToast(err, 'error');
          this.isLoading.set(false);
        },
      });
  }

  hasFeaturedProperties(): boolean {
    return this.jmrPropertyList() && this.jmrPropertyList().length > 0;
  }

  hasLatestProperties(): boolean {
    return this.propertyList() && this.propertyList().length > 0;
  }

  canScrollFeatured(): boolean {
    return this.jmrPropertyList().length > 3;
  }

  canScrollLatest(): boolean {
    return this.propertyList().length > 3;
  }

  gotoViewDetail(item: any) {
    if (item?.id) {
      this.router.navigate(['/details', item.id], {
        queryParams: { source: 'home' },
      });
    }
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/no_image.png';
  }

  onSearchByCity(cityValue: any) {
    this.router.navigate(['properties/browse'], {
      queryParams: { city: cityValue, pageNo: 1, limit: 10 },
    });
  }

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
