import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';

import { Steps } from './steps';

describe('Steps', () => {
  let component: Steps;
  let fixture: ComponentFixture<Steps>;
  let mockMeta: jasmine.SpyObj<Meta>;
  let mockTitle: jasmine.SpyObj<Title>;

  beforeEach(async () => {
    const metaSpy = jasmine.createSpyObj('Meta', ['updateTag']);
    const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);

    await TestBed.configureTestingModule({
      imports: [Steps],
      providers: [
        { provide: Meta, useValue: metaSpy },
        { provide: Title, useValue: titleSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Steps);
    component = fixture.componentInstance;
    mockMeta = TestBed.inject(Meta) as jasmine.SpyObj<Meta>;
    mockTitle = TestBed.inject(Title) as jasmine.SpyObj<Title>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct steps data', () => {
    expect(component.steps().length).toBe(3);
    expect(component.totalSteps()).toBe(3);
  });

  it('should have correct step data', () => {
    const steps = component.steps();
    expect(steps[0].title).toBe('Search For Real Estates');
    expect(steps[1].title).toBe('Select Your Favorite');
    expect(steps[2].title).toBe('Take Your Key');
  });

  it('should order steps correctly', () => {
    const orderedSteps = component.orderedSteps();
    expect(orderedSteps[0].order).toBe(1);
    expect(orderedSteps[1].order).toBe(2);
    expect(orderedSteps[2].order).toBe(3);
  });

  it('should setup page metadata on init', () => {
    expect(mockTitle.setTitle).toHaveBeenCalledWith('Simple Steps - JMR Real Estate | How to Find Your Property');
    expect(mockMeta.updateTag).toHaveBeenCalledTimes(5); // description, keywords, og:title, og:description, og:type
  });

  it('should have correct page metadata computed values', () => {
    const metadata = component.pageMetadata();
    
    expect(metadata.title).toBe('Simple Steps - JMR Real Estate | How to Find Your Property');
    expect(metadata.description).toContain('Follow our simple 3-step process');
    expect(metadata.keywords).toContain('property search steps');
  });

  it('should handle image errors', () => {
    const mockEvent = {
      target: { src: '' }
    } as any;
    
    component.onImageError(mockEvent);
    
    expect(mockEvent.target.src).toBe('assets/images/no_image.png');
  });

  it('should get correct step number display', () => {
    const step = component.steps()[0];
    expect(component.getStepNumber(step)).toBe('Step 1');
  });

  it('should identify last step correctly', () => {
    const steps = component.steps();
    expect(component.isLastStep(steps[0])).toBe(false); // Step 1
    expect(component.isLastStep(steps[1])).toBe(false); // Step 2
    expect(component.isLastStep(steps[2])).toBe(true);  // Step 3 (last)
  });

  it('should compute total steps correctly', () => {
    expect(component.totalSteps()).toBe(3);
  });
});
