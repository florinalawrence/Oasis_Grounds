import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Meta, Title } from '@angular/platform-browser';
import { of } from 'rxjs';

import { Properties } from './properties';
import { ManagePropertyService } from '../../../services/manage-property.service';
import { NotifierService } from '../../../services/notifier.service';
import { SessionService } from '../../../services/session.service';
import { ToastService } from '../../../services/toast.service';
import { UserProfilesService } from '../../../services/user-profile.service';

describe('Properties', () => {
  let component: Properties;
  let fixture: ComponentFixture<Properties>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockManagePropertyService: jasmine.SpyObj<ManagePropertyService>;
  let mockNotifierService: jasmine.SpyObj<NotifierService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockUserProfileService: jasmine.SpyObj<UserProfilesService>;
  let mockSpinnerService: jasmine.SpyObj<NgxSpinnerService>;
  let mockMeta: jasmine.SpyObj<Meta>;
  let mockTitle: jasmine.SpyObj<Title>;

  const mockProperty = {
    id: '1',
    title: 'Test Property',
    status: 'Sell' as const,
    propertyOwnerShip: 'Jmr Owned Property',
    featuredImage: 'test-image.jpg',
    bedRooms: 3,
    type: 'Apartment',
    price: 5000000,
    currency: 'INR',
    area: 1200,
    size: 'sq ft',
    listPropertyAs: 'Owner',
    addressInfo: {
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    availability: {
      readyToMove: true
    }
  };

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    const managePropertySpy = jasmine.createSpyObj('ManagePropertyService', ['getPropertyDetailsByFilter', 'getCurrencyData', 'getCountryCodes']);
    const notifierSpy = jasmine.createSpyObj('NotifierService', ['notifyUserData'], { userProfileData$: of({}) });
    const sessionSpy = jasmine.createSpyObj('SessionService', ['getToken']);
    const toastSpy = jasmine.createSpyObj('ToastService', ['showToast']);
    const userProfileSpy = jasmine.createSpyObj('UserProfilesService', ['loadUserProfile']);
    const spinnerSpy = jasmine.createSpyObj('NgxSpinnerService', ['show', 'hide']);
    const metaSpy = jasmine.createSpyObj('Meta', ['updateTag']);
    const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);

    // Mock service returns
    managePropertySpy.getCurrencyData.and.returnValue([
      { code: 'INR', symbol: '₹' },
      { code: 'USD', symbol: '$' }
    ]);
    managePropertySpy.getCountryCodes.and.returnValue([
      { name: 'India', code: 'IN' },
      { name: 'United States', code: 'US' }
    ]);
    managePropertySpy.getPropertyDetailsByFilter.and.returnValue(of({
      data: [mockProperty],
      totalrecords: 1,
      recordlimit: 10
    }));
    sessionSpy.getToken.and.returnValue(null);
    userProfileSpy.loadUserProfile.and.returnValue(of({ recordInfo: {} }));

    await TestBed.configureTestingModule({
      imports: [Properties, ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
        { provide: ManagePropertyService, useValue: managePropertySpy },
        { provide: NotifierService, useValue: notifierSpy },
        { provide: SessionService, useValue: sessionSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: UserProfilesService, useValue: userProfileSpy },
        { provide: NgxSpinnerService, useValue: spinnerSpy },
        { provide: Meta, useValue: metaSpy },
        { provide: Title, useValue: titleSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Properties);
    component = fixture.componentInstance;
    
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockManagePropertyService = TestBed.inject(ManagePropertyService) as jasmine.SpyObj<ManagePropertyService>;
    mockNotifierService = TestBed.inject(NotifierService) as jasmine.SpyObj<NotifierService>;
    mockSessionService = TestBed.inject(SessionService) as jasmine.SpyObj<SessionService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockUserProfileService = TestBed.inject(UserProfilesService) as jasmine.SpyObj<UserProfilesService>;
    mockSpinnerService = TestBed.inject(NgxSpinnerService) as jasmine.SpyObj<NgxSpinnerService>;
    mockMeta = TestBed.inject(Meta) as jasmine.SpyObj<Meta>;
    mockTitle = TestBed.inject(Title) as jasmine.SpyObj<Title>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct data', () => {
    expect(component.isInitialized()).toBe(true);
    expect(component.currencyDetails().length).toBe(2);
    expect(component.countryCodes().length).toBe(2);
    expect(component.bannerList().length).toBe(3);
  });

  it('should setup page metadata on init', () => {
    expect(mockTitle.setTitle).toHaveBeenCalledWith('Properties - JMR Real Estate | Premium Properties for Sale & Rent');
    expect(mockMeta.updateTag).toHaveBeenCalledTimes(6);
  });

  it('should create search form with correct controls', () => {
    const form = component.searchFilterForm();
    expect(form.get('country')).toBeDefined();
    expect(form.get('propertyType')).toBeDefined();
    expect(form.get('status')).toBeDefined();
  });

  it('should load properties on init', () => {
    expect(mockManagePropertyService.getPropertyDetailsByFilter).toHaveBeenCalled();
    expect(component.propertyList().length).toBe(1);
    expect(component.jmrPropertyList().length).toBe(1);
  });

  it('should compute featured and latest properties correctly', () => {
    expect(component.hasFeaturedProperties()).toBe(true);
    expect(component.hasLatestProperties()).toBe(true);
    expect(component.totalFeaturedProperties()).toBe(1);
    expect(component.totalLatestProperties()).toBe(1);
  });

  it('should handle property navigation', () => {
    component.gotoViewDetail(mockProperty);
    expect(mockRouter.navigateByUrl).toHaveBeenCalled();
  });

  it('should format property data correctly', () => {
    expect(component.getPropertyStatusText(mockProperty)).toBe('For Sale');
    expect(component.getPropertyStatusClass(mockProperty)).toBe('for-sale');
    expect(component.isFeaturedProperty(mockProperty)).toBe(true);
    expect(component.getBHKText(mockProperty)).toBe('3 BHK Apartment');
    expect(component.getAvailabilityText(mockProperty)).toBe('Ready To Move');
    expect(component.getLocationText(mockProperty)).toBe('Mumbai, Maharashtra, India');
  });

  it('should handle form changes', () => {
    spyOn(console, 'log');
    
    const typeEvent = { target: { value: 'Apartment' } } as any;
    component.onChangePropertyType(typeEvent);
    expect(component.PropertyType.value).toBe('Apartment');
    
    const statusEvent = { target: { value: 'Sell' } } as any;
    component.onChangeStatus(statusEvent);
    expect(component.Status.value).toBe('Sell');
  });

  it('should handle search operations', () => {
    component.onSearchByCity('Mumbai');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['properties/browse'], {
      queryParams: { city: 'Mumbai', pageNo: 1, limit: 10 }
    });

    component.onSearchByCountry('India');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['properties/browse'], {
      queryParams: { searchWithCountry: 'India', pageNo: 1, limit: 10 }
    });
  });

  it('should handle carousel operations', () => {
    component.setupCarousel();
    
    const initialState = component.carouselState();
    expect(initialState.featuredCurrentSlide).toBe(0);
    expect(initialState.latestCurrentSlide).toBe(0);
  });

  it('should handle favorite toggle', () => {
    const testProperty = { ...mockProperty };
    component.toggleFavorite(testProperty);
    expect(testProperty.isFavorite).toBe(true);
    
    component.toggleFavorite(testProperty);
    expect(testProperty.isFavorite).toBe(false);
  });

  it('should handle image errors', () => {
    const mockEvent = {
      target: { src: '' }
    } as any;
    
    component.onImageError(mockEvent);
    expect(mockEvent.target.src).toBe('assets/images/no_image.png');
  });

  it('should calculate bathroom count correctly', () => {
    const propertyWithBaths = {
      ...mockProperty,
      bedroomInfo: [
        { specification: 'Master Bedroom with Bathroom' },
        { specification: 'Guest Bathroom' },
        { specification: 'Living Room' }
      ]
    };
    
    const bathCount = component.calculateBathCount(propertyWithBaths);
    expect(bathCount).toBe(2);
  });

  it('should handle empty search validation', () => {
    component.onSearchByCity('');
    expect(mockToastService.showToast).toHaveBeenCalledWith('Please enter a valid city name', 'warning');
    
    component.onSearchByCountry('');
    expect(mockToastService.showToast).toHaveBeenCalledWith('Please select a valid country', 'warning');
  });

  it('should compute scroll capabilities correctly', () => {
    // With 1 property, should not be able to scroll
    expect(component.canScrollFeatured()).toBe(false);
    expect(component.canScrollLatest()).toBe(false);
  });

  it('should handle property card clicks', () => {
    spyOn(console, 'log');
    component.onPropertyCardClick(mockProperty);
    expect(console.log).toHaveBeenCalledWith('Property card clicked:', mockProperty.id);
  });
});
