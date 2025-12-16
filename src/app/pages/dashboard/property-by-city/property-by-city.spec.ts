import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';

import { PropertyByCity } from './property-by-city';

describe('PropertyByCity', () => {
  let component: PropertyByCity;
  let fixture: ComponentFixture<PropertyByCity>;
  let mockMeta: jasmine.SpyObj<Meta>;
  let mockTitle: jasmine.SpyObj<Title>;

  beforeEach(async () => {
    const metaSpy = jasmine.createSpyObj('Meta', ['updateTag']);
    const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);

    await TestBed.configureTestingModule({
      imports: [PropertyByCity],
      providers: [
        { provide: Meta, useValue: metaSpy },
        { provide: Title, useValue: titleSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyByCity);
    component = fixture.componentInstance;
    mockMeta = TestBed.inject(Meta) as jasmine.SpyObj<Meta>;
    mockTitle = TestBed.inject(Title) as jasmine.SpyObj<Title>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct cities data', () => {
    expect(component.cities().length).toBe(4);
    expect(component.totalCities()).toBe(4);
  });

  it('should have correct city data', () => {
    const cities = component.cities();
    expect(cities[0].name).toBe('Chennai');
    expect(cities[1].name).toBe('Muscat');
    expect(cities[2].name).toBe('Tuticorin');
    expect(cities[3].name).toBe('Bangalore');
  });

  it('should setup page metadata on init', () => {
    expect(mockTitle.setTitle).toHaveBeenCalledWith('Properties by City - JMR Real Estate');
    expect(mockMeta.updateTag).toHaveBeenCalledTimes(5); // description, keywords, og:title, og:description, og:type
  });

  it('should have correct page metadata computed values', () => {
    const metadata = component.pageMetadata();
    
    expect(metadata.title).toBe('Properties by City - JMR Real Estate');
    expect(metadata.description).toContain('Explore properties in Chennai, Muscat, Tuticorin, and Bangalore');
    expect(metadata.keywords).toContain('properties by city');
  });

  it('should handle image errors', () => {
    const mockEvent = {
      target: { src: '' }
    } as any;
    
    component.onImageError(mockEvent);
    
    expect(mockEvent.target.src).toBe('assets/images/no_image.png');
  });

  it('should compute total cities correctly', () => {
    expect(component.totalCities()).toBe(4);
  });
});
