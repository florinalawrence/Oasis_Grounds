import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface Agent {
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  email?: string;
}

@Component({
  selector: 'app-contact-agent',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-agent.html',
  styleUrl: './contact-agent.scss',
})
export class ContactAgent implements OnInit {
  // Angular 20 dependency injection using inject()
  private readonly fb = inject(FormBuilder);

  // Angular 20 signals for reactive state management
  readonly contactForm = signal<FormGroup>(this.createForm());
  readonly isSubmitting = signal<boolean>(false);
  readonly submitSuccess = signal<boolean>(false);
  readonly submitError = signal<string | null>(null);

  readonly agent = signal<Agent>({
    name: 'John Smith',
    role: 'Owner',
    phone: '+1 (555) 123-4567',
    email: 'john.smith@jmrrealestate.com'
  });

  // Computed signals for enhanced functionality
  readonly isFormValid = computed(() => this.contactForm().valid);
  readonly canSubmit = computed(() => this.isFormValid() && !this.isSubmitting());
  
  readonly formData = computed(() => {
    const form = this.contactForm();
    return {
      name: form.get('name')?.value || '',
      email: form.get('email')?.value || '',
      phone: form.get('phone')?.value || '',
      message: form.get('message')?.value || ''
    } as ContactForm;
  });

  ngOnInit(): void {
    // Initialize component
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      message: ['', [Validators.maxLength(500)]]
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    // Simulate API call
    setTimeout(() => {
      try {
        const formData = this.formData();
        console.log('Contact form submitted:', formData);
        
        this.submitSuccess.set(true);
        this.contactForm().reset();
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          this.submitSuccess.set(false);
        }, 3000);
      } catch (error) {
        this.submitError.set('Failed to send message. Please try again.');
      } finally {
        this.isSubmitting.set(false);
      }
    }, 1000);
  }

  /**
   * Handle call agent action
   */
  onCallAgent(): void {
    const phone = this.agent().phone;
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }

  /**
   * Handle email agent action
   */
  onEmailAgent(): void {
    const email = this.agent().email;
    const subject = encodeURIComponent('Property Inquiry');
    const body = encodeURIComponent('Hello, I am interested in learning more about your properties.');
    
    if (email) {
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }
  }

  /**
   * Get form control for validation
   */
  getFormControl(controlName: string): AbstractControl | null {
    return this.contactForm().get(controlName);
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string, errorType: string): boolean {
    const control = this.getFormControl(controlName);
    return !!(control && control.hasError(errorType) && (control.dirty || control.touched));
  }
}
