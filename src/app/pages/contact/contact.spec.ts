import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxSpinnerModule } from 'ngx-spinner';
import { RecaptchaV3Module, ReCaptchaV3Service } from 'ng-recaptcha';
import { of } from 'rxjs';

import { Contact } from './contact';
import { ContactService } from '../../services/Contact-service/contact.service';
import { ToastService } from '../../services/Toast-service/toast.service';
import { SessionService } from '../../services/Session-service/session.service';

describe('Contact', () => {
  let component: Contact;
  let fixture: ComponentFixture<Contact>;
  let mockContactService: jasmine.SpyObj<ContactService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRecaptchaService: jasmine.SpyObj<ReCaptchaV3Service>;

  beforeEach(async () => {
    const contactServiceSpy = jasmine.createSpyObj('ContactService', ['getCountryCodes', 'saveUserContact']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);
    const recaptchaServiceSpy = jasmine.createSpyObj('ReCaptchaV3Service', ['execute']);

    await TestBed.configureTestingModule({
      imports: [
        Contact,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        NgxSpinnerModule,
        RecaptchaV3Module
      ],
      providers: [
        { provide: ContactService, useValue: contactServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ReCaptchaV3Service, useValue: recaptchaServiceSpy },
        SessionService
      ]
    })
    .compileComponents();

    mockContactService = TestBed.inject(ContactService) as jasmine.SpyObj<ContactService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockRecaptchaService = TestBed.inject(ReCaptchaV3Service) as jasmine.SpyObj<ReCaptchaV3Service>;

    // Setup default mock returns
    mockContactService.getCountryCodes.and.returnValue([
      { name: 'India', dial_code: '+91', code: 'IN' },
      { name: 'United States', dial_code: '+1', code: 'US' }
    ]);
    mockRecaptchaService.execute.and.returnValue(of('mock-token'));

    fixture = TestBed.createComponent(Contact);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.city()).toBe('Nagercoil');
    expect(component.state()).toBe('Tamil Nadu');
    expect(component.country()).toBe('India');
    expect(component.btnSubmitted()).toBe(false);
  });

  it('should load country codes on init', () => {
    expect(mockContactService.getCountryCodes).toHaveBeenCalled();
    expect(component.countryCodes().length).toBe(2);
  });

  it('should have a valid form initially', () => {
    expect(component.contactForm()).toBeDefined();
    expect(component.contactForm().get('fullName')).toBeDefined();
    expect(component.contactForm().get('email')).toBeDefined();
    expect(component.contactForm().get('mobCode')).toBeDefined();
    expect(component.contactForm().get('mobileNo')).toBeDefined();
    expect(component.contactForm().get('message')).toBeDefined();
  });

  it('should validate required fields', () => {
    const form = component.contactForm();
    
    // Test required validation
    expect(form.get('fullName')?.hasError('required')).toBe(true);
    expect(form.get('email')?.hasError('required')).toBe(true);
    expect(form.get('mobCode')?.hasError('required')).toBe(true);
    expect(form.get('mobileNo')?.hasError('required')).toBe(true);
    expect(form.get('message')?.hasError('required')).toBe(true);
  });

  it('should validate email format', () => {
    const emailControl = component.contactForm().get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('pattern')).toBe(true);
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('pattern')).toBe(false);
  });

  it('should update location when onLocationUpdated is called', () => {
    const mockEvent = {
      latitude: 8.1878,
      longitude: 77.4063,
      addressDetails: {
        city: 'New City',
        state: 'New State',
        country: 'New Country',
        landMark: 'New Landmark',
        zipCode: '123456'
      }
    };

    component.onLocationUpdated(mockEvent);

    expect(component.latitude()).toBe(8.1878);
    expect(component.longitude()).toBe(77.4063);
    expect(component.city()).toBe('New City');
    expect(component.state()).toBe('New State');
    expect(component.country()).toBe('New Country');
    expect(component.landMark()).toBe('New Landmark');
    expect(component.zipCode()).toBe('123456');
  });

  it('should submit form with valid data', () => {
    const form = component.contactForm();
    
    // Fill form with valid data
    form.get('fullName')?.setValue('John Doe');
    form.get('email')?.setValue('john@example.com');
    form.get('mobCode')?.setValue('+91');
    form.get('mobileNo')?.setValue('9876543210');
    form.get('message')?.setValue('This is a test message with more than 20 characters');

    mockContactService.saveUserContact.and.returnValue(of({
      headers: { statusCode: 200, message: 'Success' }
    }));

    component.onSubmit();

    expect(component.btnSubmitted()).toBe(true);
    expect(mockRecaptchaService.execute).toHaveBeenCalledWith('importantAction');
  });

  it('should not submit form with invalid data', () => {
    component.onSubmit();

    expect(component.btnSubmitted()).toBe(true);
    expect(mockRecaptchaService.execute).not.toHaveBeenCalled();
  });

  it('should compute page metadata correctly', () => {
    const metadata = component.pageMetadata();
    
    expect(metadata.title).toBe('Contact Us - JMR Real Estate');
    expect(metadata.description).toContain('Get in touch with JMR Real Estate');
    expect(metadata.keywords).toContain('contact');
  });

  it('should compute form validity correctly', () => {
    expect(component.isFormValid()).toBe(false);
    
    const form = component.contactForm();
    form.get('fullName')?.setValue('John Doe');
    form.get('email')?.setValue('john@example.com');
    form.get('mobCode')?.setValue('+91');
    form.get('mobileNo')?.setValue('9876543210');
    form.get('message')?.setValue('This is a test message with more than 20 characters');

    expect(component.isFormValid()).toBe(true);
  });
});
