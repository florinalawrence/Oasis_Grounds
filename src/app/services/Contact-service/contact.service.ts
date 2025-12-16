import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, throwError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthEndPoints } from '../../core/constant/api.constant';
import { ToastService } from '../Toast-service/toast.service';
import { IUserProfile } from '../../models/User_Model/IUserProfile.model';


import countryData from '../../../assets/countryCodes.json';

// Define proper interfaces
export interface CountryCode {
  code: string;
  name: string;
  dial_code: string;
  emoji?: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  phoneNo: string;
  phoneCode: string;
  message: string;
  recaptchaToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private http = inject(HttpClient);
  private swalToast = inject(ToastService);

  private baseApiUrl: string = environment.baseApiUrl;
  private countryCodes: CountryCode[] = countryData as CountryCode[];
  private userDataSubject = new BehaviorSubject<any>(null);

  userData$ = this.userDataSubject.asObservable();

  /**
   * Get country codes from JSON data
   */
  getCountryCodes(): CountryCode[] {
    return this.countryCodes;
  }

  /**
   * Get country codes as observable
   */
  getCountryCodesObservable(): Observable<CountryCode[]> {
    return of(this.countryCodes);
  }

  /**
   * Search countries by name or dial code
   */
  searchCountries(searchTerm: string): CountryCode[] {
    if (!searchTerm) {
      return this.countryCodes;
    }
    const term = searchTerm.toLowerCase();
    return this.countryCodes.filter(country =>
      country.name.toLowerCase().includes(term) ||
      country.dial_code.includes(searchTerm) ||
      country.code.toLowerCase().includes(term)
    );
  }

  /**
   * Get country by code
   */
  getCountryByCode(code: string): CountryCode | undefined {
    return this.countryCodes.find(country => country.code === code);
  }

  /**
   * Get country by dial code
   */
  getCountryByDialCode(dialCode: string): CountryCode | undefined {
    return this.countryCodes.find(country => country.dial_code === dialCode);
  }

  /**
   * Save user contact information
   */
  saveUserContact(saveReq: any): Observable<any> {
    const headers = this.getHeaders();
    
    return this.http.post<any>(
      `${this.baseApiUrl}${AuthEndPoints.UPDATE_USER_CONTACT}`, 
      saveReq, 
      { headers }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.getErrorMessage(error);
        this.handleError(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Alternative method specifically for contact form submissions
   */
  submitContactForm(contactData: ContactRequest): Observable<any> {
    const headers = this.getHeaders();
    
    return this.http.post<any>(
      `${this.baseApiUrl}/contact/submit`,
      contactData,
      { headers }
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.getErrorMessage(error);
        this.handleError(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Handle error display
   */
  private handleError(errorMessage: string): void {
    // Check what methods are available on ToastService
    if (typeof (this.swalToast as any).showError === 'function') {
      (this.swalToast as any).showError(errorMessage);
    } else if (typeof (this.swalToast as any).showToast === 'function') {
      (this.swalToast as any).showToast(errorMessage, 'error');
    } else if (typeof (this.swalToast as any).show === 'function') {
      (this.swalToast as any).show(errorMessage, 'error');
    } else {
      console.error('Error:', errorMessage);
    }
  }

  /**
   * Get HTTP headers with authentication if available
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    // Add authorization token if available
    const token = this.getAuthToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Get authentication token (adjust based on your auth implementation)
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  /**
   * Extract error message from HTTP error response
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.errorList) {
      const errorList = error.error.errorList;
      if (typeof errorList === 'object' && !Array.isArray(errorList)) {
        return Object.values(errorList).join(', ');
      }
      return Array.isArray(errorList) 
        ? errorList.join(', ') 
        : errorList;
    }
    
    if (error.error?.message) {
      return error.error.message;
    }
    
    if (error.error?.headers?.message) {
      return error.error.headers.message;
    }
    
    if (error.status === 0) {
      return 'Network error. Please check your connection.';
    }
    
    return error.message || 'An error occurred while processing your request';
  }

  /**
   * Update user data in the behavior subject
   */
  updateUserData(userData: any): void {
    this.userDataSubject.next(userData);
  }

  /**
   * Get current user data
   */
  getCurrentUserData(): any {
    return this.userDataSubject.value;
  }

  /**
   * Clear user data
   */
  clearUserData(): void {
    this.userDataSubject.next(null);
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string, countryCode: string): boolean {
    // Basic validation - can be enhanced based on country
    const phoneRegex = /^[0-9]{3,15}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phoneCode: string, phoneNumber: string): string {
    return `${phoneCode} ${phoneNumber}`;
  }
}