import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { Meta, Title } from '@angular/platform-browser';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { of } from 'rxjs';

import { AllProperty } from './all-property';
import { ManagePropertyService } from '../../services/manage-property.service';
import { ToastService } from '../../services/toast.service';
import { SessionService } from '../../services/session.service';
import { NotifierService } from '../../services/notifier.service';

describe('AllProperty', () => {
  let component: AllProperty;
  let fixture: ComponentFixture<AllProperty>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockPropertyService: jasmine.SpyObj<ManagePropertyService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockNotifierService: jasmine.SpyObj<NotifierService>;
  let mockSpinnerService: jasmine.SpyObj<NgxSpinnerService>;
  let mockMeta: jasmine.SpyObj<Meta>;
  let mockTitle: jasmine.SpyObj<Title>;
  let mockAnnouncer: jasmine.SpyObj<LiveAnnouncer>;

  beforeEach(async () => {
    // Create spies for all injected services
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    mockRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      queryParamMap: of(new Map()),
      queryParams: of({}),
      url: of([]),
      snapshot: { queryParams: {} }
    });
    mockPropertyService = jasmine.createSpyObj('ManagePropertyService', [
      'getCountryCodes', 'getStates', 'getCurrencyData', 'getRandomPropertyData', 
      'getPropertyDetailsByFilter', 'savePropertyToWishList', 'deleteWishListProperty'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['showToast']);
    mockSessionService = jasmine.createSpyObj('SessionService', ['getToken']);
    mockNotifierService = jasmine.createSpyObj('NotifierService', ['sendPaginationNo'], {
      userProfileData$: of(false),
      paginationNo$: of(1)
    });
    mockSpinnerService = jasmine.createSpyObj('NgxSpinnerService', ['show', 'hide']);
    mockMeta = jasmine.createSpyObj('Meta', ['updateTag']);
    mockTitle = jasmine.createSpyObj('Title', ['setTitle']);
    mockAnnouncer = jasmine.createSpyObj('LiveAnnouncer', ['announce']);

    // Setup default return values
    mockPropertyService.getCountryCodes.and.returnValue([]);
    mockPropertyService.getStates.and.returnValue([]);
    mockPropertyService.getCurrencyData.and.returnValue([]);
    mockPropertyService.getRandomPropertyData.and.returnValue(of({ data: [] }));
    mockPropertyService.getPropertyDetailsByFilter.and.returnValue(of({ 
      data: [], 
      totalrecords: 0, 
      recordlimit: 12 
    }));

    await TestBed.configureTestingModule({
      imports: [AllProperty],
      providers: [
        FormBuilder,
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: ManagePropertyService, useValue: mockPropertyService },
        { provide: ToastService, useValue: mockToastService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: NotifierService, useValue: mockNotifierService },
        { provide: NgxSpinnerService, useValue: mockSpinnerService },
        { provide: Meta, useValue: mockMeta },
        { provide: Title, useValue: mockTitle },
        { provide: LiveAnnouncer, useValue: mockAnnouncer }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllProperty);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default signal values', () => {
    expect(component.isLoading()).toBeFalse();
    expect(component.isLoadingProperties()).toBeFalse();
    expect(component.dataLoaded()).toBeFalse();
    expect(component.selectedSort()).toBe('default');
    expect(component.priceRangeValue()).toBe(5000000);
    expect(component.minPrice()).toBe(0);
    expect(component.maxPrice()).toBe(10000000);
    expect(component.page()).toBe(1);
    expect(component.tableSize()).toBe(12);
  });

  it('should setup page metadata on init', () => {
    expect(mockTitle.setTitle).toHaveBeenCalledWith('All Properties - Find Your Dream Property');
    expect(mockMeta.updateTag).toHaveBeenCalledTimes(5);
  });

  it('should initialize data from services', () => {
    expect(mockPropertyService.getCountryCodes).toHaveBeenCalled();
    expect(mockPropertyService.getStates).toHaveBeenCalled();
    expect(mockPropertyService.getCurrencyData).toHaveBeenCalled();
  });

  it('should compute page metadata correctly', () => {
    const metadata = component.pageMetadata();
    expect(metadata.title).toBe('All Properties - Find Your Dream Property');
    expect(metadata.description).toContain('Browse through our extensive collection');
    expect(metadata.keywords).toContain('properties');
  });

  it('should handle property navigation', () => {
    const propertyId = 'test-property-123';
    component.navigateToDetails(propertyId);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/property/view', propertyId]);
  });

  it('should update signals when loading properties', () => {
    const mockResponse = {
      data: [
        { propertyId: '1', propertyName: 'Test Property', price: 1000000 }
      ]
    };
    
    mockPropertyService.getRandomPropertyData.and.returnValue(of(mockResponse));
    
    component.loadProperties();
    
    expect(component.properties().length).toBe(1);
    expect(component.filteredProperties().length).toBe(1);
  });

  it('should maintain the same UI structure with signals', () => {
    // Test that signals provide the same data structure as before
    expect(component.filteredProperties()).toEqual([]);
    expect(component.featuredProperties()).toEqual([]);
    expect(component.latestProperties()).toEqual([]);
    expect(component.totalItems()).toBe(0);
    expect(component.totalPages()).toBe(0);
  });
});
