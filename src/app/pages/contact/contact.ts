import { Component, HostListener, OnInit, inject, signal, computed } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ReCaptchaV3Service, RecaptchaV3Module } from 'ng-recaptcha';
import { ContactService } from '../../services/Contact-service/contact.service';
import { ToastService } from '../../services/Toast-service/toast.service';
import { SessionService } from '../../services/Session-service/session.service';
import { RoutePath } from '../../core/constant/api.constant';
import { environment } from '../../../environments/environment';
import { Meta, Title } from '@angular/platform-browser';

import { MapLocationComponent } from '../map-location/map-location';

interface ContactData {
  name: string;
  phoneNo: string;
  phoneCode: string;
  email: string;
  message: string;
}

interface ContactResponse {
  headers: {
    statusCode: number;
    message: string;
  };
  data?: any;
  errorList?: Record<string, string>;
}

interface CountryCode {
  name: string;
  dial_code: string;
  code: string;
}

@Component({
  selector: 'app-contact',
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    NgxSpinnerModule,
    RecaptchaV3Module,
    MapLocationComponent
  ],
})
export class Contact implements OnInit {
  // Angular 20 dependency injection using inject()
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly contactService = inject(ContactService);
  private readonly recaptchaService = inject(ReCaptchaV3Service);
  private readonly swalToast = inject(ToastService);
  private readonly spinner = inject(NgxSpinnerService);
  private readonly session = inject(SessionService);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  // Angular 20 signals for reactive state management
  readonly contactForm = signal<FormGroup>(this.createForm());
  readonly countryCodes = signal<CountryCode[]>([]);
  readonly btnSubmitted = signal<boolean>(false);
  readonly v3captchaRenderUrl = signal<string>('');
  
  // Map location signals
  readonly city = signal<string>('Nagercoil');
  readonly state = signal<string>('Tamil Nadu');
  readonly landMark = signal<string>('Vasan Eye Care Hospital');
  readonly country = signal<string>('India');
  readonly zipCode = signal<string>('629001');
  readonly latitude = signal<number | undefined>(undefined);
  readonly longitude = signal<number | undefined>(undefined);

  // Contact data signal
  private readonly contactData = signal<ContactData>({
    name: '',
    phoneNo: '',
    phoneCode: '',
    email: '',
    message: '',
  });

  // Computed signals
  readonly pageMetadata = computed(() => ({
    title: 'Contact Us - JMR Real Estate',
    description: 'Get in touch with JMR Real Estate. Contact us for property inquiries, real estate services, and professional assistance. Located in Nagercoil, Tamil Nadu.',
    keywords: 'contact, JMR Real Estate, property inquiry, real estate contact, Nagercoil, Tamil Nadu'
  }));

  readonly isFormValid = computed(() => this.contactForm().valid);
  readonly canSubmit = computed(() => this.isFormValid() && !this.btnSubmitted());

  // Legacy properties for template compatibility
  routePath = RoutePath;

  @HostListener('window:beforeunload')
  onWindowScroll() {
    this.scrollToTop();
  }

  ngOnInit(): void {
    // Setup page metadata for SEO
    this.setupPageMetadata();
    
    this.scrollToTop();
    this.v3captchaRenderUrl.set(`https://www.google.com/recaptcha/enterprise.js?render=${environment.RECAPTCHA_V3_SITE_KEY}`);
    
    this.loadCountryCodes();
  }

 
  private setupPageMetadata(): void {
    const metadata = this.pageMetadata();
    
    this.title.setTitle(metadata.title);
    this.meta.updateTag({ name: 'description', content: metadata.description });
    this.meta.updateTag({ name: 'keywords', content: metadata.keywords });
    this.meta.updateTag({ property: 'og:title', content: metadata.title });
    this.meta.updateTag({ property: 'og:description', content: metadata.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      fullName: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z ]*$'),
        Validators.minLength(3),
        Validators.maxLength(30)
      ]],
      email: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')
      ]],
      mobCode: ['', Validators.required],
      mobileNo: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{3,15}$')
      ]],
      message: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9 !@#$&()\\-`.+,/\"]*$'),
        Validators.minLength(20),
        Validators.maxLength(500)
      ]],
    });
  }

  private loadCountryCodes(): void {
    this.countryCodes.set(this.contactService.getCountryCodes());
  }

  scrollToTop(): void {
    window.scrollTo(0, 0);
  }

  scrollToAnchor(anchorId: string): void {
    const targetElement = document.getElementById(anchorId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onLocationUpdated(event: any): void {
    this.latitude.set(event.latitude);
    this.longitude.set(event.longitude);
    this.city.set(event.addressDetails?.city || '');
    this.state.set(event.addressDetails?.state || '');
    this.country.set(event.addressDetails?.country || '');
    this.landMark.set(event.addressDetails?.landMark || '');
    this.zipCode.set(event.addressDetails?.zipCode || '');
  }

  onSubmit(): void {
    this.btnSubmitted.set(true);

    if (this.contactForm().invalid) {
      Object.keys(this.contactForm().controls).forEach(key => {
        this.contactForm().get(key)?.markAsTouched();
      });
      return;
    }

    this.recaptchaService.execute('importantAction').subscribe({
      next: (token: string) => {
        if (token) {
          this.saveContactFormData();
        } else {
          this.swalToast.showToast('Invalid Captcha', 'error');
          console.error('Invalid Captcha');
        }
      },
      error: (err: any) => {
        this.swalToast.showToast(
          err?.Error ? err.Error : 'Error on validating Captcha',
          'error'
        );
        this.spinner.hide();
      }
    });
  }

  private mapFormData(): void {
    this.contactData.set({
      name: this.FullName.value,
      phoneCode: this.MobCode.value,
      phoneNo: this.MobileNo.value,
      email: this.Email.value,
      message: this.Message.value,
    });
  }

  private saveContactFormData(): void {
    this.spinner.show();
    this.mapFormData();

    this.contactService.saveUserContact(this.contactData()).subscribe({
      next: (res: ContactResponse) => {
        if (res.headers.statusCode === 200) {
          this.swalToast.showToast(res.headers.message, 'success');
          this.resetFormData();
        } else {
          const errorList = res.errorList;
          if (errorList) {
            const errorMessages = Object.values(errorList).join(', ');
            this.swalToast.showToast(errorMessages, 'error');
          }
        }
        this.spinner.hide();
      },
      error: (err: HttpErrorResponse) => {
        const errList = JSON.stringify(err, null, 2).replace(/[{}"]/g, '');
        this.swalToast.showToast(errList, 'error');
        this.spinner.hide();
      },
      complete: () => {
        // Optional: any cleanup after completion
      }
    });
  }

  private resetFormData(): void {
    this.btnSubmitted.set(false);
    this.contactForm().reset();
  }

  // Form control getters (updated for signals)
  get f(): { [key: string]: AbstractControl } {
    return this.contactForm().controls;
  }

  get FullName(): FormControl {
    return this.contactForm().get('fullName') as FormControl;
  }

  get Message(): FormControl {
    return this.contactForm().get('message') as FormControl;
  }

  get Email(): FormControl {
    return this.contactForm().get('email') as FormControl;
  }

  get MobCode(): FormControl {
    return this.contactForm().get('mobCode') as FormControl;
  }

  get MobileNo(): FormControl {
    return this.contactForm().get('mobileNo') as FormControl;
  }
}