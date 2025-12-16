import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { UserProfilesService } from '../../../services/user-profile.service';

import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockUserProfileService: jasmine.SpyObj<UserProfilesService>;
  let mockMeta: jasmine.SpyObj<Meta>;
  let mockTitle: jasmine.SpyObj<Title>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const userProfileSpy = jasmine.createSpyObj('UserProfilesService', ['getCountryCodes']);
    const metaSpy = jasmine.createSpyObj('Meta', ['updateTag']);
    const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);

    // Mock country codes data
    userProfileSpy.getCountryCodes.and.returnValue([
      { name: 'India', code: 'IN', dial_code: '+91' },
      { name: 'United States', code: 'US', dial_code: '+1' }
    ]);

    await TestBed.configureTestingModule({
      imports: [Home, ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: UserProfilesService, useValue: userProfileSpy },
        { provide: Meta, useValue: metaSpy },
        { provide: Title, useValue: titleSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockUserProfileService = TestBed.inject(UserProfilesService) as jasmine.SpyObj<UserProfilesService>;
    mockMeta = TestBed.inject(Meta) as jasmine.SpyObj<Meta>;
    mockTitle = TestBed.inject(Title) as jasmine.SpyObj<Title>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct carousel images', () => {
    expect(component.carouselImages().length).toBe(3);
    expect(component.totalImages()).toBe(3);
  });

  it('should initialize with correct property types', () => {
    expect(component.propertyTypes().length).toBe(11);
    expect(component.propertyTypes()[0].value).toBe('Plots');
  });

  it('should initialize with correct property statuses', () => {
    expect(component.propertyStatuses().length).toBe(2);
    expect(component.propertyStatuses()[0].value).toBe('Sell');
  });

  it('should setup page metadata on init', () => {
    expect(mockTitle.setTitle).toHaveBeenCalledWith('JMR Real Estate - Find Your Dream Property');
    expect(mockMeta.updateTag).toHaveBeenCalledTimes(6); // description, keywords, og:title, og:description, og:type, robots
  });

  it('should load country codes on init', () => {
    expect(mockUserProfileService.getCountryCodes).toHaveBeenCalled();
    expect(component.countryCodes().length).toBe(2);
  });

  it('should create search form with correct controls', () => {
    const form = component.searchFilterForm();
    expect(form.get('country')).toBeDefined();
    expect(form.get('propertyType')).toBeDefined();
    expect(form.get('status')).toBeDefined();
  });

  it('should handle carousel navigation', () => {
    expect(component.currentSlide()).toBe(0);
    
    component.nextSlide();
    expect(component.currentSlide()).toBe(1);
    
    component.previousSlide();
    expect(component.currentSlide()).toBe(0);
    
    component.goToSlide(2);
    expect(component.currentSlide()).toBe(2);
  });

  it('should handle form changes', () => {
    spyOn(console, 'log');
    
    const countryEvent = { target: { value: 'India' } } as any;
    component.onChangeCountry(countryEvent);
    expect(component.country.value).toBe('India');
    
    const typeEvent = { target: { value: 'Apartments' } } as any;
    component.onChangePropertyType(typeEvent);
    expect(component.propertyType.value).toBe('Apartments');
    
    const statusEvent = { target: { value: 'Sell' } } as any;
    component.onChangeStatus(statusEvent);
    expect(component.status.value).toBe('Sell');
  });

  it('should compute hasSearchCriteria correctly', () => {
    expect(component.hasSearchCriteria()).toBe(false);
    
    component.country.setValue('India');
    expect(component.hasSearchCriteria()).toBe(true);
  });

  it('should compute searchFormData correctly', () => {
    component.country.setValue('India');
    component.propertyType.setValue('Apartments');
    component.status.setValue('Sell');
    
    const formData = component.searchFormData();
    expect(formData.country).toBe('India');
    expect(formData.propertyType).toBe('Apartments');
    expect(formData.status).toBe('Sell');
  });

  it('should handle search form submission', () => {
    component.country.setValue('India');
    component.propertyType.setValue('Apartments');
    component.status.setValue('Sell');
    
    component.onSubmitSearchData();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['all-property'], {
      queryParams: {
        searchWithCountry: 'India',
        type: 'Apartments',
        status: 'Sell',
        pageNo: 1,
        limit: 10
      }
    });
  });

  it('should handle search by city', () => {
    component.onSearchByCity('Mumbai');
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['all-property'], {
      queryParams: {
        city: 'Mumbai',
        pageNo: 1,
        limit: 10
      }
    });
  });

  it('should handle search by country', () => {
    component.onSearchByCountry('India');
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['all-property'], {
      queryParams: {
        searchWithCountry: 'India',
        pageNo: 1,
        limit: 10
      }
    });
  });

  it('should clear search form', () => {
    component.country.setValue('India');
    component.propertyType.setValue('Apartments');
    
    component.onClearSearch();
    
    expect(component.country.value).toBe('');
    expect(component.propertyType.value).toBe('');
    expect(component.searchSubmitted()).toBe(false);
  });

  it('should handle carousel image click', () => {
    spyOn(console, 'log');
    const image = component.carouselImages()[0];
    
    component.onCarouselImageClick(image);
    
    expect(console.log).toHaveBeenCalledWith('Carousel image clicked:', image.alt);
  });

  it('should have correct page metadata computed values', () => {
    const metadata = component.pageMetadata();
    
    expect(metadata.title).toBe('JMR Real Estate - Find Your Dream Property');
    expect(metadata.description).toContain('premium properties');
    expect(metadata.keywords).toContain('real estate');
  });

  it('should handle empty search criteria submission', () => {
    component.onSubmitSearchData();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['all-property']);
  });

  it('should ignore invalid slide navigation', () => {
    component.goToSlide(-1);
    expect(component.currentSlide()).toBe(0);
    
    component.goToSlide(10);
    expect(component.currentSlide()).toBe(0);
  });

  it('should handle empty city search', () => {
    component.onSearchByCity('');
    component.onSearchByCity('   ');
    
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should handle empty country search', () => {
    component.onSearchByCountry('');
    component.onSearchByCountry('   ');
    
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
