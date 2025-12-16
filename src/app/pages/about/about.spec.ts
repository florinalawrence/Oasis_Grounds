import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

import { About } from './about';

describe('About', () => {
  let component: About;
  let fixture: ComponentFixture<About>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockMeta: jasmine.SpyObj<Meta>;
  let mockTitle: jasmine.SpyObj<Title>;

  beforeEach(async () => {
    // Create spies for injected services
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockMeta = jasmine.createSpyObj('Meta', ['updateTag']);
    mockTitle = jasmine.createSpyObj('Title', ['setTitle']);

    await TestBed.configureTestingModule({
      imports: [About],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: Meta, useValue: mockMeta },
        { provide: Title, useValue: mockTitle }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(About);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default values', () => {
    expect(component.isLoading()).toBeFalse();
    expect(component.currentYear()).toBe(new Date().getFullYear());
    expect(component.aboutContent().length).toBe(3);
  });

  it('should setup page metadata on init', () => {
    expect(mockTitle.setTitle).toHaveBeenCalledWith('About US - Oasis Grounds');
    expect(mockMeta.updateTag).toHaveBeenCalledTimes(5);
  });

  it('should have correct about content structure', () => {
    const content = component.getAboutContent();
    expect(content[0].title).toBe('Security');
    expect(content[1].title).toBe('Perfect Tools');
    expect(content[2].title).toBe('Search in Click');
  });

  it('should navigate to home when navigateToHome is called', () => {
    component.navigateToHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should compute page metadata correctly', () => {
    const metadata = component.pageMetadata();
    expect(metadata.title).toBe('About US - Oasis Grounds');
    expect(metadata.description).toContain('Oasis Grounds');
    expect(metadata.keywords).toContain('about');
  });

  it('should maintain the same content as original component', () => {
    const content = component.getAboutContent();
    
    // Verify the content matches the original static content
    expect(content[0].description).toContain('commercially reasonable security measures');
    expect(content[1].description).toContain('Personal information will be used');
    expect(content[2].description).toContain('search response will include a list');
  });
});
