import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { ContactAgent } from './contact-agent';

describe('ContactAgent', () => {
  let component: ContactAgent;
  let fixture: ComponentFixture<ContactAgent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactAgent, ReactiveFormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactAgent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default agent data', () => {
    const agent = component.agent();
    expect(agent.name).toBe('John Smith');
    expect(agent.role).toBe('Owner');
    expect(agent.phone).toBe('+1 (555) 123-4567');
    expect(agent.email).toBe('john.smith@jmrrealestate.com');
  });

  it('should initialize with a valid form', () => {
    expect(component.contactForm()).toBeDefined();
    expect(component.contactForm().get('name')).toBeDefined();
    expect(component.contactForm().get('email')).toBeDefined();
    expect(component.contactForm().get('phone')).toBeDefined();
    expect(component.contactForm().get('message')).toBeDefined();
  });

  it('should validate required fields', () => {
    const form = component.contactForm();
    
    expect(form.get('name')?.hasError('required')).toBe(true);
    expect(form.get('email')?.hasError('required')).toBe(true);
    expect(form.get('phone')?.hasError('required')).toBe(true);
    
    expect(component.isFormValid()).toBe(false);
    expect(component.canSubmit()).toBe(false);
  });

  it('should validate email format', () => {
    const emailControl = component.contactForm().get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBe(false);
  });

  it('should validate phone format', () => {
    const phoneControl = component.contactForm().get('phone');
    
    phoneControl?.setValue('invalid-phone');
    expect(phoneControl?.hasError('pattern')).toBe(true);
    
    phoneControl?.setValue('+1234567890');
    expect(phoneControl?.hasError('pattern')).toBe(false);
  });

  it('should handle form submission', () => {
    spyOn(console, 'log');
    
    // Fill form with valid data
    const form = component.contactForm();
    form.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      message: 'Test message'
    });
    
    expect(component.canSubmit()).toBe(true);
    
    component.onSubmit();
    
    expect(component.isSubmitting()).toBe(true);
  });

  it('should handle call agent action', () => {
    spyOn(window.location, 'href', 'set');
    
    component.onCallAgent();
    
    expect(window.location.href).toBe('tel:+1 (555) 123-4567');
  });

  it('should handle email agent action', () => {
    spyOn(window.location, 'href', 'set');
    
    component.onEmailAgent();
    
    expect(window.location.href).toContain('mailto:john.smith@jmrrealestate.com');
    expect(window.location.href).toContain('subject=Property%20Inquiry');
  });

  it('should compute form data correctly', () => {
    const form = component.contactForm();
    form.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      message: 'Test message'
    });
    
    const formData = component.formData();
    
    expect(formData.name).toBe('Test User');
    expect(formData.email).toBe('test@example.com');
    expect(formData.phone).toBe('+1234567890');
    expect(formData.message).toBe('Test message');
  });

  it('should check form control errors correctly', () => {
    const form = component.contactForm();
    const nameControl = form.get('name');
    
    nameControl?.markAsTouched();
    nameControl?.setValue('');
    
    expect(component.hasError('name', 'required')).toBe(true);
    
    nameControl?.setValue('A');
    expect(component.hasError('name', 'minlength')).toBe(true);
    
    nameControl?.setValue('Valid Name');
    expect(component.hasError('name', 'required')).toBe(false);
    expect(component.hasError('name', 'minlength')).toBe(false);
  });
});
